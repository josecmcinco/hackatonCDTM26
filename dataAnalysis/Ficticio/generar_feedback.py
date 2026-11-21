"""
Genera la base de datos ficticia `feedback` (una fila por empleado).

Columnas
--------
- employee_id      : mismo identificador que profiles_procesado.parquet (NTT0000001...)
- interes_cambio   : 1-5. Cuánto quiere cambiar de puesto (1 = nada, 5 = mucho)
- puesto_objetivo  : puesto al que aspira, en el mismo formato que `puesto_actual`
                     ("Senior Data Engineer"; los Mid van sin prefijo)
- distancia_rol    : 1-5. Lo distinto que es el puesto objetivo respecto al actual
                       1 = mismo puesto que tiene ahora
                       2 = ascenso en su mismo rol o rol "hermano" (AWS -> Azure, Java -> .NET)
                       3 = otro rol dentro de su misma área
                       4 = rol de un área afín (Software -> Data & AI)
                       5 = rol de un área muy distinta (Ciberseguridad -> RRHH)

Reglas de coherencia
--------------------
- interes_cambio = 1  ->  distancia_rol = 1 y puesto_objetivo = puesto_actual.
- Cuanto mayor es el interés, más probable es una distancia alta.
- Más años en NTT y menos seniority suben ligeramente el interés por cambiar.
- Trainee/Junior tienden a querer ascender (distancia 2).
- En cambios de área muy distinta (5) la mitad baja un nivel de seniority.
- Algunos roles en tendencia (GenAI, ML, Cloud/Security Architect...) son destinos más deseados.

Uso
---
    cd dataAnalysis/Ficticio
    python generar_feedback.py ../Procesado/profiles_procesado.parquet feedback.parquet

Genera feedback.parquet y feedback.csv. Semilla fija (42): siempre da el mismo resultado.
Solo necesita duckdb.
"""
import csv
import os
import random
import sys

import duckdb

SEED = 42

SENIORITIES = ["Trainee", "Junior", "Mid", "Senior", "Lead", "Principal"]

# Áreas afines (simétrico). Lo que no aparece aquí se considera "muy distinto".
AFINES = {
    "Cloud & Infraestructura": ["Software Engineering", "Ciberseguridad", "Telecom e IoT", "Data & AI"],
    "Software Engineering": ["Cloud & Infraestructura", "Data & AI", "Calidad y Testing",
                             "Aplicaciones Empresariales", "Automatización y RPA", "Diseño y Experiencia"],
    "Data & AI": ["Software Engineering", "Cloud & Infraestructura", "Automatización y RPA",
                  "Consultoría de Negocio"],
    "Aplicaciones Empresariales": ["Software Engineering", "Consultoría de Negocio", "Automatización y RPA"],
    "Consultoría de Negocio": ["Gestión y Delivery", "Aplicaciones Empresariales", "Diseño y Experiencia",
                               "Corporativo y Comercial", "Data & AI"],
    "Gestión y Delivery": ["Consultoría de Negocio", "Corporativo y Comercial", "Calidad y Testing"],
    "Ciberseguridad": ["Cloud & Infraestructura", "Software Engineering"],
    "Calidad y Testing": ["Software Engineering", "Gestión y Delivery", "Automatización y RPA"],
    "Corporativo y Comercial": ["Consultoría de Negocio", "Gestión y Delivery", "Diseño y Experiencia"],
    "Diseño y Experiencia": ["Software Engineering", "Consultoría de Negocio", "Corporativo y Comercial"],
    "Automatización y RPA": ["Software Engineering", "Data & AI", "Aplicaciones Empresariales",
                             "Calidad y Testing"],
    "Telecom e IoT": ["Cloud & Infraestructura", "Software Engineering"],
}
for a, vecinos in list(AFINES.items()):
    for b in vecinos:
        AFINES.setdefault(b, [])
        if a not in AFINES[b]:
            AFINES[b].append(a)

# Roles "hermanos": cambio casi lateral (distancia 2)
GRUPOS_HERMANOS = [
    ["Cloud Engineer (AWS)", "Cloud Engineer (Azure)", "Cloud Engineer (GCP)"],
    ["Backend Developer Java", "Backend Developer .NET", "Python Developer", "Full Stack Developer"],
    ["Frontend Developer", "Full Stack Developer", "Mobile Developer"],
    ["DevOps Engineer", "Site Reliability Engineer", "Platform Engineer"],
    ["Systems Administrator", "IT Operations Analyst", "IT Service Desk Technician"],
    ["Data Engineer", "Analytics Engineer"],
    ["Data Analyst", "BI Developer", "Analytics Engineer"],
    ["Data Scientist", "Machine Learning Engineer", "AI Engineer (GenAI/LLM)"],
    ["Machine Learning Engineer", "MLOps Engineer"],
    ["SAP MM/SD Consultant", "SAP FI/CO Consultant"],
    ["SAP ABAP Developer", "SAP BTP Developer"],
    ["Salesforce Consultant", "Salesforce Developer"],
    ["Oracle ERP Consultant", "Dynamics 365 Consultant", "Workday Consultant"],
    ["Functional Consultant (Banca)", "Functional Consultant (Seguros)"],
    ["Business Analyst", "Process Consultant (BPM)"],
    ["Product Owner", "Scrum Master / Agile Coach"],
    ["Project Manager", "Program Manager", "Delivery Manager"],
    ["Delivery Manager", "Service Delivery Manager"],
    ["PMO Analyst", "Project Manager"],
    ["SOC Analyst", "DFIR Analyst"],
    ["GRC Consultant", "Security Consultant (CISO Office)"],
    ["DevSecOps Engineer", "Security Architect"],
    ["QA Engineer", "Test Automation Engineer", "Performance Test Engineer"],
    ["UX Designer", "UI Designer", "UX Researcher"],
    ["CX Consultant", "Service Designer"],
    ["HR Business Partner", "Talent Acquisition Specialist"],
    ["Sales Executive", "Account Manager", "Pre-sales Solution Consultant"],
    ["RPA Developer", "Intelligent Automation Consultant"],
    ["5G Network Engineer", "Network Engineer"],
]

# Destinos más deseados (peso extra al elegir puesto objetivo)
ROLES_TENDENCIA = {
    "AI Engineer (GenAI/LLM)": 3.0, "Machine Learning Engineer": 2.0, "MLOps Engineer": 1.8,
    "Data Scientist": 1.8, "Cloud Architect": 2.0, "Software Architect": 1.8,
    "Security Architect": 1.8, "Platform Engineer": 1.6, "DevSecOps Engineer": 1.6,
    "Product Owner": 1.6, "Data Architect": 1.6, "SAP S/4HANA Architect": 1.5,
    # Destinos poco demandados
    "IT Service Desk Technician": 0.3, "Mainframe Developer (COBOL)": 0.4,
    "IT Operations Analyst": 0.6, "PMO Analyst": 0.7,
}

# P(distancia | interés)
P_DISTANCIA = {
    1: {1: 1.0},
    2: {1: 0.35, 2: 0.50, 3: 0.15},
    3: {1: 0.05, 2: 0.35, 3: 0.35, 4: 0.20, 5: 0.05},
    4: {2: 0.20, 3: 0.35, 4: 0.30, 5: 0.15},
    5: {2: 0.10, 3: 0.25, 4: 0.35, 5: 0.30},
}


def elegir(rng, dist):
    claves = list(dist)
    return rng.choices(claves, weights=[dist[k] for k in claves])[0]


def elegir_rol(rng, candidatos):
    pesos = [ROLES_TENDENCIA.get(r, 1.0) for r in candidatos]
    return rng.choices(candidatos, weights=pesos)[0]


def formatear(seniority, rol):
    return rol if seniority == "Mid" else f"{seniority} {rol}"


def main(origen, destino):
    rng = random.Random(SEED)
    con = duckdb.connect()
    origen_sql = origen.replace("\\", "/").replace("'", "''")

    filas = con.sql(f"""
        SELECT employee_id, rol, area, nivel_seniority, seniority_nivel, puesto_actual, anios_en_ntt
        FROM '{origen_sql}' ORDER BY employee_id
    """).fetchall()

    # Catálogo real: roles por área y seniorities que existen para cada rol
    roles_area, seniorities_rol = {}, {}
    for _, rol, area, sen, _, _, _ in filas:
        roles_area.setdefault(area, set()).add(rol)
        seniorities_rol.setdefault(rol, set()).add(sen)
    roles_area = {a: sorted(r) for a, r in roles_area.items()}
    area_de_rol = {r: a for a, rs in roles_area.items() for r in rs}

    hermanos = {}
    for grupo in GRUPOS_HERMANOS:
        for r in grupo:
            if r in area_de_rol:
                hermanos.setdefault(r, set()).update(x for x in grupo if x != r and x in area_de_rol)

    def seniority_valida(rol, nivel):
        """Seniority más cercana a `nivel` que exista para ese rol."""
        existentes = seniorities_rol[rol]
        orden = sorted(range(len(SENIORITIES)), key=lambda i: (abs(i - nivel), -i))
        return next(SENIORITIES[i] for i in orden if SENIORITIES[i] in existentes)

    salida = []
    for emp_id, rol, area, sen, nivel, puesto, anios_ntt in filas:
        # --- Interés en cambiar ---
        base = {1: 0.28, 2: 0.25, 3: 0.21, 4: 0.16, 5: 0.10}
        empuje = min(anios_ntt or 0, 10) / 10 * 0.6 + (0.4 if nivel <= 1 else 0) - (0.3 if nivel >= 5 else 0)
        pesos = {k: v * (1 + empuje * (k - 3) / 2) for k, v in base.items()}
        interes = elegir(rng, {k: max(v, 0.01) for k, v in pesos.items()})

        # --- Distancia ---
        p_dist = dict(P_DISTANCIA[interes])
        if nivel <= 1 and 2 in p_dist:          # los junior quieren sobre todo ascender
            p_dist[2] *= 1.8
        distancia = elegir(rng, p_dist)

        # --- Puesto objetivo ---
        if distancia == 1:
            objetivo = puesto
        elif distancia == 2:
            puede_ascender = nivel < 5 and seniority_valida(rol, nivel + 1) != sen
            if hermanos.get(rol) and (not puede_ascender or rng.random() < 0.35):
                rol_obj = elegir_rol(rng, sorted(hermanos[rol]))
                objetivo = formatear(seniority_valida(rol_obj, nivel), rol_obj)
            elif puede_ascender:
                objetivo = formatear(seniority_valida(rol, nivel + 1), rol)
            else:  # Principal sin hermanos: se queda en distancia 1
                distancia, objetivo = 1, puesto
        if distancia == 3:
            excluidos = {rol} | hermanos.get(rol, set())
            cands = [r for r in roles_area[area] if r not in excluidos]
            if cands:
                rol_obj = elegir_rol(rng, cands)
                objetivo = formatear(seniority_valida(rol_obj, nivel), rol_obj)
            else:  # área sin otros roles no-hermanos (p. ej. RPA): pasa a área afín
                distancia = 4
        if distancia >= 4:
            if distancia == 4:
                areas = AFINES.get(area, [])
            else:
                areas = [a for a in roles_area if a != area and a not in AFINES.get(area, [])]
            area_obj = rng.choice(sorted(areas))
            rol_obj = elegir_rol(rng, roles_area[area_obj])
            nivel_obj = nivel - 1 if (distancia == 5 and nivel > 0 and rng.random() < 0.5) else nivel
            objetivo = formatear(seniority_valida(rol_obj, nivel_obj), rol_obj)

        salida.append((emp_id, interes, objetivo, distancia))

    # --- Escritura ---
    base_dest, _ = os.path.splitext(destino)
    ruta_csv = base_dest + ".csv"
    with open(ruta_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["employee_id", "interes_cambio", "puesto_objetivo", "distancia_rol"])
        w.writerows(salida)

    csv_sql = ruta_csv.replace("\\", "/").replace("'", "''")
    dest_sql = (base_dest + ".parquet").replace("\\", "/").replace("'", "''")
    con.sql(f"""
        COPY (
            SELECT employee_id,
                   CAST(interes_cambio AS TINYINT) AS interes_cambio,
                   puesto_objetivo,
                   CAST(distancia_rol AS TINYINT) AS distancia_rol
            FROM read_csv('{csv_sql}', header=true,
                          columns={{'employee_id':'VARCHAR','interes_cambio':'INTEGER',
                                   'puesto_objetivo':'VARCHAR','distancia_rol':'INTEGER'}})
        ) TO '{dest_sql}' (FORMAT PARQUET)
    """)
    print(f"{len(salida)} filas -> {base_dest}.parquet / {ruta_csv}")


if __name__ == "__main__":
    origen = sys.argv[1] if len(sys.argv) > 1 else "../Procesado/profiles_procesado.parquet"
    destino = sys.argv[2] if len(sys.argv) > 2 else "feedback.parquet"
    main(origen, destino)
