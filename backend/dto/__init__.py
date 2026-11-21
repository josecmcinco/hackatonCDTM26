# Package for Data Transfer Objects (DTOs) / Schemas
from .dto_request_candidato_ideal import (
    DTO_request_candidato_ideal,
    CandidatoIdealEntryDTO,
    RequisitoSkillDTO,
    RequisitoIdiomaDTO,
)
from .dto_request_obtener_candidatos import DTO_request_obtener_candidatos
from .dto_request_generar_audio import DTO_request_generar_audio
from .dto_request_transcribir_audio import DTO_request_transcribir_audio
from .dto_response_transcripcion import DTO_response_transcripcion

__all__ = [
    "DTO_request_candidato_ideal",
    "CandidatoIdealEntryDTO",
    "RequisitoSkillDTO",
    "RequisitoIdiomaDTO",
    "DTO_request_obtener_candidatos",
    "DTO_request_generar_audio",
    "DTO_request_transcribir_audio",
    "DTO_response_transcripcion",
]
