from dataclasses import dataclass
from typing import Optional, Dict, Any


@dataclass
class DTO_request_generar_audio:
    """
    DTO de entrada para solicitar la síntesis de voz (Text-to-Speech) a ElevenLabs.
    """
    texto: str
    voice_id: Optional[str] = None
    model_id: Optional[str] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DTO_request_generar_audio":
        return cls(
            texto=str(data.get("texto", "")).strip(),
            voice_id=data.get("voice_id"),
            model_id=data.get("model_id")
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "texto": self.texto,
            "voice_id": self.voice_id,
            "model_id": self.model_id
        }
