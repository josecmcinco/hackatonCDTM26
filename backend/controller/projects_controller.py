"""
ProjectsController
==================
Blueprint `/api/projects` — expone el endpoint principal que llama el frontend.
"""

from flask import Blueprint, request, jsonify
from service.search_matches_service import SearchMatchesService
from dto.dto_request_search_matches import DTO_request_search_matches

projects_bp = Blueprint("projects", __name__, url_prefix="/api/projects")

_service = SearchMatchesService()


@projects_bp.route("/search-matches", methods=["POST"])
def search_matches():
    """
    POST /api/projects/search-matches
    Body: { "description": str, "projectImportance": str, "idealProfiles"?: IdealProfile[] }
    Si se pasan idealProfiles precomputados, se usan directamente (evita re-inferir).
    Returns: ProjectSearchResponse
    """
    body = request.get_json(force=True, silent=True) or {}

    description = str(body.get("description", "")).strip()
    if not description:
        return jsonify({"error": "El campo 'description' es obligatorio."}), 400

    project_importance = str(body.get("projectImportance", "balanced")).strip()
    ideal_profiles_precomputed = body.get("idealProfiles")  # opcional

    dto = DTO_request_search_matches(
        description=description,
        projectImportance=project_importance
    )

    try:
        result = _service.procesar_search_matches(dto, ideal_profiles_precomputed)
        return jsonify(result), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@projects_bp.route("/infer-profiles", methods=["POST"])
def infer_profiles():
    """
    POST /api/projects/infer-profiles
    Body: { "description": str, "projectImportance": str }
    Returns: { "idealProfiles": IdealProfile[] }
    Solo infiere los perfiles ideales sin buscar candidatos reales.
    """
    body = request.get_json(force=True, silent=True) or {}
    description = str(body.get("description", "")).strip()
    if not description:
        return jsonify({"error": "El campo 'description' es obligatorio."}), 400

    project_importance = str(body.get("projectImportance", "balanced")).strip()

    try:
        profiles = _service._inferir_perfiles_ideales(description, project_importance)
        return jsonify({"idealProfiles": profiles}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@projects_bp.route("/status", methods=["GET"])
def status():
    return jsonify({"status": "ok", "blueprint": "projects"}), 200
