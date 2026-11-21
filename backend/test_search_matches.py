"""Test rápido de POST /api/projects/search-matches sin frontend."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

# Cargar .env si existe
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

TESTS = [
    {
        "name": "Data & AI project",
        "body": {
            "description": "Necesitamos un equipo para un proyecto de analytics y machine learning en banca. Queremos analizar datos de clientes con Python y ML para predecir churn.",
            "projectImportance": "high"
        }
    },
    {
        "name": "Cybersecurity public sector",
        "body": {
            "description": "Proyecto de ciberseguridad para reforzar la postura de seguridad de una entidad del sector público. Necesitamos expertos en ISO 27001, ENS y SOC.",
            "projectImportance": "critical"
        }
    },
    {
        "name": "Cloud migration",
        "body": {
            "description": "Migración a Azure cloud con Kubernetes y pipelines CI/CD para un cliente de retail.",
            "projectImportance": "medium"
        }
    }
]

passed = 0
for t in TESTS:
    resp = client.post(
        "/api/projects/search-matches",
        json=t["body"],
        content_type="application/json"
    )
    data = resp.get_json()
    ok = resp.status_code == 200
    has_profiles = bool(data.get("idealProfiles"))
    has_matches  = bool(data.get("roleMatches"))
    has_overview = bool(data.get("teamOverview"))

    status = "✅ PASS" if (ok and has_profiles and has_matches and has_overview) else "❌ FAIL"
    if ok and has_profiles and has_matches and has_overview:
        passed += 1

    print(f"{status} [{t['name']}]  HTTP {resp.status_code}")
    print(f"       idealProfiles: {len(data.get('idealProfiles', []))} | roleMatches: {len(data.get('roleMatches', []))} | teamOverview: {has_overview}")
    for rm in data.get("roleMatches", []):
        candidates = rm.get("matches", [])
        top = candidates[0] if candidates else {}
        print(f"       Rol '{rm.get('roleName')}' — {len(candidates)} candidatos, Top1: {top.get('nombre_completo','N/A')} (score={top.get('matchScore','?')})")
    print()

print(f"{'='*50}")
print(f"Resultado: {passed}/{len(TESTS)} tests pasados")
