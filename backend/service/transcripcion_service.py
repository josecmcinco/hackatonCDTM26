import os
import json
import base64
import uuid
import time
import urllib.request
import urllib.error
from typing import Optional, Dict, Any
from dto import DTO_request_transcribir_audio, DTO_response_transcripcion


def _cargar_env_local():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    for p in [os.path.join(base_dir, "..", ".env"), os.path.join(base_dir, "..", "..", ".env"), os.path.abspath(".env")]:
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


class TranscripcionService:
    """
    Servicio dedicado a la transcripción de audio (Speech-to-Text):
    - Admite audio continuo o fragmentado (chunks) mientras el usuario habla.
    - Soporte multi-motor: ElevenLabs Scribe (STT) y Gemini Audio como respaldo.
    """

    def __init__(self):
        _cargar_env_local()
        self.elevenlabs_key = os.getenv("ELEVENLABS_API_KEY", "")
        self.gemini_key = os.getenv("GEMINI_API_KEY", "")
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    def _recargar_keys(self):
        _cargar_env_local()
        self.elevenlabs_key = os.getenv("ELEVENLABS_API_KEY", "")
        self.gemini_key = os.getenv("GEMINI_API_KEY", "")

    def tiene_motor_disponible(self) -> bool:
        self._recargar_keys()
        valida_11 = bool(self.elevenlabs_key and self.elevenlabs_key != "tu_elevenlabs_api_key_aqui")
        valida_gemini = bool(self.gemini_key and self.gemini_key != "tu_gemini_api_key_aqui")
        return valida_11 or valida_gemini

    def transcribir_con_elevenlabs(
        self,
        audio_bytes: bytes,
        filename: str = "fragmento.webm",
        content_type: str = "audio/webm"
    ) -> str:
        """Transcribe audio usando ElevenLabs Scribe STT."""
        url = "https://api.elevenlabs.io/v1/speech-to-text"
        boundary = f"----WebKitBoundary{uuid.uuid4().hex}"

        part_boundary = f"--{boundary}\r\n".encode("utf-8")
        body_parts = []

        # Campo: model_id
        body_parts.append(part_boundary)
        body_parts.append(b'Content-Disposition: form-data; name="model_id"\r\n\r\nscribe_v1\r\n')

        # Campo: file
        body_parts.append(part_boundary)
        header_file = (
            f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
            f'Content-Type: {content_type}\r\n\r\n'
        ).encode("utf-8")
        body_parts.append(header_file)
        body_parts.append(audio_bytes)
        body_parts.append(b"\r\n")

        # Cierre del boundary
        body_parts.append(f"--{boundary}--\r\n".encode("utf-8"))
        full_body = b"".join(body_parts)

        req = urllib.request.Request(
            url,
            data=full_body,
            headers={
                "xi-api-key": self.elevenlabs_key,
                "Content-Type": f"multipart/form-data; boundary={boundary}",
                "Content-Length": str(len(full_body))
            },
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=30) as response:
            resp_json = json.loads(response.read().decode("utf-8"))
            return resp_json.get("text", "").strip()

    def transcribir_con_gemini(
        self,
        audio_bytes: bytes,
        content_type: str = "audio/webm"
    ) -> str:
        """Transcribe audio usando la capacidad multimodal nativa de Gemini Flash."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.gemini_key}"
        b64_audio = base64.b64encode(audio_bytes).decode("utf-8")

        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "inline_data": {
                                "mime_type": content_type,
                                "data": b64_audio
                            }
                        },
                        {
                            "text": (
                                "Transcribe única y fielmente lo que se escucha en este audio en español. "
                                "Devuelve exclusivamente el texto transcrito, sin añadir introducciones, "
                                "comentarios ni etiquetas."
                            )
                        }
                    ]
                }
            ]
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=30) as response:
            resp_json = json.loads(response.read().decode("utf-8"))
            candidates = resp_json.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                textos = [p.get("text", "") for p in parts if "text" in p]
                return "".join(textos).strip()
            return ""

    def transcribir_audio_bytes(
        self,
        audio_bytes: bytes,
        filename: str = "audio.webm",
        content_type: str = "audio/webm"
    ) -> Dict[str, Any]:
        """
        Orquesta la transcripción priorizando ElevenLabs y conmutando a Gemini
        si hay fallo o si ElevenLabs no está configurado.
        """
        self._recargar_keys()
        t0 = time.time()

        # 1. Intentar ElevenLabs si hay API key
        if self.elevenlabs_key and self.elevenlabs_key != "tu_elevenlabs_api_key_aqui":
            try:
                texto = self.transcribir_con_elevenlabs(audio_bytes, filename, content_type)
                duracion_ms = int((time.time() - t0) * 1000)
                return {"texto": texto, "motor": "elevenlabs", "duracion_ms": duracion_ms}
            except Exception as e:
                # Si falla ElevenLabs, intentar respaldo con Gemini
                if not (self.gemini_key and self.gemini_key != "tu_gemini_api_key_aqui"):
                    raise RuntimeError(f"Fallo en ElevenLabs STT: {str(e)}")

        # 2. Intentar Gemini Flash multimodal si hay API key
        if self.gemini_key and self.gemini_key != "tu_gemini_api_key_aqui":
            try:
                texto = self.transcribir_con_gemini(audio_bytes, content_type)
                duracion_ms = int((time.time() - t0) * 1000)
                return {"texto": texto, "motor": "gemini", "duracion_ms": duracion_ms}
            except Exception as e:
                raise RuntimeError(f"Fallo en transcripción con Gemini: {str(e)}")

        raise ValueError(
            "No hay ningún motor de transcripción configurado. "
            "Define ELEVENLABS_API_KEY o GEMINI_API_KEY en backend/.env."
        )

    def procesar_chunk_streaming(
        self,
        dto_request: DTO_request_transcribir_audio
    ) -> DTO_response_transcripcion:
        """
        Procesa un fragmento de audio (chunk) enviado desde el navegador mientras el usuario habla.
        """
        if not dto_request.audio_base64:
            return DTO_response_transcripcion(
                status="error",
                mensaje_error="No se ha recibido el fragmento de audio en base64.",
                es_final=dto_request.es_final
            )

        try:
            # Limpiar cabecera Data URL si viene con prefijo (ej. 'data:audio/webm;base64,....')
            raw_b64 = dto_request.audio_base64
            if "," in raw_b64:
                raw_b64 = raw_b64.split(",", 1)[1]

            audio_bytes = base64.b64decode(raw_b64)
            if len(audio_bytes) < 100:  # Demasiado corto o silencio vacío
                return DTO_response_transcripcion(
                    status="success",
                    texto="",
                    texto_acumulado=dto_request.texto_acumulado_previo,
                    es_final=dto_request.es_final,
                    motor_utilizado="skip_silencio"
                )

            res = self.transcribir_audio_bytes(
                audio_bytes=audio_bytes,
                filename="chunk.webm",
                content_type=dto_request.formato
            )

            texto_nuevo = res.get("texto", "").strip()

            # Concatenar con el texto acumulado previo
            if dto_request.texto_acumulado_previo:
                if texto_nuevo and not dto_request.texto_acumulado_previo.endswith(" "):
                    texto_total = f"{dto_request.texto_acumulado_previo} {texto_nuevo}"
                else:
                    texto_total = f"{dto_request.texto_acumulado_previo}{texto_nuevo}"
            else:
                texto_total = texto_nuevo

            return DTO_response_transcripcion(
                status="success",
                texto=texto_nuevo,
                texto_acumulado=texto_total.strip(),
                es_final=dto_request.es_final,
                motor_utilizado=res.get("motor", "unknown"),
                duracion_ms=res.get("duracion_ms")
            )

        except Exception as e:
            return DTO_response_transcripcion(
                status="error",
                texto="",
                texto_acumulado=dto_request.texto_acumulado_previo,
                es_final=dto_request.es_final,
                mensaje_error=str(e)
            )
