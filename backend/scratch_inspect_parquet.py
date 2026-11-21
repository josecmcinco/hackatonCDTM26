"""Inspecciona todas las columnas del parquet para ver qué campos reales hay."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import duckdb

base_dir = os.path.dirname(os.path.abspath(__file__))
parquet = os.path.abspath(os.path.join(base_dir, "..", "CaseContext", "profiles.parquet")).replace("\\", "/")

con = duckdb.connect()
# Columnas
cur = con.execute(f"DESCRIBE SELECT * FROM '{parquet}' LIMIT 1")
print("=== COLUMNAS DEL PARQUET ===")
for row in cur.fetchall():
    print(f"  {row[0]:35s}  {row[1]}")

# Una fila de muestra
print("\n=== FILA DE MUESTRA ===")
cur2 = con.execute(f"SELECT * FROM '{parquet}' LIMIT 1")
cols = [d[0] for d in cur2.description]
row = cur2.fetchone()
for c, v in zip(cols, row):
    print(f"  {c:35s} = {repr(v)[:120]}")
con.close()
