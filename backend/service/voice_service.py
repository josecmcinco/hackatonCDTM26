import os
import json
import urllib.request
import urllib.error
from typing import Optional, Dict, Any


def _cargar_env_local():
    """Carga variables desde archivos .env si existen sin requerir dependencias externas."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidatos_paths = [
        os.path.join(base_dir, "..", ".env"),
        os.path.join(base_dir, "..", "..", ".env"),
        os.path.abspath(".env")
    ]
    for p in candidatos_paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
            except Exception:
                pass


_cargar_env_local()


class VoiceService:
    """
    Servicio para síntesis de voz (Text-to-Speech) utilizando la API de ElevenLabs.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        default_voice_id: Optional[str] = None,
        default_model_id: Optional[str] = None
    ):
        _cargar_env_local()
        self.api_key = api_key or os.getenv("ELEVENLABS_API_KEY", "")
        # Voz por defecto (Rachel / Multilingual)
        self.default_voice_id = default_voice_id or os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
        self.default_model_id = default_model_id or os.getenv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2")

    def esta_configurado(self) -> bool:
        """Indica si la clave de API está presente."""
        _cargar_env_local()
        self.api_key = os.getenv("ELEVENLABS_API_KEY", self.api_key)
        return bool(self.api_key and self.api_key != "tu_api_key_aqui")

    def generar_audio_mp3(
        self,
        texto: str,
        voice_id: Optional[str] = None,
        model_id: Optional[str] = None
    ) -> bytes:
        """
        Llama al endpoint Text-to-Speech de ElevenLabs y devuelve el flujo binario MP3.
        """
        if not self.esta_configurado():
            raise ValueError(
                "La API Key de ElevenLabs no está configurada. "
                "Define ELEVENLABS_API_KEY en backend/.env o como variable de entorno."
            )

        target_voice = voice_id or self.default_voice_id
        target_model = model_id or self.default_model_id

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{target_voice}"
        
        payload = {
            "text": texto,
            "model_id": target_model,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "xi-api-key": self.api_key,
                "Accept": "audio/mpeg"
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                return response.read()
        except urllib.error.HTTPError as e:
            err_content = e.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Error de ElevenLabs (HTTP {e.code}): {err_content}")
        except Exception as e:
            raise RuntimeError(f"Fallo de conexión con ElevenLabs: {str(e)}")

    def redactar_guion_equipo(self, resultado_equipo: Dict[str, Any]) -> str:
        """
        Genera una narración en español, profesional y concisa,
        para locutar el equipo óptimo seleccionado.
        """
        nombre_proy = resultado_equipo.get("nombre_proyecto") or "el proyecto solicitado"
        equipo = resultado_equipo.get("equipo_recomendado", [])

        lineas = [f"Para {nombre_proy}, hemos seleccionado el siguiente equipo óptimo."]

        for miembro in equipo:
            rol = miembro.get("rol_buscado", "Rol técnico")
            cand = miembro.get("candidato_asignado")
            if cand:
                nombre = cand.get("nombre_completo", "Candidato")
                fit = cand.get("fit_score", 0)
                exp = cand.get("anios_experiencia", 0)
                fortaleza = cand.get("fortalezas", ["amplia trayectoria"])[0] if cand.get("fortalezas") else "sólida experiencia"
                lineas.append(
                    f"Para el puesto de {rol}, la mejor opción es {nombre}, con un ajuste del {fit}% "
                    f"y {exp} años de experiencia. Destaca por su {fortaleza}."
                )

        comp = resultado_equipo.get("analisis_complementariedad", [])
        if comp:
            lineas.append(comp[0])

        return " ".join(lineas)
