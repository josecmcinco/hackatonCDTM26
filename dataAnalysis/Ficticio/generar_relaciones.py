"""
Genera la base de datos FICTICIA de relaciones entre empleados.

Lógica de matriz: el usuario FILA (evaluador_id) valora de 1 a 5 su relación
con el usuario COLUMNA (evaluado_id). 1 = mala compatibilidad, 5 = buena.
La diagonal y los pares sin relación valen 0 (sin datos).

Con 190.000 usuarios la matriz densa ocuparía >36 GB, así que se guarda en
formato disperso (largo): solo las celdas distintas de 0.

    evaluador_id | evaluado_id | valoracion | vinculo
    NTT0000001   | NTT0004521  | 4          | mismo_equipo

Uso:
    python generar_relaciones.py ../Procesado/profiles_procesado.parquet relaciones.parquet
"""
import sys
import numpy as np
import pandas as pd
import duckdb

SEED = 2026
rng = np.random.default_rng(SEED)

# Probabilidad de que cada contacto venga de cada tipo de vínculo
P_VINCULO = {"mismo_equipo": 0.65, "misma_area": 0.20, "misma_oficina": 0.15}
P_SOLO_UN_SENTIDO = 0.15   # % de relaciones que solo una de las dos personas ha valorado


def cargar(path):
    return duckdb.sql(f"""
        SELECT employee_id, area, ciudad, modalidad_trabajo,
               seniority_nivel, anios_en_ntt, habilidades_blandas
        FROM '{path}' ORDER BY employee_id
    """).df()


def muestrear_pares(users_idx, codigos_grupo):
    """Para cada usuario de users_idx elige un compañero al azar de su mismo grupo."""
    orden = np.argsort(codigos_grupo, kind="stable")
    cod_ordenados = codigos_grupo[orden]
    _, inicio, tam = np.unique(cod_ordenados, return_index=True, return_counts=True)
    g = np.searchsorted(np.unique(cod_ordenados), codigos_grupo[users_idx])
    pos = inicio[g] + (rng.random(len(users_idx)) * tam[g]).astype(np.int64)
    return orden[pos]


def main(src, dst):
    df = cargar(src)
    n = len(df)
    print(f"{n} perfiles cargados")

    cod_equipo = pd.factorize(df["area"] + "|" + df["ciudad"])[0]
    cod_area = pd.factorize(df["area"])[0]
    cod_ciudad = pd.factorize(df["ciudad"])[0]

    # Nº de contactos de cada persona: más antigüedad en NTT -> más relaciones
    antig = df["anios_en_ntt"].fillna(0).clip(0, 20).to_numpy()
    n_contactos = np.clip(3 + rng.poisson(2 + antig * 1.1), 3, 40)

    # Cada contacto genera un par no dirigido; se piden la mitad porque el otro lado
    # también propone pares (así el grado medio final ≈ n_contactos)
    proponentes = np.repeat(np.arange(n), np.ceil(n_contactos / 2).astype(int))
    tipo = rng.choice(list(P_VINCULO), size=len(proponentes), p=list(P_VINCULO.values()))

    u_list, v_list, t_list = [], [], []
    for t, codigos in (("mismo_equipo", cod_equipo), ("misma_area", cod_area), ("misma_oficina", cod_ciudad)):
        m = tipo == t
        u = proponentes[m]
        v = muestrear_pares(u, codigos)
        u_list.append(u); v_list.append(v); t_list.append(np.full(len(u), t))
    u = np.concatenate(u_list); v = np.concatenate(v_list); t = np.concatenate(t_list)

    # Quitar diagonal y duplicados (par no dirigido)
    ok = u != v
    u, v, t = u[ok], v[ok], t[ok]
    a, b = np.minimum(u, v), np.maximum(u, v)
    pares = pd.DataFrame({"a": a, "b": b, "vinculo": t})
    # Reetiquetar con el vínculo más fuerte real (un par de misma_area puede ser también mismo_equipo)
    pares = pares.drop_duplicates(["a", "b"]).reset_index(drop=True)
    a, b = pares["a"].to_numpy(), pares["b"].to_numpy()
    mismo_eq = cod_equipo[a] == cod_equipo[b]
    misma_area = cod_area[a] == cod_area[b]
    pares["vinculo"] = np.where(mismo_eq, "mismo_equipo", np.where(misma_area, "misma_area", "misma_oficina"))
    print(f"{len(pares)} pares de compañeros")

    # --- Afinidad del par (compartida por ambos lados) ---
    blandas = df["habilidades_blandas"].apply(lambda x: list(x) if x is not None else [])
    vocab = {s: i for i, s in enumerate(sorted({s for l in blandas for s in l}))}
    assert len(vocab) <= 63
    mask = np.array([sum(1 << vocab[s] for s in l) for l in blandas], dtype=np.uint64)
    comunes = np.array([bin(int(x)).count("1") for x in (mask[a] & mask[b])])

    misma_mod = (df["modalidad_trabajo"].to_numpy()[a] == df["modalidad_trabajo"].to_numpy()[b]).astype(float)
    sen = df["seniority_nivel"].fillna(2).to_numpy().astype(float)
    dif_sen = np.abs(sen[a] - sen[b])
    bonus_vinculo = np.where(mismo_eq, 0.25, np.where(misma_area, 0.0, -0.15))

    afinidad = (3.1 + 0.30 * comunes + 0.25 * misma_mod - 0.12 * dif_sen
                + bonus_vinculo + rng.normal(0, 0.95, len(a)))

    # --- Sesgo de cada evaluador (hay gente que puntúa más duro o más blando) ---
    sesgo = rng.normal(0, 0.35, n)

    def puntuar(evaluador, evaluado):
        x = afinidad + sesgo[evaluador] + rng.normal(0, 0.45, len(evaluador))
        return np.clip(np.rint(x), 1, 5).astype(np.int8)

    r_ab = puntuar(a, b)
    r_ba = puntuar(b, a)

    # Algunas relaciones solo están valoradas en un sentido
    solo = rng.random(len(a)) < P_SOLO_UN_SENTIDO
    lado = rng.random(len(a)) < 0.5
    keep_ab = ~solo | lado
    keep_ba = ~solo | ~lado

    ids = df["employee_id"].to_numpy()
    rel = pd.concat([
        pd.DataFrame({"evaluador_id": ids[a[keep_ab]], "evaluado_id": ids[b[keep_ab]],
                      "valoracion": r_ab[keep_ab], "vinculo": pares["vinculo"].to_numpy()[keep_ab]}),
        pd.DataFrame({"evaluador_id": ids[b[keep_ba]], "evaluado_id": ids[a[keep_ba]],
                      "valoracion": r_ba[keep_ba], "vinculo": pares["vinculo"].to_numpy()[keep_ba]}),
    ], ignore_index=True)
    rel = rel.sort_values(["evaluador_id", "evaluado_id"]).reset_index(drop=True)
    rel["vinculo"] = rel["vinculo"].astype("category")

    rel.to_parquet(dst, index=False, compression="zstd")
    print(f"{len(rel)} valoraciones guardadas en {dst}")
    print(rel["valoracion"].value_counts().sort_index().to_string())


if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "../Procesado/profiles_procesado.parquet"
    dst = sys.argv[2] if len(sys.argv) > 2 else "relaciones.parquet"
    main(src, dst)
