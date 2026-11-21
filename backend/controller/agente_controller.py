from flask import Blueprint, request, jsonify
from service import AgenteService

agente_bp = Blueprint("agente", __name__, url_prefix="/api/agente")
agente_service = AgenteService()


@agente_bp.route("/status", methods=["GET"])
def estado_agente():
    """Comprueba el estado de configuración de Gemini y el modelo activo."""
    return jsonify({
        "status": "ok",
        "gemini_configurado": agente_service.esta_configurado(),
        "gemini_model": agente_service.model_name
    }), 200


@agente_bp.route("/brief", methods=["POST"])
@agente_bp.route("/texto", methods=["POST"])
def procesar_consulta_brief():
    """
    Endpoint principal del agente inteligente:
    1. Recibe la necesidad del proyecto en lenguaje natural (texto libre).
    2. Ejecuta el bucle de razonamiento de Gemini con las herramientas (tools) sobre DuckDB.
    3. Retorna la propuesta del equipo óptimo y los candidatos evaluados con evidencias.
    
    JSON esperado: { "texto": "Necesito un equipo para migrar core bancario a la nube con Azure..." }
    """
    try:
        data = request.get_json() or {}
        texto = data.get("texto") or data.get("prompt") or data.get("consulta") or data.get("brief")

        if not texto:
            return jsonify({
                "status": "error",
                "message": "El campo 'texto' o 'brief' es obligatorio."
            }), 400

        resultado_agente = agente_service.procesar_consulta(texto)

        return jsonify({
            "status": "success",
            "consulta_recibida": texto,
            "resultado": resultado_agente
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
