from flask import Blueprint, request, Response, jsonify
from service import VoiceService
from dto import DTO_request_generar_audio

voice_bp = Blueprint("voice", __name__, url_prefix="/api/voice")
voice_service = VoiceService()


@voice_bp.route("/status", methods=["GET"])
def estado_servicio_voz():
    """Verifica si las credenciales de ElevenLabs están configuradas en el backend."""
    configurado = voice_service.esta_configurado()
    return jsonify({
        "status": "ok",
        "elevenlabs_configurado": configurado,
        "default_voice_id": voice_service.default_voice_id,
        "default_model_id": voice_service.default_model_id
    }), 200


@voice_bp.route("/narrar", methods=["POST"])
def narrar_texto():
    """
    Recibe un texto en el body y devuelve el audio MP3 generado por ElevenLabs.
    JSON esperado: { "texto": "...", "voice_id": "...", "model_id": "..." }
    """
    try:
        data = request.get_json() or {}
        dto = DTO_request_generar_audio.from_dict(data)

        if not dto.texto:
            return jsonify({
                "status": "error",
                "message": "El campo 'texto' es obligatorio."
            }), 400

        audio_bytes = voice_service.generar_audio_mp3(
            texto=dto.texto,
            voice_id=dto.voice_id,
            model_id=dto.model_id
        )

        return Response(audio_bytes, mimetype="audio/mpeg")
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


@voice_bp.route("/narrar-equipo", methods=["POST"])
def narrar_equipo():
    """
    Recibe el resultado del matching de equipo y locuta un resumen ejecutivo profesional.
    """
    try:
        data = request.get_json() or {}
        # Acepta el payload anidado bajo 'data' o directo
        resultado_equipo = data.get("data", data)

        guion = voice_service.redactar_guion_equipo(resultado_equipo)
        audio_bytes = voice_service.generar_audio_mp3(texto=guion)

        return Response(audio_bytes, mimetype="audio/mpeg")
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
