from flask import Blueprint, request, jsonify
from service import TranscripcionService
from dto import DTO_request_transcribir_audio, DTO_response_transcripcion

transcripcion_bp = Blueprint("transcripcion", __name__, url_prefix="/api/transcripcion")
transcripcion_service = TranscripcionService()


@transcripcion_bp.route("/status", methods=["GET"])
def estado_transcripcion():
    """Comprueba si hay algún motor de transcripción (ElevenLabs o Gemini) listo."""
    listo = transcripcion_service.tiene_motor_disponible()
    return jsonify({
        "status": "ok",
        "motor_disponible": listo,
        "elevenlabs_activo": bool(transcripcion_service.elevenlabs_key and transcripcion_service.elevenlabs_key != "tu_elevenlabs_api_key_aqui"),
        "gemini_activo": bool(transcripcion_service.gemini_key and transcripcion_service.gemini_key != "tu_gemini_api_key_aqui")
    }), 200


@transcripcion_bp.route("/chunk", methods=["POST"])
def transcribir_chunk():
    """
    Endpoint asíncrono para streaming de fragmentos mientras el usuario habla.
    
    JSON esperado:
    {
        "audio_base64": "GkXfo59ChoEBQveBAULygQ8...",
        "formato": "audio/webm",
        "es_final": false,
        "texto_acumulado_previo": "Necesito un equipo"
    }
    
    Respuesta: DTO_response_transcripcion
    """
    try:
        data = request.get_json() or {}
        dto_req = DTO_request_transcribir_audio.from_dict(data)

        dto_res = transcripcion_service.procesar_chunk_streaming(dto_req)
        return jsonify(dto_res.to_dict()), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "texto": "",
            "texto_acumulado": data.get("texto_acumulado_previo", "") if "data" in locals() else "",
            "mensaje_error": str(e)
        }), 500


@transcripcion_bp.route("/audio", methods=["POST"])
def transcribir_archivo_completo():
    """
    Endpoint para transcribir el archivo de audio completo cuando se pulsa stop
    o se sube un audio grabado.
    
    Espera multipart/form-data con el campo 'audio' o 'file'.
    """
    try:
        audio_file = request.files.get("audio") or request.files.get("file")
        if not audio_file:
            return jsonify({
                "status": "error",
                "mensaje_error": "No se recibió ningún archivo en 'audio' o 'file'."
            }), 400

        audio_bytes = audio_file.read()
        filename = audio_file.filename or "grabacion.webm"
        content_type = audio_file.content_type or "audio/webm"

        res = transcripcion_service.transcribir_audio_bytes(
            audio_bytes=audio_bytes,
            filename=filename,
            content_type=content_type
        )

        dto_res = DTO_response_transcripcion(
            status="success",
            texto=res.get("texto", ""),
            texto_acumulado=res.get("texto", ""),
            es_final=True,
            motor_utilizado=res.get("motor", "unknown"),
            duracion_ms=res.get("duracion_ms")
        )

        return jsonify(dto_res.to_dict()), 200

    except ValueError as ve:
        return jsonify({
            "status": "configuration_error",
            "mensaje_error": str(ve)
        }), 503
    except Exception as e:
        return jsonify({
            "status": "error",
            "mensaje_error": str(e)
        }), 500
