from dataclasses import dataclass


@dataclass
class DTO_request_search_matches:
    """
    DTO para el endpoint POST /api/projects/search-matches.
    El frontend envía la descripción libre del proyecto y su nivel de importancia.
    """
    description: str
    projectImportance: str = "balanced"  # critical | high | medium | low | balanced
