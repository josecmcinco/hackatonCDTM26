# relaciones.parquet: base de datos ficticia de relaciones

Matriz de compatibilidad entre los 190.000 empleados de `profiles_procesado.parquet` (IDs `NTT0000001`–`NTT0190000`).

- El usuario **fila** (`evaluador_id`) valora del 1 al 5 su relación con el usuario **columna** (`evaluado_id`).
- 1 = mala compatibilidad, 5 = buena.
- La diagonal y los pares sin relación valen **0 (sin datos)**.

Los datos son **simulados**: el generador los crea con una semilla fija a partir de los perfiles. No proceden del caso de NTT DATA.

## Formato

Una matriz densa de 190k × 190k ocuparía más de 36 GB, así que solo se guardan las celdas distintas de 0 (formato disperso):

| columna | tipo | descripción |
|---|---|---|
| `evaluador_id` | VARCHAR | fila de la matriz: quien valora |
| `evaluado_id` | VARCHAR | columna de la matriz: a quien valora |
| `valoracion` | TINYINT | 1–5 |
| `vinculo` | categoría | `mismo_equipo` (misma área y ciudad), `misma_area` u `misma_oficina` (misma ciudad, distinta área) |

Cualquier par que no aparezca en el fichero vale 0.

## Cifras

- 1.605.233 valoraciones, de unos 870.000 pares de compañeros.
- Todos los usuarios valoran a alguien: 8,4 relaciones de media (de 1 a 26). Quien lleva más años en NTT tiene más relaciones.
- No hay filas en la diagonal, duplicados ni IDs que no existan en los perfiles.
- Distribución de notas: 1 → 5 %, 2 → 17 %, 3 → 32 %, 4 → 30 %, 5 → 17 %.

## Cómo se generan las notas

1. A cada par se le calcula una afinidad común: base de 3,1, más habilidades blandas compartidas y misma modalidad de trabajo, menos la diferencia de seniority, más un extra por ser del mismo equipo y un componente aleatorio.
2. Cada evaluador tiene un sesgo propio (hay gente que puntúa más duro), y cada dirección añade un poco de ruido. Por eso **A→B y B→A no son iguales**, aunque están correladas (r ≈ 0,7).
3. El 15 % de las relaciones solo se ha valorado en un sentido.

## Uso

```python
# Consulta directa con DuckDB, igual que el backend
import duckdb
duckdb.sql("SELECT * FROM 'dataAnalysis/Ficticio/relaciones.parquet' WHERE evaluador_id = 'NTT0000001'")

# Matriz densa para un equipo candidato
from matriz_relaciones import matriz, compatibilidad_equipo
m = matriz(["NTT0000001", "NTT0012345", "NTT0099999"])
compatibilidad_equipo(m.index)   # {'media': ..., 'cobertura': ..., 'conflictos': [(fila, columna, nota), ...]}
```

## Regenerar

```bash
cd dataAnalysis/Ficticio
python generar_relaciones.py ../Procesado/profiles_procesado.parquet relaciones.parquet
```
