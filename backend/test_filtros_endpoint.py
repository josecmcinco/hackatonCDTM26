"""Test rápido de los filtros duro + blando en POST /api/candidatos/equipo y /matching (sin frontend)."""
import sys, os, json, csv
sys.path.insert(0, os.path.dirname(__file__))

from app import app

client = app.test_client()
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
passed, total = 0, 0


def check(nombre, ok, detalle=""):
    global passed, total
    total += 1
    passed += bool(ok)
    print(f"{'✅ PASS' if ok else '❌ FAIL'} [{nombre}] {detalle}")


# 1. /matching con requisitos.json -> mismo ranking que el script del filtro blando
with open(os.path.join(RAIZ, "dataAnalysis", "FiltroDuro", "requisitos.json"), encoding="utf-8") as fh:
    requisitos = json.load(fh)
resp = client.post("/api/candidatos/matching", json=requisitos)
data = resp.get_json()
check("matching HTTP 200", resp.status_code == 200, f"filtro_duro={data.get('total_filtro_duro')} top={data.get('total')}")

ruta_csv = os.path.join(RAIZ, "dataAnalysis", "FiltroBlando", "candidatos_filtro_blando.csv")
if os.path.exists(ruta_csv):
    with open(ruta_csv, encoding="utf-8-sig") as fh:
        top_script = [r["employee_id"] for r in csv.DictReader(fh)][:10]
    top_api = [c["employee_id"] for c in data.get("candidatos", [])]
    check("matching = filtro_blando.py", top_api == top_script)

# 2. Las ponderaciones del request cambian el ranking
base = [c["employee_id"] for c in data.get("candidatos", [])]
resp = client.post("/api/candidatos/matching", json={**requisitos, "ponderaciones": {"skills": 0, "anios_en_ntt": 50}})
otro = [c["employee_id"] for c in resp.get_json().get("candidatos", [])]
check("ponderaciones cambian el ranking", resp.status_code == 200 and otro != base)

# 3. Campo de ponderación desconocido -> 400
resp = client.post("/api/candidatos/matching", json={**requisitos, "ponderaciones": {"skilz": 1}})
check("ponderación desconocida -> 400", resp.status_code == 400)

# 4. /equipo multi-rol: sin duplicados y con desglose del score
body = {
    "nombre_proyecto": "Migración core bancario a Azure",
    "ponderaciones": {"skills": 40, "compatibilidad_equipo": 10},
    "candidatos_ideales": [
        {"rol": "Cloud Architect", "anios_experiencia_minimos": 5, "sector": "Banca y Finanzas",
         "skills": [{"nombre": "Azure", "nivel_minimo": 4},
                    {"nombre": "Kubernetes", "nivel_minimo": 3, "es_obligatoria": False}],
         "idiomas": [{"idioma": "Inglés", "nivel_minimo": "B2"}], "top_k": 5},
        {"rol": "DevOps Engineer", "anios_experiencia_minimos": 3,
         "skills": [{"nombre": "Kubernetes", "nivel_minimo": 3},
                    {"nombre": "Terraform", "nivel_minimo": 2, "es_obligatoria": False}], "top_k": 5},
        {"rol": "Project Manager", "anios_experiencia_minimos": 8, "sector": "Banca y Finanzas", "top_k": 5},
    ],
}
resp = client.post("/api/candidatos/equipo", json=body)
res = resp.get_json().get("data", {})
check("equipo HTTP 200", resp.status_code == 200)
ids = [e["candidato_asignado"]["employee_id"] for e in res.get("equipo_recomendado", []) if e["candidato_asignado"]]
check("equipo sin duplicados", len(ids) == len(set(ids)), f"{len(ids)} asignados")
for e, r in zip(res.get("equipo_recomendado", []), res.get("ranking_por_rol", [])):
    c = e["candidato_asignado"] or {}
    print(f"       {e['rol_buscado']:<16} filtro_duro={r['total_filtro_duro']:>6} -> "
          f"{c.get('nombre_completo', 'N/A')} (fit={c.get('fit_score', '?')})")
primero = (res.get("equipo_recomendado") or [{}])[0].get("candidato_asignado") or {}
check("candidato con desglose_score", bool(primero.get("desglose_score")))

print(f"{'=' * 50}")
print(f"Resultado: {passed}/{total} tests pasados")
