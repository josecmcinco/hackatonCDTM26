# -*- coding: utf-8 -*-
"""
Filtro blando de candidatos (AI Talent Matcher NTT DATA).

1. Aplica el filtro duro (FiltroDuro/filtro_duro.py) con las condiciones del
   candidato ideal (requisitos.json, formato DTO_request_candidato_ideal).
2. A cada candidato que lo pasa le calcula una puntuación de 0 a 1 por factor,
   cruzando tres bases de datos:
     - Procesado/profiles_procesado.parquet  (perfil)
     - Ficticio/feedback.parquet             (interés de cambio y puesto objetivo)
     - Ficticio/relaciones.parquet           (matriz de relaciones entre compañeros)
3. Hace la suma ponderada con los pesos de DTO_ponderacion_filtro_blando
   (ponderaciones.json) y devuelve el ranking de mayor a menor score (0-100):

       score = 100 * Σ(peso_i · puntuacion_i) / Σ(peso_i)

   Solo entran en la suma los factores con peso > 0 que se pueden evaluar para
   esta petición (p. ej. `modalidad_trabajo` solo si el ideal pide una).

Uso (desde cualquier carpeta):
    python filtro_blando.py                                   # requisitos.json de FiltroDuro + ponderaciones.json de aquí
    python filtro_blando.py mis_requisitos.json mis_pesos.json

Opcional en requisitos.json: "equipo_actual": ["NTT0000001", ...] con los
integrantes ya elegidos. Si se indica, `compatibilidad_equipo` mide la relación
del candidato con ellos; si no, mide cómo le valoran sus compañeros en general.

Salida: candidatos_filtro_blando.csv en esta carpeta (posicion, employee_id,
nombre_completo, score y la puntuación 0-100 de cada factor usado).
"""

import importlib.util
import json
import re
import sys
from pathlib import Path

import duckdb

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[1]
PERFILES = RAIZ / "dataAnalysis" / "Procesado" / "profiles_procesado.parquet"
FEEDBACK = RAIZ / "dataAnalysis" / "Ficticio" / "feedback.parquet"
RELACIONES = RAIZ / "dataAnalysis" / "Ficticio" / "relaciones.parquet"
REQUISITOS_POR_DEFECTO = RAIZ / "dataAnalysis" / "FiltroDuro" / "requisitos.json"
PONDERACIONES_POR_DEFECTO = AQUI / "ponderaciones.json"
SALIDA = AQUI / "candidatos_filtro_blando.csv"


def _cargar_modulo(nombre: str, ruta: Path):
    """Carga un .py por ruta, sin depender del sys.path ni de los __init__."""
    spec = importlib.util.spec_from_file_location(nombre, ruta)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


# Mismo filtro duro, mismas equivalencias de skills y mismo DTO de pesos que el backend
_fd = _cargar_modulo("filtro_duro", RAIZ / "dataAnalysis" / "FiltroDuro" / "filtro_duro.py")
_pond = _cargar_modulo("dto_ponderacion_filtro_blando", RAIZ / "backend" / "dto" / "dto_ponderacion_filtro_blando.py")
DTO_ponderacion_filtro_blando = _pond.DTO_ponderacion_filtro_blando
norm = _fd.norm


def _ruta(p: Path) -> str:
    return str(p).replace("\\", "/")


# ───────────── Utilidades de texto ─────────────
_STOP = {"de", "del", "la", "el", "los", "las", "en", "y", "e", "o", "u", "a", "para", "con", "por",
         "un", "una", "al", "the", "and", "of", "for", "to", "in", "senior", "junior", "mid", "lead",
         "principal", "trainee",
         # Palabras genéricas de una petición que no identifican ningún rol
         "especialista", "experto", "experta", "perfil", "profesional", "refuerzo", "necesitamos", "buscamos"}

# Rol canónico (EN) -> nombre en español y alias, de la limpieza (diccionarios.py)
_ROLES = _fd._dic.ROLES
_SENIORITIES = tuple(s + " " for s in _fd._dic.SENIORITY_ORD)


def textos_de_puesto(puesto) -> list:
    """Un puesto ("Senior SOC Analyst") y todas sus formas: rol base, nombre en español y alias."""
    if not puesto:
        return []
    base = str(puesto)
    for s in _SENIORITIES:
        if base.startswith(s):
            base = base[len(s):]
            break
    rol_es, alias = _ROLES.get(base, (None, []))
    return [puesto, base] + ([rol_es] if rol_es else []) + list(alias)


def tokens(texto) -> list:
    """Palabras significativas, normalizadas (sin acentos ni mayúsculas)."""
    return [t for t in re.split(r"[^a-z0-9+#]+", norm(texto)) if len(t) >= 3 and t not in _STOP]


def _coincide(a: str, b: str) -> bool:
    """Dos palabras coinciden si son iguales o comparten raíz (5 primeras letras)."""
    return a == b or (len(a) >= 5 and len(b) >= 5 and a[:5] == b[:5])


def afinidad(consulta, *textos) -> float:
    """Fracción de palabras de la consulta que aparecen en alguno de los textos (0-1)."""
    q = tokens(consulta)
    if not q:
        return 0.0
    destino = [t for txt in textos for t in tokens(txt)]
    return sum(any(_coincide(a, b) for b in destino) for a in q) / len(q)


def _limitar(x: float) -> float:
    return max(0.0, min(1.0, float(x)))


# ───────────── Tablas de puntuación ─────────────
PUNTOS_DISPONIBILIDAD = {"En banca": 1.0, "Roll-off próximo (<3 meses)": 0.7, "Asignado": 0.3}
PUNTOS_ESTUDIOS = {"FP Superior": 0.5, "Grado": 0.7, "Máster": 0.9, "Doctorado": 1.0}
PESO_SKILL_OBLIGATORIA = 1.0
PESO_SKILL_DESEABLE = 0.5
NEUTRO = 0.5  # Valor cuando no hay datos (p. ej. sin relaciones con el equipo)


class Contexto:
    """Datos de la petición precalculados una sola vez para todos los candidatos."""

    def __init__(self, ideal, equipo_actual):
        self.ideal = ideal
        self.equipo = [e for e in dict.fromkeys(equipo_actual or [])]
        self.consulta_rol = ideal.rol or ideal.descripcion_necesidad or ""
        self.req_skills = [
            (s, _fd.skills_aceptadas(s.nombre),
             PESO_SKILL_OBLIGATORIA if s.es_obligatoria else PESO_SKILL_DESEABLE)
            for s in ideal.skills
        ]
        self.todas_aceptadas = set().union(*[a for _, a, _ in self.req_skills]) if self.req_skills else set()
        self.req_idiomas = [(_fd.idioma_canonico(i.idioma), _fd.nivel_idioma(i.nivel_minimo)) for i in ideal.idiomas]
        self.sector = norm(ideal.sector) if ideal.sector else None
        self.texto_necesidad = " ".join(
            [ideal.rol or "", ideal.descripcion_necesidad or "", ideal.sector or ""] + [s.nombre for s in ideal.skills]
        )


def _nombres_skill(s: dict) -> set:
    return {norm(s.get("skill")), norm(s.get("skill_original"))} | {norm(a) for a in (s.get("alias") or [])}


def _tecnologia_relevante(tecnologias, ctx: Contexto) -> bool:
    return any(norm(t) in ctx.todas_aceptadas for t in (tecnologias or []))


# ───────────── Factores (cada uno devuelve 0-1, o None si no aplica) ─────────────
def f_skills(p, ctx):
    """Media ponderada por skill pedida: nivel (55 %), años (25 %) y evidencias en proyectos (20 %).
    Las obligatorias pesan el doble que las deseables; una skill que no tiene puntúa 0."""
    if not ctx.req_skills:
        return None
    total = peso_total = 0.0
    for _, aceptadas, peso in ctx.req_skills:
        mejor = 0.0
        for s in p.get("skills") or []:
            if _nombres_skill(s) & aceptadas:
                valor = (0.55 * (s.get("nivel") or 0) / 5
                         + 0.25 * min((s.get("anios") or 0) / 5, 1)
                         + 0.20 * min((s.get("evidencias") or 0) / 3, 1))
                mejor = max(mejor, valor)
        total += peso * mejor
        peso_total += peso
    return total / peso_total


def f_anios_experiencia(p, ctx):
    """50 % por cumplir el mínimo, sube hasta 100 % con 8 años por encima."""
    exceso = (p.get("anios_experiencia") or 0) - ctx.ideal.anios_experiencia_minimos
    return 0.5 + 0.5 * _limitar(exceso / 8)


def f_anios_en_ntt(p, ctx):
    return _limitar((p.get("anios_en_ntt") or 0) / 10)


def f_nivel_seniority(p, ctx):
    return _limitar((p.get("seniority_nivel") or 0) / 5)


def f_rol(p, ctx):
    if not ctx.consulta_rol:
        return None
    candidatos = [p.get("rol"), p.get("rol_es")] + list(p.get("rol_alias") or [])
    return max(afinidad(ctx.consulta_rol, c) for c in candidatos if c) if any(candidatos) else 0.0


def f_puesto_actual(p, ctx):
    """Como `rol`, pero sobre el puesto que ocupa hoy (traducido con el diccionario de roles)."""
    if not ctx.consulta_rol:
        return None
    textos = textos_de_puesto(p.get("puesto_actual"))
    return max((afinidad(ctx.consulta_rol, t) for t in textos), default=0.0)


def f_area(p, ctx):
    """1 si el área encaja con el rol pedido o es el área de las skills pedidas que tiene."""
    if not ctx.consulta_rol and not ctx.req_skills:
        return None
    area = p.get("area")
    if ctx.consulta_rol and afinidad(area, ctx.consulta_rol) > 0:
        return 1.0
    areas_skills = {s.get("area_skill") for s in p.get("skills") or [] if _nombres_skill(s) & ctx.todas_aceptadas}
    return 1.0 if area in areas_skills else 0.0


def f_sector_principal(p, ctx):
    """Sector principal = 1; si solo tiene proyectos en el sector, 0,5-0,8 según cuántos; si no, 0."""
    if not ctx.sector:
        return None
    if norm(p.get("sector_principal")) == ctx.sector:
        return 1.0
    for e in p.get("experiencia_sectorial") or []:
        if norm(e.get("sector")) == ctx.sector:
            return 0.5 + 0.1 * min(e.get("n_proyectos") or 0, 3)
    return 0.0


def f_disponibilidad(p, ctx):
    return PUNTOS_DISPONIBILIDAD.get(p.get("disponibilidad"), 0.0)


def f_modalidad_trabajo(p, ctx):
    pedida = ctx.ideal.modalidad_trabajo
    if not pedida:
        return None
    if p.get("modalidad_trabajo") == pedida:
        return 1.0
    return 0.5 if p.get("modalidad_trabajo") == "Híbrido" else 0.0


def f_movilidad_internacional(p, ctx):
    return 1.0 if p.get("movilidad_internacional") else 0.0


def f_pais(p, ctx):
    return None  # El candidato ideal aún no tiene ubicación objetivo


def f_ciudad(p, ctx):
    return None  # El candidato ideal aún no tiene ubicación objetivo


def f_metodologias(p, ctx):
    """Metodologías citadas en la necesidad; si no cita ninguna, amplitud (4 o más = 1)."""
    metodos = p.get("metodologias") or []
    citadas = [m for m in metodos if norm(m) and norm(m) in norm(ctx.texto_necesidad)]
    return 1.0 if citadas else _limitar(len(metodos) / 4) * 0.6


def f_habilidades_blandas(p, ctx):
    return _limitar(len(p.get("habilidades_blandas") or []) / 4)


def f_idiomas(p, ctx):
    """Por idioma pedido: 0,6 por cumplir el mínimo y hasta 1 según cuánto lo supera (Nativo = máximo)."""
    if not ctx.req_idiomas:
        return None
    puntos = []
    for idioma, minimo in ctx.req_idiomas:
        nivel = max((i.get("nivel_num") or 0 for i in p.get("idiomas") or [] if norm(i.get("idioma")) == idioma),
                    default=0)
        if nivel < minimo:
            puntos.append(0.0)
        else:
            puntos.append(1.0 if minimo >= 7 else 0.6 + 0.4 * (nivel - minimo) / (7 - minimo))
    return sum(puntos) / len(puntos)


def f_certificaciones(p, ctx):
    """Certificaciones relacionadas con las skills o el rol pedido (2 o más = 1)."""
    referencia = ctx.consulta_rol + " " + " ".join(s.nombre for s, _, _ in ctx.req_skills)
    relevantes = 0
    for c in p.get("certificaciones") or []:
        texto = f"{c.get('nombre')} {c.get('area_certificacion')} {c.get('codigo')}"
        if afinidad(texto, referencia) > 0 or any(a in norm(texto) for a in ctx.todas_aceptadas if len(a) >= 3):
            relevantes += 1
    return _limitar(relevantes / 2)


def f_estudios(p, ctx):
    base = PUNTOS_ESTUDIOS.get(p.get("nivel_estudios_max"), 0.4)
    stem = any(e.get("es_stem") for e in p.get("estudios") or [])
    return _limitar(base + (0.1 if stem else 0.0))


def f_experiencia(p, ctx):
    """Años en empleos donde usó alguna skill pedida (5 años o más = 1)."""
    if not ctx.req_skills:
        return None
    anios = sum(e.get("duracion_anios") or 0 for e in p.get("experiencia") or []
                if _tecnologia_relevante(e.get("tecnologias"), ctx))
    return _limitar(anios / 5)


def f_proyectos(p, ctx):
    """Proyectos relevantes: tecnología pedida (0,5) + sector pedido (0,3) + rol afín (0,2). Suma 3 = 1."""
    total = 0.0
    for pr in p.get("proyectos") or []:
        r = 0.0
        if _tecnologia_relevante(pr.get("tecnologias"), ctx):
            r += 0.5
        if ctx.sector and norm(pr.get("cliente_sector")) == ctx.sector:
            r += 0.3
        if ctx.consulta_rol and afinidad(ctx.consulta_rol, pr.get("rol_base") or pr.get("rol")) > 0:
            r += 0.2
        total += r
    return _limitar(total / 3)


def f_resumen(p, ctx):
    return afinidad(ctx.texto_necesidad, p.get("resumen"))


# Feedback
def f_puesto_objetivo(p, ctx):
    """1 si el puesto al que aspira coincide con el rol pedido."""
    if not ctx.consulta_rol:
        return None
    textos = textos_de_puesto(p.get("puesto_objetivo"))
    if not textos:
        return NEUTRO
    return max(afinidad(ctx.consulta_rol, t) for t in textos)


def f_interes_cambio(p, ctx):
    """Si el rol pedido es su puesto actual, premia poco interés por cambiar (menos riesgo de salida);
    si es un rol distinto, premia mucho interés (más motivación)."""
    ic = p.get("interes_cambio")
    if ic is None:
        return NEUTRO
    interes = (ic - 1) / 4
    encaje = f_rol(p, ctx) or 0.0
    return encaje * (1 - interes) + (1 - encaje) * interes


def f_distancia_rol(p, ctx):
    """1 = su objetivo es su puesto actual (estable); 0 = quiere irse a un área muy distinta."""
    d = p.get("distancia_rol")
    return NEUTRO if d is None else 1 - (d - 1) / 4


# Relaciones
def f_compatibilidad_equipo(p, ctx):
    """Valoraciones 1-5 de la matriz de relaciones pasadas a 0-1. Sin datos = neutro (0,5).
    Con equipo_actual: media en ambos sentidos con los integrantes; sin él: cómo le valoran sus compañeros."""
    media = p.get("_compatibilidad_media")
    return NEUTRO if media is None else (media - 1) / 4


FACTORES = {
    "area": f_area, "rol": f_rol, "nivel_seniority": f_nivel_seniority, "puesto_actual": f_puesto_actual,
    "anios_experiencia": f_anios_experiencia, "anios_en_ntt": f_anios_en_ntt,
    "sector_principal": f_sector_principal, "disponibilidad": f_disponibilidad,
    "modalidad_trabajo": f_modalidad_trabajo, "movilidad_internacional": f_movilidad_internacional,
    "pais": f_pais, "ciudad": f_ciudad,
    "skills": f_skills, "metodologias": f_metodologias, "habilidades_blandas": f_habilidades_blandas,
    "idiomas": f_idiomas, "certificaciones": f_certificaciones,
    "estudios": f_estudios, "experiencia": f_experiencia, "proyectos": f_proyectos, "resumen": f_resumen,
    "interes_cambio": f_interes_cambio, "puesto_objetivo": f_puesto_objetivo, "distancia_rol": f_distancia_rol,
    "compatibilidad_equipo": f_compatibilidad_equipo,
}


# ───────────── Carga de datos ─────────────
COLUMNAS_PERFIL = [
    "employee_id", "nombre_completo", "area", "rol", "rol_es", "rol_alias", "nivel_seniority", "seniority_nivel",
    "puesto_actual", "anios_experiencia", "anios_en_ntt", "sector_principal", "experiencia_sectorial",
    "disponibilidad", "modalidad_trabajo", "movilidad_internacional", "pais", "ciudad", "skills",
    "metodologias", "habilidades_blandas", "idiomas", "certificaciones", "estudios", "nivel_estudios_max",
    "experiencia", "proyectos", "resumen",
]


def cargar_candidatos(ids: list, ctx: Contexto, usar_feedback: bool, usar_relaciones: bool) -> list:
    """Perfil completo + feedback + compatibilidad agregada de los candidatos que pasan el filtro duro."""
    con = duckdb.connect()
    try:
        con.execute("CREATE TEMP TABLE cand AS SELECT unnest(?::VARCHAR[]) AS employee_id", [ids])
        cols = ", ".join(f"p.{c}" for c in COLUMNAS_PERFIL)
        joins, extra = "", ""
        if usar_feedback:
            extra += ", f.interes_cambio, f.puesto_objetivo, f.distancia_rol"
            joins += f" LEFT JOIN '{_ruta(FEEDBACK)}' f USING (employee_id)"
        cur = con.execute(f"SELECT {cols}{extra} FROM '{_ruta(PERFILES)}' p JOIN cand USING (employee_id){joins}")
        nombres = [d[0] for d in cur.description]
        perfiles = {f[0]: dict(zip(nombres, f)) for f in cur.fetchall()}

        if usar_relaciones:
            rel = _ruta(RELACIONES)
            if ctx.equipo:
                con.execute("CREATE TEMP TABLE equipo AS SELECT unnest(?::VARCHAR[]) AS employee_id", [ctx.equipo])
                sql = f"""
                    SELECT cand_id, avg(valoracion) FROM (
                        SELECT evaluador_id AS cand_id, valoracion FROM '{rel}'
                        WHERE evaluador_id IN (SELECT employee_id FROM cand) AND evaluado_id IN (SELECT employee_id FROM equipo)
                        UNION ALL
                        SELECT evaluado_id AS cand_id, valoracion FROM '{rel}'
                        WHERE evaluado_id IN (SELECT employee_id FROM cand) AND evaluador_id IN (SELECT employee_id FROM equipo)
                    ) GROUP BY cand_id"""
            else:
                sql = f"""SELECT evaluado_id, avg(valoracion) FROM '{rel}'
                          WHERE evaluado_id IN (SELECT employee_id FROM cand) GROUP BY evaluado_id"""
            for emp_id, media in con.execute(sql).fetchall():
                if emp_id in perfiles:
                    perfiles[emp_id]["_compatibilidad_media"] = float(media)
    finally:
        con.close()
    return [perfiles[i] for i in ids if i in perfiles]


# ───────────── Scoring ─────────────
def puntuar(candidatos: list, ctx: Contexto, pesos) -> tuple:
    """Devuelve (ranking, factores_usados, factores_no_aplicables)."""
    activos = pesos.activas()
    no_aplicables, usados = [], []
    for nombre in activos:
        if nombre not in FACTORES:
            no_aplicables.append(nombre)  # Campo nuevo en el DTO sin función de puntuación todavía
        elif candidatos and FACTORES[nombre](candidatos[0], ctx) is None:
            no_aplicables.append(nombre)
        else:
            usados.append(nombre)

    ranking = []
    for p in candidatos:
        detalle, suma, suma_pesos = {}, 0.0, 0.0
        for nombre in usados:
            valor = FACTORES[nombre](p, ctx)
            if valor is None:
                continue
            detalle[nombre] = valor
            suma += activos[nombre] * valor
            suma_pesos += activos[nombre]
        score = 100 * suma / suma_pesos if suma_pesos else 0.0
        ranking.append({"employee_id": p["employee_id"], "nombre_completo": p["nombre_completo"],
                        "score": round(score, 2), "detalle": detalle})

    ranking.sort(key=lambda r: (-r["score"], r["employee_id"]))
    return ranking, usados, no_aplicables


def ejecutar(requisitos: dict, ponderaciones: dict = None) -> dict:
    """Filtro duro + filtro blando. Devuelve el ranking completo y los metadatos del cálculo."""
    ideal = _fd.DTO_request_candidato_ideal.from_dict(requisitos)
    pesos = DTO_ponderacion_filtro_blando.from_dict(ponderaciones or requisitos.get("ponderaciones"))
    ctx = Contexto(ideal, requisitos.get("equipo_actual"))

    ids = [emp_id for emp_id, _ in _fd.filtrar(ideal)]
    ids = [i for i in ids if i not in set(ctx.equipo)]  # Los que ya están en el equipo no compiten
    activos = pesos.activas()
    usar_feedback = any(c in activos for c in ("interes_cambio", "puesto_objetivo", "distancia_rol"))
    candidatos = cargar_candidatos(ids, ctx, usar_feedback, "compatibilidad_equipo" in activos)
    ranking, usados, no_aplicables = puntuar(candidatos, ctx, pesos)
    return {"total_filtro_duro": len(ids), "ranking": ranking, "factores_usados": usados,
            "factores_no_aplicables": no_aplicables, "pesos": {k: activos[k] for k in usados}}


def guardar_csv(resultado: dict, ruta: Path = SALIDA):
    usados = resultado["factores_usados"]
    with open(ruta, "w", encoding="utf-8-sig", newline="") as fh:
        fh.write(",".join(["posicion", "employee_id", "nombre_completo", "score"] + usados) + "\n")
        for pos, r in enumerate(resultado["ranking"], 1):
            nombre = '"' + str(r["nombre_completo"]).replace('"', "'") + '"'
            valores = [f"{100 * r['detalle'].get(f, 0):.1f}" for f in usados]
            fh.write(",".join([str(pos), r["employee_id"], nombre, f"{r['score']:.2f}"] + valores) + "\n")


def main():
    ruta_req = Path(sys.argv[1]) if len(sys.argv) > 1 else REQUISITOS_POR_DEFECTO
    ruta_pesos = Path(sys.argv[2]) if len(sys.argv) > 2 else PONDERACIONES_POR_DEFECTO
    with open(ruta_req, encoding="utf-8") as fh:
        requisitos = json.load(fh)
    ponderaciones = None
    if ruta_pesos.exists():
        with open(ruta_pesos, encoding="utf-8") as fh:
            ponderaciones = json.load(fh)

    resultado = ejecutar(requisitos, ponderaciones)
    guardar_csv(resultado)

    print(f"{resultado['total_filtro_duro']} candidatos pasan el filtro duro -> {SALIDA}")
    print("Pesos usados:", ", ".join(f"{k}={v:g}" for k, v in resultado["pesos"].items()))
    if resultado["factores_no_aplicables"]:
        print("Sin efecto en esta petición:", ", ".join(resultado["factores_no_aplicables"]))
    for pos, r in enumerate(resultado["ranking"][:10], 1):
        print(f"{pos:>3}. {r['employee_id']}  {r['score']:6.2f}  {r['nombre_completo']}")


if __name__ == "__main__":
    main()
