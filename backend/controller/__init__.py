# Package for API Controllers / Blueprints
from .candidatos_controller import candidatos_bp
from .voice_controller import voice_bp
from .agente_controller import agente_bp
from .transcripcion_controller import transcripcion_bp

__all__ = [
    "candidatos_bp",
    "voice_bp",
    "agente_bp",
    "transcripcion_bp",
]
