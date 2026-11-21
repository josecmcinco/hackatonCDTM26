from typing import List, Dict, Any, Optional
from repository import CandidatosRepository

repo = CandidatosRepository()


def tool_buscar_candidatos(
    anios_minimos: int = 0,
    disponibilidades: Optional[List[str]] = None,
    sector: Optional[str] = None,
    skills: Optional[List[str]] = None,
    limite: int = 10
) -> List[Dict[str, Any]]:
    """
    Herramienta para buscar y filtrar candidatos en el dataset de 190.000 profesionales.
    Aplica filtros duros de años mínimos y disponibilidad, y preordena por afinidad
    de skills y sector.
    """
    disp = disponibilidades or ["En banca", "Roll-off próximo (<3 meses)"]
    candidatos = repo.buscar_candidatos_prefiltrados(
        anios_minimos=int(anios_minimos),
        disponibilidades=disp,
        sector=sector,
        skills_nombres=skills,
        limite=int(limite)
    )

    # Devolver una versión sintetizada pero completa para el contexto del LLM
    resultado_sintetizado = []
    for c in candidatos:
        resultado_sintetizado.append({
            "employee_id": c.get("employee_id"),
            "nombre_completo": c.get("nombre_completo"),
            "puesto_actual": c.get("puesto_actual"),
            "anios_experiencia": c.get("anios_experiencia"),
            "sector_principal": c.get("sector_principal"),
            "disponibilidad": c.get("disponibilidad"),
            "skills": c.get("skills", [])[:8],
            "idiomas": c.get("idiomas", [])
        })

    return resultado_sintetizado


def tool_obtener_detalle_candidato(employee_id: str) -> Dict[str, Any]:
    """
    Herramienta para obtener el expediente y evidencia exhaustiva de un candidato
    concreto por su ID (proyectos realizados, roles, clientes, certificaciones).
    """
    candidato = repo.obtener_por_id(employee_id)
    if not candidato:
        return {"error": f"Candidato {employee_id} no encontrado"}

    return {
        "employee_id": candidato.get("employee_id"),
        "nombre_completo": candidato.get("nombre_completo"),
        "puesto_actual": candidato.get("puesto_actual"),
        "anios_experiencia": candidato.get("anios_experiencia"),
        "anios_en_ntt": candidato.get("anios_en_ntt"),
        "sector_principal": candidato.get("sector_principal"),
        "disponibilidad": candidato.get("disponibilidad"),
        "skills": candidato.get("skills", []),
        "proyectos": candidato.get("proyectos", []),
        "experiencia": candidato.get("experiencia", []),
        "certificaciones": candidato.get("certificaciones", []),
        "idiomas": candidato.get("idiomas", []),
        "resumen": candidato.get("resumen")
    }


# Mapeo de ejecución para el bucle de Gemini
TOOL_DISPATCHER = {
    "tool_buscar_candidatos": tool_buscar_candidatos,
    "tool_obtener_detalle_candidato": tool_obtener_detalle_candidato,
}


def ejecutar_tool(nombre: str, args: Dict[str, Any]) -> Any:
    """Ejecuta una herramienta a partir del nombre y argumentos enviados por Gemini."""
    if nombre not in TOOL_DISPATCHER:
        raise ValueError(f"Herramienta desconocida: {nombre}")
    return TOOL_DISPATCHER[nombre](**args)


# Esquemas de declaración de herramientas para Gemini (Google Generative AI Function Calling)
GEMINI_TOOLS_DECLARATIONS = [
    {
        "name": "tool_buscar_candidatos",
        "description": "Busca candidatos en la base de datos de 190.000 profesionales aplicando filtros duros de experiencia y disponibilidad, ordenando por skills y sector.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "anios_minimos": {
                    "type": "INTEGER",
                    "description": "Años mínimos de experiencia total requeridos (filtro innegociable)."
                },
                "disponibilidades": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "Lista de estados válidos ('En banca', 'Roll-off próximo (<3 meses)', 'Asignado')."
                },
                "sector": {
                    "type": "STRING",
                    "description": "Sector de negocio objetivo (ej. 'Banca y Finanzas', 'Retail y Consumo', 'Sector Público')."
                },
                "skills": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "Lista de nombres de tecnologías o habilidades deseadas (ej. ['Azure', 'Kubernetes', 'Python'])."
                },
                "limite": {
                    "type": "INTEGER",
                    "description": "Número máximo de candidatos a recuperar para evaluación (por defecto 10)."
                }
            },
            "required": ["anios_minimos"]
        }
    },
    {
        "name": "tool_obtener_detalle_candidato",
        "description": "Obtiene la evidencia completa de un candidato específico: proyectos previos, clientes, certificaciones y trayectoria para justificar la recomendación sin alucinaciones.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "employee_id": {
                    "type": "STRING",
                    "description": "ID del empleado (ej. 'NTT0045680')."
                }
            },
            "required": ["employee_id"]
        }
    }
]
