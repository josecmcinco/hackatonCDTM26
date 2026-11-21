"""Llamada de prueba a POST /api/projects/search-matches y print del JSON completo."""
import sys, os, json
sys.path.insert(0, os.path.dirname(__file__))

env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

from app import app

client = app.test_client()

payload = {
    "description": "Necesitamos reforzar la ciberseguridad de un organismo del sector público español. El equipo debe incluir expertos en ENS (Esquema Nacional de Seguridad), ISO 27001 y gestión de incidentes SOC. Disponibilidad inmediata obligatoria.",
    "projectImportance": "critical"
}

resp = client.post(
    "/api/projects/search-matches",
    json=payload,
    content_type="application/json"
)

data = resp.get_json()
print(json.dumps(data, indent=2, ensure_ascii=False))
