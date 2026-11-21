from flask import Blueprint, request, jsonify
from service import CandidatosService
from dto import DTO_request_candidato_ideal, DTO_request_obtener_candidatos, DTO_ponderacion_filtro_blando

candidatos_bp = Blueprint("candidatos", __name__, url_prefix="/api/candidatos")
service = CandidatosService()


@candidatos_bp.route("/matching", methods=["POST"])
def buscar_candidatos_individual():
    """
    Endpoint para buscar y clasificar los mejores candidatos para un único rol ideal.
    Espera un JSON compatible con DTO_request_candidato_ideal y, opcionalmente:
      - "ponderaciones" (o "pesos"): pesos del filtro blando (DTO_ponderacion_filtro_blando).
      - "equipo_actual": employee_id ya elegidos (no compiten y se usan en compatibilidad_equipo).
    """
    try:
        data = request.get_json() or {}
        dto = DTO_request_candidato_ideal.from_dict(data)
        ponderaciones = DTO_ponderacion_filtro_blando.from_dict(data.get("ponderaciones", data.get("pesos")))
        equipo_actual = [str(e) for e in (data.get("equipo_actual") or [])]

        resultado = service.evaluar_rol(dto, ponderaciones=ponderaciones, equipo_actual=equipo_actual)
        return jsonify({
            "status": "success",
            "total": len(resultado["candidatos"]),
            "total_filtro_duro": resultado["total_filtro_duro"],
            "total_filtro_blando": resultado["total_filtro_blando"],
            "preseleccion_aplicada": resultado["preseleccion_aplicada"],
            "factores_usados": resultado["factores_usados"],
            "factores_no_aplicables": resultado["factores_no_aplicables"],
            "candidatos": resultado["candidatos"]
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400


@candidatos_bp.route("/equipo", methods=["POST"])
def buscar_equipo_optimo():
    """
    Endpoint principal para formar un equipo completo multi-rol a partir de
    un conjunto de candidatos ideales (DTO_request_obtener_candidatos).
    Garantiza que no se repitan candidatos en distintos roles.
    """
    try:
        data = request.get_json() or {}
        dto = DTO_request_obtener_candidatos.from_dict(data)
        
        resultado = service.obtener_candidatos_para_equipo(dto)
        return jsonify({
            "status": "success",
            "data": resultado
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400


@candidatos_bp.route("/<string:employee_id>", methods=["GET"])
def obtener_candidato_por_id(employee_id: str):
    """
    Obtiene el detalle completo de un profesional a partir de su ID de empleado.
    """
    try:
        candidato = service.repository.obtener_por_id(employee_id)
        if not candidato:
            return jsonify({
                "status": "not_found",
                "message": f"No se encontró el candidato con ID {employee_id}"
            }), 404

        return jsonify({
            "status": "success",
            "candidato": candidato
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
