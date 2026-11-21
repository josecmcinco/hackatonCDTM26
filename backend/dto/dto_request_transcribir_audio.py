from dataclasses import dataclass
from typing import Optional, Dict, Any


@dataclass
class DTO_request_transcribir_audio:
    """
    DTO de entrada (Request) para transcripción de audio en directo o por fragmentos.
    Soporta audio en base64 (ideal para envíos en tiempo real vía JSON desde el navegador)
    o metadata asociada al audio que se está grabando.
    """
    audio_base64: Optional[str] = None
    formato: str = "audio/webm"         # audio/webm, audio/wav, audio/mp3, audio/ogg
    idioma: str = "es"                   # Código de idioma (es = español)
    es_final: bool = False               # True si el usuario ha pulsado 'stop', False si es un chunk intermedio
    texto_acumulado_previo: str = ""     # Texto acumulado hasta el momento para continuidad

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DTO_request_transcribir_audio":
        return cls(
            audio_base64=data.get("audio_base64") or data.get("audio") or data.get("chunk"),
            formato=str(data.get("formato", "audio/webm")),
            idioma=str(data.get("idioma", "es")),
            es_final=bool(data.get("es_final", False)),
            texto_acumulado_previo=str(data.get("texto_acumulado_previo", ""))
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "audio_base64": self.audio_base64,
            "formato": self.formato,
            "idioma": self.idioma,
            "es_final": self.es_final,
            "texto_acumulado_previo": self.texto_acumulado_previo
        }
