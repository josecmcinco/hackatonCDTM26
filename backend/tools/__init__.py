# Package for LLM Agent Tools (Function Calling)
from .candidatos_tools import (
    tool_buscar_candidatos,
    tool_obtener_detalle_candidato,
    GEMINI_TOOLS_DECLARATIONS,
)

__all__ = [
    "tool_buscar_candidatos",
    "tool_obtener_detalle_candidato",
    "GEMINI_TOOLS_DECLARATIONS",
]
