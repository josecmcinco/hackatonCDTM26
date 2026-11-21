import os
from typing import List, Dict, Any, Optional
import duckdb


class CandidatosRepository:
    """
    Repositorio de acceso a datos para consultar perfiles de profesionales
    directamente desde el dataset parquet utilizando DuckDB en memoria.
    """

    def __init__(self, parquet_path: Optional[str] = None):
        if parquet_path is None:
            # Localizar CaseContext/profiles.parquet de forma robusta
            base_dir = os.path.dirname(os.path.abspath(__file__))
            # Subir dos niveles (repository -> backend -> root) y entrar a CaseContext
            default_path = os.path.abspath(os.path.join(base_dir, "..", "..", "CaseContext", "profiles.parquet"))
            self.parquet_path = default_path.replace("\\", "/")
        else:
            self.parquet_path = os.path.abspath(parquet_path).replace("\\", "/")

        if not os.path.exists(self.parquet_path):
            raise FileNotFoundError(f"No se encontró el dataset en la ruta: {self.parquet_path}")

    def _get_connection(self) -> duckdb.DuckDBPyConnection:
        # Crea una conexión DuckDB en memoria para ejecutar consultas concurrentes
        return duckdb.connect()

    def buscar_candidatos_prefiltrados(
        self,
        anios_minimos: int = 0,
        disponibilidades: Optional[List[str]] = None,
        modalidad_trabajo: Optional[str] = None,
        sector: Optional[str] = None,
        skills_nombres: Optional[List[str]] = None,
        limite: int = 250
    ) -> List[Dict[str, Any]]:
        """
        Ejecuta los filtros duros por código (anios_experiencia y disponibilidad)
        sobre los 190.000 perfiles en milisegundos.
        """
        con = self._get_connection()
        try:
            where_clauses = ["anios_experiencia >= ?"]
            params: List[Any] = [anios_minimos]

            # Filtro duro de disponibilidad
            if disponibilidades and len(disponibilidades) > 0:
                placeholders = ", ".join(["?"] * len(disponibilidades))
                where_clauses.append(f"disponibilidad IN ({placeholders})")
                params.extend(disponibilidades)

            # Filtro opcional de modalidad
            if modalidad_trabajo:
                where_clauses.append("modalidad_trabajo = ?")
                params.append(modalidad_trabajo)

            # Si hay sector, podemos dar prioridad o filtrar si es mandatorio
            sector_bonus_expr = "0"
            if sector:
                sector_bonus_expr = f"CASE WHEN sector_principal = '{sector}' THEN 1 ELSE 0 END"

            where_sql = " AND ".join(where_clauses)

            # Si se proporcionaron skills técnicas, pre-ordenamos por coincidencia en skills_texto
            order_by_sql = "anios_experiencia DESC"
            if skills_nombres and len(skills_nombres) > 0:
                # Construir una ponderación rápida por presencia de términos
                skill_conditions = []
                for s in skills_nombres:
                    clean_s = s.replace("'", "''").lower()
                    skill_conditions.append(f"CASE WHEN lower(skills_texto) LIKE '%{clean_s}%' THEN 1 ELSE 0 END")
                sum_skills = " + ".join(skill_conditions)
                order_by_sql = f"({sum_skills}) + ({sector_bonus_expr}) DESC, anios_experiencia DESC"

            query = f"""
                SELECT 
                    employee_id,
                    nombre_completo,
                    email,
                    area,
                    rol,
                    puesto_actual,
                    anios_experiencia,
                    disponibilidad,
                    sector_principal,
                    modalidad_trabajo,
                    skills,
                    skills_texto,
                    idiomas,
                    proyectos,
                    experiencia,
                    certificaciones,
                    resumen
                FROM '{self.parquet_path}'
                WHERE {where_sql}
                ORDER BY {order_by_sql}
                LIMIT {limite}
            """

            cur = con.execute(query, params)
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
            return [dict(zip(columns, row)) for row in rows]
        finally:
            con.close()

    def obtener_por_id(self, employee_id: str) -> Optional[Dict[str, Any]]:
        """Obtiene el detalle completo de un empleado por su ID."""
        con = self._get_connection()
        try:
            query = f"""
                SELECT *
                FROM '{self.parquet_path}'
                WHERE employee_id = ?
                LIMIT 1
            """
            cur = con.execute(query, [employee_id])
            columns = [desc[0] for desc in cur.description]
            row = cur.fetchone()
            return dict(zip(columns, row)) if row else None
        finally:
            con.close()
