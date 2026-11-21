"""
CandidatosService
=================
Smart Candidate Matching y formación de equipos.

El matching usa los dos filtros de dataAnalysis como única fuente de verdad:

1. Filtro duro  -> dataAnalysis/FiltroDuro/filtro_duro.py  (`filtrar`)
   Excluye a quien no cumple experiencia mínima, disponibilidad, modalidad,
   skills obligatorias (nivel y años), idiomas y certificaciones exigidas.
2. Filtro blando -> dataAnalysis/FiltroBlando/filtro_blando.py (`puntuar`)
   Puntúa de 0 a 1 cada factor y hace la suma ponderada con los pesos de
   DTO_ponderacion_filtro_blando que llegan en el request:

       fit_score = 100 * Σ(peso_i · puntuacion_i) / Σ(peso_i)

Este servicio solo orquesta: carga los módulos, pasa las ponderaciones y el
equipo ya formado, y añade a cada candidato el desglose del score y las
explicaciones (fortalezas, gaps, riesgos, evidencias) para la UI.
"""

import importlib.util
import os
from pathlib import Path
from typing import List, Dict, Any, Optional, Set, Union

import duckdb

from repository import CandidatosRepository
from dto import DTO_request_candidato_ideal, DTO_request_obtener_candidatos, DTO_ponderacion_filtro_blando

RAIZ = Path(__file__).resolve().parents[2]


def _cargar_modulo(nombre: str, ruta: Path):
    """Carga un .py por ruta (igual que hacen los scripts de dataAnalysis)."""
    spec = importlib.util.spec_from_file_location(nombre, ruta)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


# filtro_blando carga a su vez filtro_duro, diccionarios y los DTOs
_fb = _cargar_modulo("filtro_blando", RAIZ / "dataAnalysis" / "FiltroBlando" / "filtro_blando.py")
_fd = _fb._fd
norm = _fb.norm

FACTORES_FEEDBACK = ("interes_cambio", "puesto_objetivo", "distancia_rol")

# Cargar el perfil completo en Python cuesta ~0,25 s por cada 1.000 candidatos.
# Si el filtro duro deja pasar más que esto, se preseleccionan en SQL los más
# prometedores (mismos pesos) y solo esos entran en el filtro blando completo.
MAX_CANDIDATOS_FILTRO_BLANDO = int(os.getenv("MAX_CANDIDATOS_FILTRO_BLANDO", "2000"))


class CandidatosService:
    """
    Servicio de lógica de negocio para:
    1. Smart Candidate Matching (filtro duro + filtro blando ponderado, con
       requisitos cubiertos, gaps, riesgos y evidencias).
    2. Formación de equipos complementarios (sin repetir candidatos entre roles
       y midiendo la compatibilidad con los ya elegidos).
    """

    def __init__(self, repository: Optional[CandidatosRepository] = None):
        # El repositorio se mantiene para GET /api/candidatos/<id> y las tools del agente
        self.repository = repository or CandidatosRepository()
        self.ruta_perfiles = str(_fb.PERFILES).replace("\\", "/")

    # ------------------------------------------------------------------
    # Matching de un rol
    # ------------------------------------------------------------------
    def obtener_ranking_para_candidato_ideal(
        self,
        ideal: DTO_request_candidato_ideal,
        excluir_ids: Optional[Set[str]] = None,
        ponderaciones: Union[DTO_ponderacion_filtro_blando, Dict[str, Any], None] = None,
        equipo_actual: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Filtro duro + filtro blando para un rol ideal. Devuelve los `top_k`
        mejores ordenados por `fit_score` (0-100).

        - `ponderaciones`: pesos del filtro blando (DTO o dict parcial). Si no se
          pasan, se usan los valores por defecto del DTO.
        - `equipo_actual`: IDs ya elegidos. No compiten y `compatibilidad_equipo`
          mide la relación del candidato con ellos.
        """
        resultado = self.evaluar_rol(ideal, excluir_ids, ponderaciones, equipo_actual)
        return resultado["candidatos"]

    def evaluar_rol(
        self,
        ideal: DTO_request_candidato_ideal,
        excluir_ids: Optional[Set[str]] = None,
        ponderaciones: Union[DTO_ponderacion_filtro_blando, Dict[str, Any], None] = None,
        equipo_actual: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Igual que obtener_ranking_para_candidato_ideal pero devuelve también los
        metadatos del cálculo: total_filtro_duro, factores_usados (peso % de cada
        factor que ha entrado en el score) y factores_no_aplicables.
        """
        pesos = self._normalizar_pesos(ponderaciones)
        ctx = _fb.Contexto(ideal, equipo_actual)

        # 1. Filtro duro
        excluir = set(excluir_ids or ()) | set(ctx.equipo)
        ids = [emp_id for emp_id, _ in _fd.filtrar(ideal) if emp_id not in excluir]
        total_filtro_duro = len(ids)

        # 2. Filtro blando (solo carga feedback/relaciones si tienen peso)
        activos = pesos.activas()
        preseleccion = total_filtro_duro > MAX_CANDIDATOS_FILTRO_BLANDO
        if preseleccion:
            ids = self._preseleccionar(ids, ctx, activos, MAX_CANDIDATOS_FILTRO_BLANDO)
        usar_feedback = any(c in activos for c in FACTORES_FEEDBACK)
        perfiles = _fb.cargar_candidatos(ids, ctx, usar_feedback, "compatibilidad_equipo" in activos)
        ranking, usados, no_aplicables = _fb.puntuar(perfiles, ctx, pesos)

        # 3. Top-k con desglose y explicaciones
        suma_usados = sum(activos[f] for f in usados) or 1.0
        pesos_usados = {f: round(100 * activos[f] / suma_usados, 1) for f in usados}
        por_id = {p["employee_id"]: p for p in perfiles}
        top = ranking[: max(int(ideal.top_k), 0)]
        emails = self._emails([r["employee_id"] for r in top])

        candidatos = [
            self._formatear_candidato(por_id[r["employee_id"]], r, ctx, pesos_usados, emails)
            for r in top
        ]
        return {
            "total_filtro_duro": total_filtro_duro,
            "total_filtro_blando": len(ids),
            "preseleccion_aplicada": preseleccion,
            "factores_usados": pesos_usados,
            "factores_no_aplicables": no_aplicables,
            "candidatos": candidatos,
        }

    @staticmethod
    def _normalizar_pesos(ponderaciones) -> DTO_ponderacion_filtro_blando:
        if ponderaciones is None:
            return DTO_ponderacion_filtro_blando()
        if isinstance(ponderaciones, dict):
            return DTO_ponderacion_filtro_blando.from_dict(ponderaciones)
        return ponderaciones

    def _preseleccionar(self, ids: List[str], ctx, activos: Dict[str, float], limite: int) -> List[str]:
        """
        Versión aproximada y barata (en SQL) de los factores con más peso:
        skills pedidas, sector, rol, disponibilidad y exceso de experiencia.
        Devuelve los `limite` IDs con mejor puntuación aproximada.
        """
        partes: List[str] = []
        params: List[Any] = []

        if ctx.req_skills and activos.get("skills"):
            peso_total = sum(p for _, _, p in ctx.req_skills)
            for _, aceptadas, peso in ctx.req_skills:
                condicion = " OR ".join(["skills_norm LIKE ?"] * len(aceptadas))
                partes.append(f"{activos['skills'] * peso / peso_total} * CASE WHEN {condicion} THEN 1 ELSE 0 END")
                params += [f"%|{a}|%" for a in sorted(aceptadas)]
        if ctx.sector and activos.get("sector_principal"):
            partes.append(
                f"{activos['sector_principal']} * CASE WHEN strip_accents(lower(sector_principal)) = ? THEN 1 "
                "WHEN sectores_norm LIKE ? THEN 0.6 ELSE 0 END"
            )
            params += [ctx.sector, f"%|{ctx.sector}|%"]
        tokens_rol = [t[:5] for t in _fb.tokens(ctx.consulta_rol)]
        if tokens_rol and activos.get("rol"):
            for t in tokens_rol:
                partes.append(f"{activos['rol'] / len(tokens_rol)} * CASE WHEN texto_rol LIKE ? THEN 1 ELSE 0 END")
                params.append(f"%{t}%")
        if activos.get("disponibilidad"):
            partes.append(
                f"{activos['disponibilidad']} * CASE disponibilidad WHEN 'En banca' THEN 1 "
                "WHEN 'Roll-off próximo (<3 meses)' THEN 0.7 ELSE 0.3 END"
            )
        if activos.get("anios_experiencia"):
            partes.append(f"{activos['anios_experiencia']} * least(greatest((anios_experiencia - ?) / 8.0, 0), 1)")
            params.append(int(ctx.ideal.anios_experiencia_minimos))

        if not partes:
            return ids[:limite]

        con = duckdb.connect()
        try:
            con.execute("CREATE TEMP TABLE cand AS SELECT unnest(?::VARCHAR[]) AS employee_id", [ids])
            filas = con.execute(
                f"""
                SELECT employee_id FROM (
                    SELECT employee_id, disponibilidad, anios_experiencia, sector_principal,
                           '|' || strip_accents(lower(array_to_string(skills_lista, '|'))) || '|' AS skills_norm,
                           '|' || strip_accents(lower(array_to_string(sectores_experiencia, '|'))) || '|' AS sectores_norm,
                           strip_accents(lower(concat_ws(' ', rol, rol_es, array_to_string(rol_alias, ' '), puesto_actual))) AS texto_rol
                    FROM '{self.ruta_perfiles}' JOIN cand USING (employee_id)
                )
                ORDER BY ({' + '.join(partes)}) DESC, employee_id
                LIMIT {int(limite)}
                """,
                params,
            ).fetchall()
        finally:
            con.close()
        return [f[0] for f in filas]

    def _emails(self, ids: List[str]) -> Dict[str, str]:
        """El filtro blando no carga datos de contacto: se leen solo para el top-k."""
        if not ids:
            return {}
        con = duckdb.connect()
        try:
            filas = con.execute(
                f"SELECT employee_id, email FROM '{self.ruta_perfiles}' WHERE employee_id IN ({', '.join('?' * len(ids))})",
                ids,
            ).fetchall()
        finally:
            con.close()
        return dict(filas)

    # ------------------------------------------------------------------
    # Respuesta por candidato
    # ------------------------------------------------------------------
    def _formatear_candidato(
        self,
        p: Dict[str, Any],
        r: Dict[str, Any],
        ctx,
        pesos_usados: Dict[str, float],
        emails: Dict[str, str],
    ) -> Dict[str, Any]:
        detalle = r["detalle"]
        explicacion = self._explicar(p, ctx, detalle)

        candidato = {
            "employee_id": p.get("employee_id"),
            "nombre_completo": p.get("nombre_completo"),
            "email": emails.get(p.get("employee_id")),
            "puesto_actual": p.get("puesto_actual"),
            "rol_actual": p.get("rol"),
            "area": p.get("area"),
            "nivel_seniority": p.get("nivel_seniority"),
            "anios_experiencia": p.get("anios_experiencia"),
            "anios_en_ntt": p.get("anios_en_ntt"),
            "disponibilidad": p.get("disponibilidad"),
            "sector_principal": p.get("sector_principal"),
            "modalidad_trabajo": p.get("modalidad_trabajo"),
            "movilidad_internacional": p.get("movilidad_internacional"),
            "pais": p.get("pais"),
            "ciudad": p.get("ciudad"),
            "fit_score": r["score"],
            # Puntuación 0-100 de cada factor y su peso normalizado (%) en el score
            "desglose_score": {
                f: {"puntuacion": round(100 * detalle[f], 1), "peso": pesos_usados.get(f, 0.0)}
                for f in detalle
            },
            **explicacion,
            "skills": p.get("skills") or [],
            "idiomas": p.get("idiomas") or [],
            "certificaciones": p.get("certificaciones") or [],
            "metodologias": p.get("metodologias") or [],
            "habilidades_blandas": p.get("habilidades_blandas") or [],
            "estudios": p.get("estudios") or [],
            "proyectos": p.get("proyectos") or [],
        }
        if "interes_cambio" in p:
            candidato["feedback"] = {
                "interes_cambio": p.get("interes_cambio"),
                "puesto_objetivo": p.get("puesto_objetivo"),
                "distancia_rol": p.get("distancia_rol"),
            }
        if p.get("_compatibilidad_media") is not None:
            candidato["compatibilidad_media"] = round(p["_compatibilidad_media"], 2)
        return candidato

    @staticmethod
    def _explicar(p: Dict[str, Any], ctx, detalle: Dict[str, float]) -> Dict[str, List[str]]:
        """Fortalezas, requisitos cubiertos, gaps, riesgos y evidencias en lenguaje natural."""
        ideal = ctx.ideal
        fortalezas: List[str] = []
        cubiertos: List[str] = []
        gaps: List[str] = []
        riesgos: List[str] = []
        evidencias: List[str] = []

        # Skills pedidas (las obligatorias ya las garantiza el filtro duro)
        for req, aceptadas, _ in ctx.req_skills:
            mejor = None
            for s in p.get("skills") or []:
                if _fb._nombres_skill(s) & aceptadas and (mejor is None or (s.get("nivel") or 0) > (mejor.get("nivel") or 0)):
                    mejor = s
            if mejor:
                nivel, anios = mejor.get("nivel") or 0, mejor.get("anios") or 0
                cubiertos.append(f"{req.nombre} (nivel {nivel}/5, {anios:g} años)")
                if nivel >= 4:
                    fortalezas.append(f"Dominio avanzado en {req.nombre} (nivel {nivel}) con {anios:g} años de experiencia.")
                if nivel < req.nivel_minimo:
                    gaps.append(f"{req.nombre}: nivel {nivel}, se buscaba nivel {req.nivel_minimo}.")
            else:
                gaps.append(f"No acredita {req.nombre} (deseable).")

        # Experiencia total
        exp = p.get("anios_experiencia") or 0
        cubiertos.append(f"Experiencia total: {exp} años (mínimo {ideal.anios_experiencia_minimos}).")
        if exp >= ideal.anios_experiencia_minimos + 3:
            fortalezas.append(f"Seniority sólida: {exp} años de trayectoria.")

        # Sector
        if ctx.sector:
            valor = detalle.get("sector_principal")
            if valor is None:
                valor = _fb.f_sector_principal(p, ctx)
            if valor >= 1.0:
                cubiertos.append(f"Sector principal: {p.get('sector_principal')}.")
                fortalezas.append(f"Especialización principal en {p.get('sector_principal')}.")
            elif valor > 0:
                cubiertos.append(f"Ha trabajado en proyectos del sector {ideal.sector}.")
            else:
                gaps.append(f"Sin experiencia demostrada en el sector {ideal.sector}.")
                riesgos.append(f"Necesitará adaptarse al sector {ideal.sector}.")

        # Idiomas y certificaciones exigidas (garantizados por el filtro duro)
        for req_idioma, (idioma, _) in zip(ideal.idiomas, ctx.req_idiomas):
            nivel = next((i.get("nivel") for i in p.get("idiomas") or [] if norm(i.get("idioma")) == idioma), None)
            if nivel:
                cubiertos.append(f"Idioma {req_idioma.idioma} ({nivel}).")
        for cert in ideal.certificaciones:
            cubiertos.append(f"Certificación exigida: {cert}.")

        # Disponibilidad
        disp = p.get("disponibilidad")
        if disp == "En banca":
            fortalezas.append("Disponibilidad inmediata (en banca).")
        elif disp and disp.startswith("Roll-off"):
            riesgos.append("Se libera en menos de 3 meses (roll-off): no está disponible ya.")

        # Feedback y relaciones (solo si se han usado en el score)
        if detalle.get("puesto_objetivo", 0) >= 0.5 and p.get("puesto_objetivo"):
            fortalezas.append(f"Su puesto objetivo ({p['puesto_objetivo']}) encaja con el rol.")
        if "interes_cambio" in detalle and detalle["interes_cambio"] < 0.3:
            riesgos.append("Por su interés de cambio, el encaje motivacional con el rol es bajo.")
        if "distancia_rol" in detalle and detalle["distancia_rol"] <= 0.25:
            riesgos.append("Aspira a un área muy distinta de su puesto actual.")
        media = p.get("_compatibilidad_media")
        if media is not None and "compatibilidad_equipo" in detalle:
            quien = "el equipo ya elegido" if ctx.equipo else "sus compañeros"
            if media >= 4:
                fortalezas.append(f"Muy bien valorado por {quien} ({media:.1f}/5).")
            elif media <= 2.5:
                riesgos.append(f"Valoración baja con {quien} ({media:.1f}/5).")

        # Evidencias: proyectos y certificaciones relacionados con la petición
        for pr in p.get("proyectos") or []:
            if len(evidencias) >= 2:
                break
            if _fb._tecnologia_relevante(pr.get("tecnologias"), ctx) or (
                ctx.sector and norm(pr.get("cliente_sector")) == ctx.sector
            ):
                tecs = ", ".join((pr.get("tecnologias") or [])[:4])
                evidencias.append(
                    f"Proyecto '{pr.get('nombre')}' ({pr.get('cliente_sector')}, {pr.get('anio')}), rol {pr.get('rol')}"
                    + (f", con {tecs}." if tecs else ".")
                )
        for c in (p.get("certificaciones") or [])[:2]:
            evidencias.append(f"Certificación: {c.get('nombre')} ({c.get('anio')}).")

        return {
            "fortalezas": fortalezas,
            "requisitos_cubiertos": cubiertos,
            "gaps": gaps,
            "riesgos": riesgos,
            "evidencias": evidencias,
        }

    # ------------------------------------------------------------------
    # Equipo multi-rol
    # ------------------------------------------------------------------
    def obtener_candidatos_para_equipo(
        self,
        request_dto: DTO_request_obtener_candidatos
    ) -> Dict[str, Any]:
        """
        Resuelve la asignación para múltiples roles de un proyecto o equipo.
        - Las ponderaciones del request se aplican a todos los roles.
        - Si evitar_duplicados_entre_roles, ningún candidato se asigna a dos roles.
        - Los asignados en roles anteriores (y `equipo_actual`) forman el equipo
          con el que se mide `compatibilidad_equipo` en los siguientes roles.
        """
        asignados: List[str] = list(dict.fromkeys(request_dto.equipo_actual or []))
        equipo_propuesto: List[Dict[str, Any]] = []
        ranking_por_rol: List[Dict[str, Any]] = []

        for idx, ideal in enumerate(request_dto.candidatos_ideales):
            rol_nombre = ideal.rol or f"Rol {idx + 1}"

            excluir = set(asignados) if request_dto.evitar_duplicados_entre_roles else set()
            evaluacion = self.evaluar_rol(
                ideal,
                excluir_ids=excluir,
                ponderaciones=request_dto.ponderaciones,
                equipo_actual=asignados,
            )
            ranking_rol = evaluacion["candidatos"]

            mejor_candidato = ranking_rol[0] if ranking_rol else None
            if mejor_candidato:
                asignados.append(mejor_candidato["employee_id"])

            equipo_propuesto.append({
                "rol_buscado": rol_nombre,
                "candidato_asignado": mejor_candidato
            })

            ranking_por_rol.append({
                "rol_buscado": rol_nombre,
                "total_filtro_duro": evaluacion["total_filtro_duro"],
                "total_filtro_blando": evaluacion["total_filtro_blando"],
                "preseleccion_aplicada": evaluacion["preseleccion_aplicada"],
                "total_candidatos": len(ranking_rol),
                "factores_usados": evaluacion["factores_usados"],
                "factores_no_aplicables": evaluacion["factores_no_aplicables"],
                "candidatos": ranking_rol
            })

        complementariedad = self._analizar_complementariedad_equipo(
            equipo_propuesto, request_dto.evitar_duplicados_entre_roles
        )

        return {
            "nombre_proyecto": request_dto.nombre_proyecto,
            "total_roles": len(request_dto.candidatos_ideales),
            "ponderaciones": request_dto.ponderaciones.to_dict(),
            "equipo_recomendado": equipo_propuesto,
            "ranking_por_rol": ranking_por_rol,
            "analisis_complementariedad": complementariedad
        }

    def _analizar_complementariedad_equipo(
        self,
        equipo: List[Dict[str, Any]],
        sin_duplicados: bool = True
    ) -> List[str]:
        """
        Detecta cómo los integrantes del equipo se complementan en habilidades y sectores.
        """
        analisis: List[str] = []
        sectores_cubiertos = set()
        sin_cubrir = []

        for miembro in equipo:
            cand = miembro.get("candidato_asignado")
            if not cand:
                sin_cubrir.append(miembro.get("rol_buscado"))
                continue
            sec = cand.get("sector_principal")
            if sec:
                sectores_cubiertos.add(sec)

        if len(sectores_cubiertos) > 1:
            analisis.append(f"Diversidad sectorial combinada: el equipo aporta visión multidisciplinar en {', '.join(sorted(sectores_cubiertos))}.")
        if sin_cubrir:
            analisis.append(f"Roles sin candidato que pase el filtro duro: {', '.join(sin_cubrir)}.")

        if sin_duplicados:
            analisis.append("Asignación libre de colisiones: cada profesional cubre de forma exclusiva un único rol crítico del proyecto.")
        return analisis
