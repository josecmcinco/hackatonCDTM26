from flask import Blueprint, request, jsonify
from service import VoiceService, AgenteService

agente_bp = Blueprint("agente", __name__, url_prefix="/api/agente")
voice_service = VoiceService()
agente_service = AgenteService()


@agente_bp.route("/status", methods=["GET"])
def estado_agente():
    """Comprueba el estado de configuración de ElevenLabs y Gemini."""
    return jsonify({
        "status": "ok",
        "elevenlabs_configurado": voice_service.esta_configurado(),
        "gemini_configurado": agente_service.esta_configurado(),
        "gemini_model": agente_service.model_name
    }), 200


@agente_bp.route("/audio", methods=["POST"])
def procesar_consulta_audio():
    """
    Flujo principal por voz:
    1. Recibe un archivo de audio (form-data bajo la clave 'audio' o 'file').
    2. Transcribe el audio a texto usando la API Speech-to-Text de ElevenLabs.
    3. Envía el texto a Gemini con el system prompt y las herramientas de DuckDB.
    4. Devuelve la recomendación final y las evidencias obtenidas.
    """
    try:
        audio_file = request.files.get("audio") or request.files.get("file")
        if not audio_file:
            return jsonify({
                "status": "error",
                "message": "Debes enviar un archivo de audio en el campo 'audio' o 'file'."
            }), 400

        audio_bytes = audio_file.read()
        filename = audio_file.filename or "consulta.mp3"
        content_type = audio_file.content_type or "audio/mpeg"

        # 1. Transcribir audio a texto con ElevenLabs
        texto_transcrito = voice_service.transcribir_audio(
            audio_bytes=audio_bytes,
            filename=filename,
            content_type=content_type
        )

        if not texto_transcrito:
            return jsonify({
                "status": "error",
                "message": "ElevenLabs no pudo extraer texto del audio proporcionado."
            }), 422

        # 2. Ejecutar el bucle de razonamiento de Gemini + Tools
        resultado_agente = agente_service.procesar_consulta(texto_transcrito)

        return jsonify({
            "status": "success",
            "audio_transcrito": texto_transcrito,
            "resultado": resultado_agente
        }), 200

    except ValueError as ve:
        return jsonify({
            "status": "configuration_error",
            "message": str(ve)
        }), 503
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@agente_bp.route("/texto", methods=["POST"])
def procesar_consulta_texto():
    """
    Endpoint complementario para pruebas directas en texto:
    Permite enviar la consulta en formato JSON sin necesidad de grabar audio.
    JSON esperado: { "texto": "Necesito un equipo para migrar core bancario..." }
    """
    try:
        data = request.get_json() or {}
        texto = data.get("texto") or data.get("prompt") or data.get("consulta")

        if not texto:
            return jsonify({
                "status": "error",
                "message": "El campo 'texto' es obligatorio."
            }), 400

        resultado_agente = agente_service.procesar_consulta(texto)

        return jsonify({
            "status": "success",
            "texto_recibido": texto,
            "resultado": resultado_agente
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
