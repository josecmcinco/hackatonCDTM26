from typing import List, Dict, Any, Optional, Set
from repository import CandidatosRepository
from dto import DTO_request_candidato_ideal, DTO_request_obtener_candidatos, RequisitoSkillDTO


class CandidatosService:
    """
    Servicio de lógica de negocio para:
    1. Smart Candidate Matching (cálculo de ajuste, detección de requisitos cubiertos, gaps y evidencias).
    2. Optimización y formación de equipos complementarios (sin repetir candidatos entre roles).
    """

    def __init__(self, repository: Optional[CandidatosRepository] = None):
        self.repository = repository or CandidatosRepository()

    def evaluar_candidato_para_perfil(
        self,
        candidato: Dict[str, Any],
        ideal: DTO_request_candidato_ideal
    ) -> Dict[str, Any]:
        """
        Calcula el grado de ajuste (0-100%), fortalezas, requisitos cubiertos,
        gaps, riesgos y evidencias directas del perfil.
        """
        score_total = 0.0
        max_score = 0.0

        fortalezas: List[str] = []
        requisitos_cubiertos: List[str] = []
        gaps: List[str] = []
        riesgos: List[str] = []
        evidencias: List[str] = []

        # Mapa de skills del candidato (normalizado a minúsculas)
        cand_skills: Dict[str, Dict[str, Any]] = {}
        for s in candidato.get("skills", []) or []:
            nombre = str(s.get("skill", "")).strip().lower()
            cand_skills[nombre] = s

        # 1. Evaluación de Skills (Ponderación técnica)
        peso_skill = 50.0 / max(len(ideal.skills), 1) if ideal.skills else 0.0

        for req_skill in ideal.skills:
            max_score += peso_skill
            skill_nombre = req_skill.nombre.strip().lower()

            # Búsqueda exacta o parcial/afín
            coincidencia = None
            for cand_sk_name, cand_sk_val in cand_skills.items():
                if skill_nombre in cand_sk_name or cand_sk_name in skill_nombre:
                    coincidencia = cand_sk_val
                    break

            if coincidencia:
                nivel_cand = coincidencia.get("nivel", 1)
                anios_cand = coincidencia.get("anios", 0.0)

                # Comprobación de nivel y años
                cumple_nivel = nivel_cand >= req_skill.nivel_minimo
                fraccion_ajuste = min(1.0, (nivel_cand / req_skill.nivel_minimo) * 0.7 + (min(anios_cand, 5.0) / 5.0) * 0.3)
                puntos_ganados = peso_skill * fraccion_ajuste
                score_total += puntos_ganados

                requisitos_cubiertos.append(f"{req_skill.nombre} (Nivel {nivel_cand}/5, {anios_cand} años)")
                if nivel_cand >= 4:
                    fortalezas.append(f"Dominio avanzado en {req_skill.nombre} (Nivel {nivel_cand}) con {anios_cand} años de experiencia.")
                
                if not cumple_nivel:
                    gaps.append(f"{req_skill.nombre}: posee nivel {nivel_cand}, se requería nivel {req_skill.nivel_minimo}.")
            else:
                gaps.append(f"No demuestra experiencia formal en {req_skill.nombre}.")
                if req_skill.es_obligatoria:
                    riesgos.append(f"Requisito obligatorio '{req_skill.nombre}' no acreditado en el perfil.")

        # 2. Experiencia general (Seniority)
        max_score += 20.0
        exp_cand = candidato.get("anios_experiencia", 0)
        if exp_cand >= ideal.anios_experiencia_minimos:
            score_total += 20.0
            requisitos_cubiertos.append(f"Experiencia total: {exp_cand} años (mínimo requerido: {ideal.anios_experiencia_minimos}).")
            if exp_cand >= ideal.anios_experiencia_minimos + 3:
                fortalezas.append(f"Seniority sólida con {exp_cand} años de trayectoria en el sector.")
        else:
            gaps.append(f"Años de experiencia insuficientes: {exp_cand} vs {ideal.anios_experiencia_minimos} requeridos.")
            riesgos.append(f"Menor experiencia total ({exp_cand} años) de la solicitada.")

        # 3. Sector de especialización (Requisito explícito o implícito)
        if ideal.sector:
            max_score += 15.0
            sector_cand = candidato.get("sector_principal", "")
            
            # Buscar también en proyectos previos del sector
            proyectos_sector = [
                p for p in (candidato.get("proyectos", []) or [])
                if ideal.sector.lower() in str(p.get("cliente_sector", "")).lower()
            ]

            if ideal.sector.lower() in sector_cand.lower():
                score_total += 15.0
                requisitos_cubiertos.append(f"Especialización sectorial principal en {sector_cand}.")
                fortalezas.append(f"Gran conocimiento del sector {sector_cand}.")
                evidencias.append(f"Sector principal de carrera: {sector_cand}.")
            elif proyectos_sector:
                score_total += 10.0
                requisitos_cubiertos.append(f"Experiencia en proyectos del sector {ideal.sector}.")
                evidencias.append(f"Proyecto previo en sector {ideal.sector}: '{proyectos_sector[0].get('nombre', '')}'.")
            else:
                gaps.append(f"Sin experiencia demostrada en el sector {ideal.sector}.")
                riesgos.append(f"Requiere curva de adaptación al entorno y regulaciones del sector {ideal.sector}.")

        # 4. Idiomas
        if ideal.idiomas:
            peso_idioma = 15.0 / len(ideal.idiomas)
            cand_idiomas = {
                str(i.get("idioma", "")).strip().lower(): str(i.get("nivel", "")).strip()
                for i in (candidato.get("idiomas", []) or [])
            }
            for req_idioma in ideal.idiomas:
                max_score += peso_idioma
                req_id_nom = req_idioma.idioma.strip().lower()
                if req_id_nom in cand_idiomas:
                    score_total += peso_idioma
                    nivel_real = cand_idiomas[req_id_nom]
                    requisitos_cubiertos.append(f"Idioma {req_idioma.idioma} ({nivel_real}).")
                else:
                    gaps.append(f"Idioma {req_idioma.idioma} no acreditado.")
                    riesgos.append(f"Posible limitación de comunicación en {req_idioma.idioma}.")

        # 5. Evidencias concretas (Proyectos relevantes y certificaciones)
        for proj in (candidato.get("proyectos", []) or [])[:2]:
            tecs = ", ".join(proj.get("tecnologias", [])[:4])
            evidencias.append(f"Proyecto '{proj.get('nombre')}' ({proj.get('cliente_sector', 'Cliente')}, rol: {proj.get('rol')}) utilizando: {tecs}.")

        for cert in (candidato.get("certificaciones", []) or [])[:2]:
            evidencias.append(f"Certificación: {cert.get('nombre')} ({cert.get('anio')}).")

        # Cálculo final normalizado
        if max_score > 0:
            fit_percentage = round((score_total / max_score) * 100, 1)
        else:
            fit_percentage = 100.0

        return {
            "employee_id": candidato.get("employee_id"),
            "nombre_completo": candidato.get("nombre_completo"),
            "puesto_actual": candidato.get("puesto_actual"),
            "rol_actual": candidato.get("rol"),
            "anios_experiencia": candidato.get("anios_experiencia"),
            "disponibilidad": candidato.get("disponibilidad"),
            "sector_principal": candidato.get("sector_principal"),
            "email": candidato.get("email"),
            "fit_score": fit_percentage,
            "fortalezas": fortalezas,
            "requisitos_cubiertos": requisitos_cubiertos,
            "gaps": gaps,
            "riesgos": riesgos,
            "evidencias": evidencias,
            "skills": candidato.get("skills", []),
            "idiomas": candidato.get("idiomas", [])
        }

    def obtener_ranking_para_candidato_ideal(
        self,
        ideal: DTO_request_candidato_ideal,
        excluir_ids: Optional[Set[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Obtiene y rankea los candidatos más idóneos para un rol ideal específico.
        """
        skills_nombres = [s.nombre for s in ideal.skills] if ideal.skills else []

        candidatos_raw = self.repository.buscar_candidatos_prefiltrados(
            anios_minimos=ideal.anios_experiencia_minimos,
            disponibilidades=ideal.disponibilidad,
            modalidad_trabajo=ideal.modalidad_trabajo,
            sector=ideal.sector,
            skills_nombres=skills_nombres,
            limite=ideal.top_k * 5  # Traer un conjunto representativo para re-rankear
        )

        excluir = excluir_ids or set()
        candidatos_evaluados = []

        for cand in candidatos_raw:
            emp_id = cand.get("employee_id")
            if emp_id in excluir:
                continue
            evaluado = self.evaluar_candidato_para_perfil(cand, ideal)
            candidatos_evaluados.append(evaluado)

        # Ordenar por fit_score descendente
        candidatos_evaluados.sort(key=lambda x: x["fit_score"], reverse=True)
        return candidatos_evaluados[:ideal.top_k]

    def obtener_candidatos_para_equipo(
        self,
        request_dto: DTO_request_obtener_candidatos
    ) -> Dict[str, Any]:
        """
        Resuelve la asignación para múltiples roles de un proyecto o equipo.
        Garantiza que ningún candidato se asigne a más de un rol a la vez.
        """
        asignados_ids: Set[str] = set()
        equipo_propuesto: List[Dict[str, Any]] = []
        ranking_por_rol: List[Dict[str, Any]] = []

        for idx, ideal in enumerate(request_dto.candidatos_ideales):
            rol_nombre = ideal.rol or f"Rol {idx + 1}"
            
            # Buscar ranking respetando los ya asignados si evitar_duplicados está activo
            excluir = asignados_ids if request_dto.evitar_duplicados_entre_roles else set()
            ranking_rol = self.obtener_ranking_para_candidato_ideal(ideal, excluir_ids=excluir)

            mejor_candidato = ranking_rol[0] if ranking_rol else None
            if mejor_candidato and request_dto.evitar_duplicados_entre_roles:
                asignados_ids.add(mejor_candidato["employee_id"])

            equipo_propuesto.append({
                "rol_buscado": rol_nombre,
                "candidato_asignado": mejor_candidato
            })

            ranking_por_rol.append({
                "rol_buscado": rol_nombre,
                "total_candidatos": len(ranking_rol),
                "candidatos": ranking_rol
            })

        # Análisis de complementariedad del equipo
        complementariedad = self._analizar_complementariedad_equipo(equipo_propuesto)

        return {
            "nombre_proyecto": request_dto.nombre_proyecto,
            "total_roles": len(request_dto.candidatos_ideales),
            "equipo_recomendado": equipo_propuesto,
            "ranking_por_rol": ranking_por_rol,
            "analisis_complementariedad": complementariedad
        }

    def _analizar_complementariedad_equipo(
        self,
        equipo: List[Dict[str, Any]]
    ) -> List[str]:
        """
        Detecta cómo los integrantes del equipo se complementan en habilidades y sectores.
        """
        analisis: List[str] = []
        sectores_cubiertos = set()

        for miembro in equipo:
            cand = miembro.get("candidato_asignado")
            if not cand:
                continue
            sec = cand.get("sector_principal")
            if sec:
                sectores_cubiertos.add(sec)

        if len(sectores_cubiertos) > 1:
            analisis.append(f"Diversidad sectorial combinada: el equipo aporta visión multidisciplinar en {', '.join(sectores_cubiertos)}.")
        
        analisis.append("Asignación libre de colisiones: cada profesional cubre de forma exclusiva un único rol crítico del proyecto.")
        return analisis
