# -*- coding: utf-8 -*-
"""
Filtro duro de candidatos (AI Talent Matcher NTT DATA).

Lee las condiciones del candidato ideal (mismo formato que el DTO del backend,
backend/dto/dto_request_candidato_ideal.py) y devuelve SOLO los empleados que
cumplen TODAS las restricciones obligatorias. Los que fallan alguna no se
listan ni se cuentan.

Restricciones duras aplicadas (por código, nunca por el modelo):
  1. anios_experiencia >= anios_experiencia_minimos
  2. disponibilidad dentro de la lista permitida
  3. modalidad_trabajo, si se indica
  4. cada skill con es_obligatoria = True: la tiene (nombre canónico, sinónimo
     o alias de diccionarios.py) con nivel >= nivel_minimo y anios >= anios_minimos
  5. cada idioma con nivel >= nivel_minimo (A1 = 1 ... C2 = 6, Nativo = 7)
  6. cada certificación exigida (por código o por nombre)

No filtran (son del filtro blando / scoring): rol, sector, skills deseables
(es_obligatoria = False) y top_k. feedback.parquet y relaciones.parquet solo
tienen ponderaciones (DTO_ponderacion_filtro_blando), ninguna condición
excluyente, así que no intervienen en este filtro.

Uso (desde cualquier carpeta):
    python filtro_duro.py                  # usa requisitos.json de esta carpeta
    python filtro_duro.py mis_requisitos.json

Salida: candidatos_filtro_duro.csv (employee_id, nombre_completo) en esta carpeta.
"""

import importlib.util
import json
import sys
import unicodedata
from pathlib import Path

import duckdb

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[1]
PERFILES = RAIZ / "dataAnalysis" / "Procesado" / "profiles_procesado.parquet"
SALIDA = AQUI / "candidatos_filtro_duro.csv"
REQUISITOS_POR_DEFECTO = AQUI / "requisitos.json"


def _cargar_modulo(nombre: str, ruta: Path):
    """Carga un .py por ruta, sin depender del sys.path ni de los __init__."""
    spec = importlib.util.spec_from_file_location(nombre, ruta)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


# Mismo DTO que usa el backend y mismos diccionarios que la limpieza
_dto = _cargar_modulo("dto_request_candidato_ideal", RAIZ / "backend" / "dto" / "dto_request_candidato_ideal.py")
_dic = _cargar_modulo("diccionarios", RAIZ / "dataAnalysis" / "Procesado" / "diccionarios.py")
DTO_request_candidato_ideal = _dto.DTO_request_candidato_ideal


def norm(texto) -> str:
    """Minúsculas, sin acentos y sin espacios sobrantes."""
    t = unicodedata.normalize("NFKD", str(texto or "")).encode("ascii", "ignore").decode()
    return " ".join(t.lower().split())


# ───────────── Equivalencias de skills (deterministas) ─────────────
_CANONICAS = {norm(c) for c in _dic.SKILL_ALIAS}
_CANONICAS |= {norm(c) for c in _dic.SKILL_SINONIMOS.values()}
_CANONICAS |= {norm(s) for lista in _dic.SKILL_EXPANSION.values() for s in lista}
_SINONIMO = {norm(k): norm(v) for k, v in _dic.SKILL_SINONIMOS.items()}
_EXPANSION = {norm(k): {norm(s) for s in v} for k, v in _dic.SKILL_EXPANSION.items()}
_ALIAS = {}
for canonica, alias in _dic.SKILL_ALIAS.items():
    for a in alias:
        _ALIAS.setdefault(norm(a), set()).add(norm(canonica))


def skills_aceptadas(nombre: str) -> set:
    """Nombres (normalizados) que satisfacen una skill exigida."""
    n = norm(nombre)
    if n in _SINONIMO:
        return {_SINONIMO[n]}
    if n in _EXPANSION:
        return _EXPANSION[n]
    if n in _CANONICAS:
        return {n}
    return {n} | _ALIAS.get(n, set())


_NIVEL_IDIOMA = {k.upper(): v for k, v in _dic.NIVEL_IDIOMA.items()}
_IDIOMA_SINONIMO = {norm(k): norm(v) for k, v in _dic.IDIOMA_SINONIMOS.items()}


def nivel_idioma(nivel: str) -> int:
    """A1 = 1 ... C2 = 6, Nativo = 7. Un nivel desconocido no se puede exigir."""
    n = str(nivel).strip().upper()
    if n not in _NIVEL_IDIOMA:
        raise ValueError(f"Nivel de idioma desconocido: {nivel!r} (válidos: {list(_dic.NIVEL_IDIOMA)})")
    return _NIVEL_IDIOMA[n]


def idioma_canonico(idioma: str) -> str:
    n = norm(idioma)
    return _IDIOMA_SINONIMO.get(n, n)


# ───────────── Comprobaciones por perfil ─────────────
def cumple_skill(perfil_skills, aceptadas: set, nivel_min: int, anios_min: float) -> bool:
    for s in perfil_skills or []:
        nombres = {norm(s.get("skill")), norm(s.get("skill_original"))}
        nombres |= {norm(a) for a in (s.get("alias") or [])}
        if nombres & aceptadas and (s.get("nivel") or 0) >= nivel_min and (s.get("anios") or 0) >= anios_min:
            return True
    return False


def cumple_idioma(perfil_idiomas, idioma: str, nivel_min: int) -> bool:
    for i in perfil_idiomas or []:
        if norm(i.get("idioma")) == idioma and (i.get("nivel_num") or 0) >= nivel_min:
            return True
    return False


def cumple_certificacion(perfil_certs, cert: str) -> bool:
    c = norm(cert)
    for p in perfil_certs or []:
        campos = [p.get("nombre"), p.get("codigo"), p.get("nombre_original")]
        if any(c and (c == norm(x) or c in norm(x)) for x in campos if x):
            return True
    return False


# ───────────── Filtro ─────────────
def filtrar(ideal) -> list:
    # 1-3: restricciones escalares en SQL sobre el parquet
    where = ["anios_experiencia >= ?"]
    params = [int(ideal.anios_experiencia_minimos)]
    if ideal.disponibilidad:
        where.append(f"disponibilidad IN ({', '.join('?' * len(ideal.disponibilidad))})")
        params += list(ideal.disponibilidad)
    if ideal.modalidad_trabajo:
        where.append("modalidad_trabajo = ?")
        params.append(ideal.modalidad_trabajo)

    columnas = ["employee_id", "nombre_completo"]
    obligatorias = [s for s in ideal.skills if s.es_obligatoria]
    if obligatorias:
        columnas.append("skills")
    if ideal.idiomas:
        columnas.append("idiomas")
    if ideal.certificaciones:
        columnas.append("certificaciones")

    ruta = str(PERFILES).replace("\\", "/")
    con = duckdb.connect()
    try:
        cur = con.execute(
            f"SELECT {', '.join(columnas)} FROM '{ruta}' WHERE {' AND '.join(where)} ORDER BY employee_id",
            params,
        )
        nombres_col = [d[0] for d in cur.description]
        filas = [dict(zip(nombres_col, f)) for f in cur.fetchall()]
    finally:
        con.close()

    # 4-6: restricciones sobre listas (skills, idiomas, certificaciones)
    req_skills = [(skills_aceptadas(s.nombre), int(s.nivel_minimo), float(s.anios_minimos)) for s in obligatorias]
    req_idiomas = [(idioma_canonico(i.idioma), nivel_idioma(i.nivel_minimo)) for i in ideal.idiomas]
    req_certs = [c for c in ideal.certificaciones if str(c).strip()]

    resultado = []
    for f in filas:
        if not all(cumple_skill(f.get("skills"), a, n, y) for a, n, y in req_skills):
            continue
        if not all(cumple_idioma(f.get("idiomas"), i, n) for i, n in req_idiomas):
            continue
        if not all(cumple_certificacion(f.get("certificaciones"), c) for c in req_certs):
            continue
        resultado.append((f["employee_id"], f["nombre_completo"]))
    return resultado


def main():
    ruta_req = Path(sys.argv[1]) if len(sys.argv) > 1 else REQUISITOS_POR_DEFECTO
    with open(ruta_req, encoding="utf-8") as fh:
        ideal = DTO_request_candidato_ideal.from_dict(json.load(fh))

    candidatos = filtrar(ideal)

    with open(SALIDA, "w", encoding="utf-8-sig", newline="") as fh:
        fh.write("employee_id,nombre_completo\n")
        for emp_id, nombre in candidatos:
            fh.write(f'{emp_id},"{str(nombre).replace(chr(34), chr(39))}"\n')

    print(f"{len(candidatos)} candidatos cumplen todas las restricciones -> {SALIDA}")


if __name__ == "__main__":
    main()
