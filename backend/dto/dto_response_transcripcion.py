from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any


@dataclass
class DTO_response_transcripcion:
    """
    DTO de salida (Response) con el resultado de la transcripción en tiempo real.
    Permite al frontend pintar el texto progresivamente mientras el usuario habla.
    """
    status: str = "success"
    texto: str = ""                         # Texto transcrito del fragmento o acumulado
    texto_acumulado: str = ""               # Texto total acumulado de la sesión de voz
    es_final: bool = False                  # Indica si es el resultado final (botón stop pulsado)
    motor_utilizado: str = "elevenlabs"     # 'elevenlabs', 'gemini' o 'fallback'
    duracion_ms: Optional[int] = None
    mensaje_error: Optional[str] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DTO_response_transcripcion":
        return cls(
            status=str(data.get("status", "success")),
            texto=str(data.get("texto", "")),
            texto_acumulado=str(data.get("texto_acumulado", "")),
            es_final=bool(data.get("es_final", False)),
            motor_utilizado=str(data.get("motor_utilizado", "elevenlabs")),
            duracion_ms=data.get("duracion_ms"),
            mensaje_error=data.get("mensaje_error")
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "texto": self.texto,
            "texto_acumulado": self.texto_acumulado,
            "es_final": self.es_final,
            "motor_utilizado": self.motor_utilizado,
            "duracion_ms": self.duracion_ms,
            "mensaje_error": self.mensaje_error
        }
