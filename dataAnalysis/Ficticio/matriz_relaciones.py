"""
Utilidades para consultar relaciones.parquet como matriz.

    from matriz_relaciones import matriz, compatibilidad_equipo
    m = matriz(["NTT0000001", "NTT0000002", "NTT0004521"])
    print(m)                                   # filas valoran a columnas, 0 = sin datos
    print(compatibilidad_equipo(m.index))      # resumen del equipo
"""
import os
from typing import Iterable
import duckdb
import pandas as pd

RUTA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "relaciones.parquet").replace("\\", "/")


def matriz(ids: Iterable[str], ruta: str = RUTA) -> pd.DataFrame:
    """Matriz densa N×N para los IDs dados. Fila valora a columna (1–5); diagonal y sin relación = 0."""
    ids = list(dict.fromkeys(ids))
    rel = duckdb.execute(
        f"SELECT evaluador_id, evaluado_id, valoracion FROM '{ruta}' "
        "WHERE evaluador_id IN (SELECT unnest($1)) AND evaluado_id IN (SELECT unnest($1))",
        [ids],
    ).df()
    m = rel.pivot(index="evaluador_id", columns="evaluado_id", values="valoracion")
    return m.reindex(index=ids, columns=ids).fillna(0).astype(int)


def compatibilidad_equipo(ids: Iterable[str], ruta: str = RUTA) -> dict:
    """Media de las valoraciones conocidas dentro del equipo y pares problemáticos (valoración <= 2)."""
    m = matriz(ids, ruta)
    valores = m.where(m > 0).stack().dropna()
    conflictos = [(a, b, int(v)) for (a, b), v in valores.items() if v <= 2]
    n = len(m)
    return {
        "media": round(float(valores.mean()), 2) if len(valores) else None,
        "cobertura": round(len(valores) / (n * (n - 1)), 2) if n > 1 else 0.0,  # % de celdas con dato
        "conflictos": conflictos,
    }


def relaciones_de(employee_id: str, ruta: str = RUTA) -> pd.DataFrame:
    """Fila completa de un usuario: a quién valora y con qué nota."""
    return duckdb.execute(
        f"SELECT evaluado_id, valoracion, vinculo FROM '{ruta}' WHERE evaluador_id = ? ORDER BY valoracion DESC",
        [employee_id],
    ).df()
