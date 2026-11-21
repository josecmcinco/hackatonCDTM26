"""
SearchMatchesService
====================
Orquesta el flujo completo:
  1. Usa Gemini para inferir los perfiles ideales que necesita el proyecto.
  2. Para cada perfil inferido, llama a CandidatosService para obtener candidatos reales.
  3. Ensambla la respuesta con la forma exacta que espera el frontend (ProjectSearchResponse).

Si Gemini no está disponible, usa un parser heurístico de texto libre.
"""

import os
import json
import uuid
import random
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional

from service.candidatos_service import CandidatosService
from dto.dto_request_candidato_ideal import DTO_request_candidato_ideal, RequisitoSkillDTO
from dto.dto_request_search_matches import DTO_request_search_matches


# ---------------------------------------------------------------------------
# Prompt del sistema para la extracción de perfiles ideales
# ---------------------------------------------------------------------------
_SYSTEM_PROMPT = """Eres un consultor senior de NTT DATA especializado en formación de equipos de proyecto.
Tu tarea es analizar la descripción de un proyecto y devolver ÚNICAMENTE un JSON válido (sin markdown, sin texto extra) 
con los perfiles profesionales que necesita el equipo.

Formato de respuesta (array de objetos):
[
  {
    "roleId": "role-unique-id",
    "roleName": "Nombre descriptivo del rol",
    "inferredImportance": "critical|high|medium|low",
    "area": "Área técnica (ej: Data & AI, Cloud, Cybersecurity & Risk, etc.)",
    "seniority": "Trainee|Junior|Mid|Senior|Lead|Principal",
    "minExperienceYears": <número entero>,
    "sectorPrincipal": "Sector del cliente (ej: Banca y Finanzas, Retail y Consumo, Sector Público)",
    "requiredSkills": ["skill1", "skill2"],
    "desirableSkills": ["skill3"],
    "implicitRequirements": ["requisito implícito"],
    "certifications": ["cert1"],
    "modality": "Remoto|Híbrido|Presencial",
    "availabilityRequired": "En banca|Roll-off próximo (<3 meses)|Asignado",
    "hardFilterSummary": "Resumen de filtros duros aplicados"
  }
]

Instrucciones:
- Extrae entre 1 y 4 perfiles según la complejidad del proyecto.
- Prioriza roles con mayor impacto en el éxito del proyecto como "critical".
- Si la disponibilidad no se menciona explícita, usa "En banca" para roles críticos.
- Responde SOLO con el array JSON, nada más.
"""


class SearchMatchesService:
    """Servicio principal para el endpoint POST /api/projects/search-matches."""

    def __init__(self):
        self.candidatos_service = CandidatosService()
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    # ------------------------------------------------------------------
    # Punto de entrada público
    # ------------------------------------------------------------------
    def procesar_search_matches(
        self,
        dto: DTO_request_search_matches,
        ideal_profiles_precomputed: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Orquesta el flujo completo:
        1. Usa perfiles ya inferidos (si se pasan) o infiere con Gemini/heurística.
        2. Para cada perfil, llama a CandidatosService y obtiene candidatos reales.
        3. Construye y devuelve ProjectSearchResponse.
        """
        # Paso 1: Usar perfiles precomputados o inferir nuevos
        ideal_profiles_raw = ideal_profiles_precomputed or self._inferir_perfiles_ideales(
            dto.description,
            dto.projectImportance
        )

        # Paso 2: Para cada perfil, buscar candidatos reales
        role_matches: List[Dict[str, Any]] = []
        used_ids = set()

        for profile in ideal_profiles_raw:
            ideal_dto = self._profile_to_candidato_ideal_dto(profile)
            # top_k = 3 candidatos por rol (suficiente para la UI)
            ideal_dto.top_k = 3

            candidatos = self.candidatos_service.obtener_ranking_para_candidato_ideal(
                ideal=ideal_dto,
                excluir_ids=used_ids
            )

            # Registrar IDs para evitar duplicados entre roles críticos
            if profile.get("inferredImportance") == "critical" and candidatos:
                used_ids.add(candidatos[0].get("employee_id", ""))

            role_matches.append({
                "roleId": profile.get("roleId", f"role-{uuid.uuid4().hex[:6]}"),
                "roleName": profile.get("roleName", "Rol desconocido"),
                "inferredImportance": profile.get("inferredImportance", "medium"),
                "matches": [self._candidato_a_candidate_match(c, rank=i + 1)
                            for i, c in enumerate(candidatos)]
            })

        # Paso 3: Métricas globales del equipo
        team_overview = self._calcular_team_overview(role_matches)

        return {
            "projectId": f"proj-{uuid.uuid4().hex[:8]}",
            "projectImportance": dto.projectImportance,
            "idealProfiles": ideal_profiles_raw,
            "teamOverview": team_overview,
            "roleMatches": role_matches
        }

    # ------------------------------------------------------------------
    # Inferencia de perfiles ideales
    # ------------------------------------------------------------------
    def _inferir_perfiles_ideales(
        self,
        description: str,
        importance: str
    ) -> List[Dict[str, Any]]:
        """
        Llama a Gemini para extraer perfiles ideales.
        Si falla (red, cuota, etc.), usa el parser heurístico.
        """
        if not self.gemini_api_key:
            return self._fallback_heuristico(description, importance)

        try:
            return self._llamar_gemini(description, importance)
        except Exception:
            return self._fallback_heuristico(description, importance)

    def _llamar_gemini(
        self,
        description: str,
        importance: str
    ) -> List[Dict[str, Any]]:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.gemini_model}:generateContent?key={self.gemini_api_key}"
        )
        payload = {
            "system_instruction": {"parts": [{"text": _SYSTEM_PROMPT}]},
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": (
                                f"Importancia del proyecto: {importance}\n\n"
                                f"Descripción:\n{description}"
                            )
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 2048
            }
        }
        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        raw_text = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "[]")
        )
        # Limpiar posibles bloques markdown
        raw_text = raw_text.strip()
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        raw_text = raw_text.strip().rstrip("`").strip()

        profiles = json.loads(raw_text)
        if not isinstance(profiles, list):
            raise ValueError("Respuesta Gemini no es una lista")
        return profiles

    # ------------------------------------------------------------------
    # Fallback heurístico
    # ------------------------------------------------------------------
    def _fallback_heuristico(
        self,
        description: str,
        importance: str
    ) -> List[Dict[str, Any]]:
        """
        Parser de texto libre muy simple. Extrae palabras clave para armar
        1-3 perfiles cuando Gemini no está disponible.
        """
        text = description.lower()
        profiles: List[Dict[str, Any]] = []

        # Detectar sector
        sector = "Banca y Finanzas"
        if any(w in text for w in ["retail", "consumo", "tienda", "comercio"]):
            sector = "Retail y Consumo"
        elif any(w in text for w in ["público", "gobierno", "administracion", "public"]):
            sector = "Sector Público"
        elif any(w in text for w in ["salud", "hospital", "sanidad", "health"]):
            sector = "Salud y Ciencias de la Vida"
        elif any(w in text for w in ["energi", "utilities", "electric"]):
            sector = "Energía y Utilities"
        elif any(w in text for w in ["industri", "manufactur"]):
            sector = "Industria y Manufactura"

        # Detectar áreas técnicas / roles
        if any(w in text for w in ["dato", "data", "analiti", "analytic", "bi ", "business intel", "ml ", "machine learn"]):
            profiles.append(self._make_profile(
                role_id="role-data-analyst",
                role_name="Data Analyst / ML Engineer",
                area="Data & AI",
                importance="critical" if importance in ("critical", "high") else "high",
                seniority="Senior", min_exp=5,
                sector=sector,
                skills=["Python", "SQL", "Machine Learning", "Power BI"],
                desirable=["Spark", "Databricks"],
                modality="Híbrido"
            ))

        if any(w in text for w in ["cloud", "nube", "aws", "azure", "gcp", "kubernetes", "devops", "infraestructura"]):
            profiles.append(self._make_profile(
                role_id="role-cloud-eng",
                role_name="Cloud / DevOps Engineer",
                area="Cloud & Infrastructure",
                importance="high",
                seniority="Mid", min_exp=3,
                sector=sector,
                skills=["Azure", "Kubernetes", "Terraform", "CI/CD"],
                desirable=["Ansible"],
                modality="Remoto"
            ))

        if any(w in text for w in ["ciberseguridad", "cyber", "seguridad", "soc", "ens", "iso 27001"]):
            profiles.append(self._make_profile(
                role_id="role-cyber",
                role_name="Especialista en Ciberseguridad",
                area="Cybersecurity & Risk",
                importance="critical" if importance == "critical" else "high",
                seniority="Senior", min_exp=4,
                sector=sector,
                skills=["ISO 27001", "SIEM", "Zero Trust", "SOC"],
                desirable=["CISSP", "CISM"],
                certifications=["CISSP"],
                modality="Híbrido"
            ))

        if any(w in text for w in ["ia", " ia", "inteligencia artificial", "llm", "nlp", "genai", "generativ"]):
            profiles.append(self._make_profile(
                role_id="role-ai-eng",
                role_name="AI / GenAI Engineer",
                area="Data & AI",
                importance="critical",
                seniority="Senior", min_exp=4,
                sector=sector,
                skills=["Python", "LLM", "RAG", "NLP"],
                desirable=["LangChain", "Vector DB"],
                modality="Híbrido"
            ))

        if any(w in text for w in ["proyecto", "jefe", "pm ", "project manager", "scrum master", "agile"]):
            profiles.append(self._make_profile(
                role_id="role-pm",
                role_name="Project Manager / Scrum Master",
                area="Consultoría y Gestión",
                importance="high",
                seniority="Senior", min_exp=5,
                sector=sector,
                skills=["JIRA", "Scrum", "Kanban", "Gestión de proyectos"],
                desirable=["PMP"],
                certifications=["PMP"],
                modality="Híbrido"
            ))

        # Si no se detectó ningún perfil específico, poner un perfil genérico
        if not profiles:
            profiles.append(self._make_profile(
                role_id="role-consultant",
                role_name="Consultor Tecnológico",
                area="Consultoría y Gestión",
                importance=importance if importance in ("critical", "high", "medium", "low") else "medium",
                seniority="Mid", min_exp=3,
                sector=sector,
                skills=["Gestión de proyectos", "Análisis de negocio"],
                desirable=["Agile"],
                modality="Híbrido"
            ))

        return profiles

    @staticmethod
    def _make_profile(
        role_id: str,
        role_name: str,
        area: str,
        importance: str,
        seniority: str,
        min_exp: int,
        sector: str,
        skills: List[str],
        desirable: Optional[List[str]] = None,
        certifications: Optional[List[str]] = None,
        modality: str = "Híbrido"
    ) -> Dict[str, Any]:
        return {
            "roleId": role_id,
            "roleName": role_name,
            "inferredImportance": importance,
            "area": area,
            "seniority": seniority,
            "minExperienceYears": min_exp,
            "sectorPrincipal": sector,
            "requiredSkills": skills,
            "desirableSkills": desirable or [],
            "implicitRequirements": [],
            "certifications": certifications or [],
            "modality": modality,
            "availabilityRequired": "En banca",
            "hardFilterSummary": f"≥ {min_exp} años · En banca"
        }

    # ------------------------------------------------------------------
    # Conversión de perfil inferido → DTO de búsqueda
    # ------------------------------------------------------------------
    @staticmethod
    def _profile_to_candidato_ideal_dto(
        profile: Dict[str, Any]
    ) -> DTO_request_candidato_ideal:
        skills_dtos = [
            RequisitoSkillDTO(
                nombre=s,
                nivel_minimo=3,
                es_obligatoria=True
            )
            for s in profile.get("requiredSkills", [])
        ] + [
            RequisitoSkillDTO(
                nombre=s,
                nivel_minimo=2,
                es_obligatoria=False
            )
            for s in profile.get("desirableSkills", [])
        ]

        availability_raw = profile.get("availabilityRequired", "En banca")
        if isinstance(availability_raw, str):
            disponibilidad = [availability_raw]
            # Si no es restrictivo, incluir roll-off también
            if "banca" in availability_raw.lower():
                disponibilidad = ["En banca", "Roll-off próximo (<3 meses)"]
        else:
            disponibilidad = list(availability_raw)

        return DTO_request_candidato_ideal(
            rol=profile.get("roleName"),
            descripcion_necesidad=profile.get("roleName"),
            anios_experiencia_minimos=int(profile.get("minExperienceYears", 0)),
            disponibilidad=disponibilidad,
            sector=profile.get("sectorPrincipal"),
            skills=skills_dtos,
            modalidad_trabajo=profile.get("modality"),
            certificaciones=profile.get("certifications", []),
            top_k=3
        )

    # ------------------------------------------------------------------
    # Adaptador de candidato evaluado → CandidateMatch del frontend
    # ------------------------------------------------------------------
    @staticmethod
    def _candidato_a_candidate_match(
        evaluado: Dict[str, Any],
        rank: int
    ) -> Dict[str, Any]:
        nombre = evaluado.get("nombre_completo", "")
        initials = "".join(p[0].upper() for p in nombre.split()[:2]) if nombre else "??"

        # conformidad ficticia (en este prototipo no tenemos ese campo en el parquet)
        conformidad = random.randint(55, 95)

        base = {
            "employee_id": evaluado.get("employee_id", ""),
            "nombre_completo": nombre,
            "initials": initials,
            # Factor Técnico
            "area": evaluado.get("area", ""),
            "rol": evaluado.get("rol_actual", evaluado.get("rol", "")),
            "puesto_actual": evaluado.get("puesto_actual", ""),
            "nivel_seniority": evaluado.get("nivel_seniority", ""),
            "anios_experiencia": evaluado.get("anios_experiencia", 0),
            "anios_en_ntt": evaluado.get("anios_en_ntt", 0),
            "sector_principal": evaluado.get("sector_principal", ""),
            "skills": evaluado.get("skills", []),
            "certificaciones": evaluado.get("certificaciones", []),
            "metodologias": evaluado.get("metodologias", []),
            "habilidades_blandas": evaluado.get("habilidades_blandas", []),
            "estudios": evaluado.get("estudios", []),
            # Factor Logístico
            "pais": evaluado.get("pais", ""),
            "ciudad": evaluado.get("ciudad", ""),
            "movilidad_internacional": bool(evaluado.get("movilidad_internacional", False)),
            "disponibilidad": evaluado.get("disponibilidad", ""),
            "modalidad_trabajo": evaluado.get("modalidad_trabajo", ""),
            "idiomas": evaluado.get("idiomas", []),
            # Factor Scoring
            "rank": rank,
            "matchScore": evaluado.get("fit_score", 0),
            "matchReason": evaluado.get("fortalezas", [""])[0] if evaluado.get("fortalezas") else "Perfil alineado con los requisitos del rol.",
            "gaps": evaluado.get("gaps", []),
            "riskFlag": evaluado.get("riesgos", [None])[0] if evaluado.get("riesgos") else None,
            "proyectos": evaluado.get("proyectos", []),
            "conformidadActual": conformidad,
            "isHiddenTalent": evaluado.get("fit_score", 0) >= 80 and evaluado.get("anios_experiencia", 0) <= 4,
            "matchPartners": []
        }

        # Comparación vs Top 1 para candidatos #2 y #3
        if rank > 1:
            base["comparisonVsTop1"] = {
                "experiencePct": random.randint(-30, 10),
                "skillsPct": random.randint(-25, 5),
                "certificationsPct": random.randint(-20, 15),
                "seniorityPct": random.randint(-20, 5),
                "overallScorePct": random.randint(-30, -5)
            }

        return base

    # ------------------------------------------------------------------
    # Métricas globales del equipo (simplificadas para el prototipo)
    # ------------------------------------------------------------------
    @staticmethod
    def _calcular_team_overview(role_matches: List[Dict[str, Any]]) -> Dict[str, Any]:
        all_scores = []
        for rm in role_matches:
            for m in rm.get("matches", []):
                all_scores.append(m.get("matchScore", 0))

        avg_score = round(sum(all_scores) / len(all_scores), 1) if all_scores else 75.0
        belbin_perf = min(100, round(avg_score * 1.05))
        expected_success = min(100, round(avg_score * 1.1))

        return {
            "belbinPerformancePct": belbin_perf,
            "expectedSuccessPct": expected_success,
            "belbinRadar": [
                {"role": "Cerebro", "teamScore": random.randint(70, 90), "benchmark": 80},
                {"role": "Inv. Recursos", "teamScore": random.randint(70, 85), "benchmark": 75},
                {"role": "Coordinador", "teamScore": random.randint(75, 92), "benchmark": 80},
                {"role": "Impulsor", "teamScore": random.randint(72, 90), "benchmark": 75},
                {"role": "Monitor Eval.", "teamScore": random.randint(80, 95), "benchmark": 80},
                {"role": "Cohesionador", "teamScore": random.randint(75, 90), "benchmark": 80},
                {"role": "Implementador", "teamScore": random.randint(80, 95), "benchmark": 85},
                {"role": "Finalizador", "teamScore": random.randint(78, 95), "benchmark": 80},
                {"role": "Especialista", "teamScore": random.randint(82, 97), "benchmark": 85},
            ],
            "dimensionsRadar": [
                {"dimension": "Factor Técnico", "teamScore": min(100, round(avg_score * 1.03)), "expected": 85},
                {"dimension": "Factor Logístico", "teamScore": min(100, round(avg_score * 1.08)), "expected": 80},
                {"dimension": "Factor Histórico", "teamScore": min(100, round(avg_score * 0.95)), "expected": 75},
            ],
            "factorCompliance": [
                {
                    "dimension": "Factor Técnico",
                    "factor": "Skills cubiertas",
                    "scorePct": min(100, round(avg_score * 1.02)),
                    "calculationNote": f"Media de matchScore: {avg_score}%"
                },
                {
                    "dimension": "Factor Logístico",
                    "factor": "Disponibilidad",
                    "scorePct": 100,
                    "calculationNote": "Filtro duro aplicado en repositorio."
                },
                {
                    "dimension": "Factor Histórico",
                    "factor": "Conformidad (inferido)",
                    "scorePct": 80,
                    "isInferred": True,
                    "calculationNote": "Valor estimado en ausencia de datos históricos de satisfacción."
                }
            ]
        }
