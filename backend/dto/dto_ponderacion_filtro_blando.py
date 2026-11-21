from dataclasses import dataclass, fields
from typing import Dict, Any, Optional, List


# Base de datos de la que sale cada campo ponderable
FUENTE_PERFILES = "perfiles"        # dataAnalysis/Procesado/profiles_procesado.parquet
FUENTE_FEEDBACK = "feedback"        # dataAnalysis/Ficticio/feedback.parquet
FUENTE_RELACIONES = "relaciones"    # dataAnalysis/Ficticio/relaciones.parquet (matriz de relaciones)


@dataclass
class DTO_ponderacion_filtro_blando:
    """
    Ponderación (peso relativo) de cada campo dentro del filtro blando (scoring / ranking).

    - Perfiles: un campo por cada columna de profiles_procesado.parquet, salvo las
      de identificación y datos personales (employee_id, nombre, apellidos,
      nombre_completo, email) y las redundantes (skills_texto se deriva de skills,
      fecha_incorporacion equivale a anios_en_ntt). Las columnas derivadas de la
      limpieza (nivel_ingles_num, sectores_experiencia, skills_texto_ampliado...)
      son ayudas para puntuar estos mismos campos, no pesos aparte.
    - Feedback (ficticio): interes_cambio, puesto_objetivo y distancia_rol, unidos
      por employee_id.
    - Relaciones (ficticio): compatibilidad_equipo, calculada con la matriz de
      relaciones entre el candidato y el resto de integrantes del equipo.
    - Los nombres coinciden con las columnas de cada parquet para poder iterar
      sobre ellos en el servicio; `fuente(campo)` indica de qué base sale cada uno.
    - Los pesos son números >= 0 en cualquier escala: se normalizan con
      `normalizadas()` para que sumen 1. Un peso 0 desactiva ese campo.
    - Los valores por defecto reproducen el scoring actual de CandidatosService
      (skills 50, experiencia 20, sector 15, idiomas 15); los campos nuevos
      empiezan a 0 hasta que el servicio los use.
    """

    # ───────────── Perfiles (profiles_procesado.parquet) ─────────────
    # Rol y puesto
    area: float = 0.0
    rol: float = 0.0
    nivel_seniority: float = 0.0
    puesto_actual: float = 0.0

    # Experiencia (anios_experiencia también es filtro duro; aquí puntúa el exceso sobre el mínimo)
    anios_experiencia: float = 20.0
    anios_en_ntt: float = 0.0

    # Sector, disponibilidad y condiciones de trabajo
    sector_principal: float = 15.0
    disponibilidad: float = 0.0          # También filtro duro; aquí puede premiar "En banca" frente a "Roll-off"
    modalidad_trabajo: float = 0.0
    movilidad_internacional: float = 0.0

    # Ubicación
    pais: float = 0.0
    ciudad: float = 0.0

    # Competencias
    skills: float = 50.0
    metodologias: float = 0.0
    habilidades_blandas: float = 0.0
    idiomas: float = 15.0
    certificaciones: float = 0.0

    # Trayectoria y formación
    estudios: float = 0.0
    experiencia: float = 0.0
    proyectos: float = 0.0

    # Texto libre (p. ej. similitud semántica con la descripción de la necesidad)
    resumen: float = 0.0

    # ───────────── Feedback (Ficticio/feedback.parquet) ─────────────
    interes_cambio: float = 0.0     # 1-5: cuánto quiere cambiar de puesto
    puesto_objetivo: float = 0.0    # Premia que el puesto al que aspira coincida con el rol buscado
    distancia_rol: float = 0.0      # 1-5: lo lejos que está su puesto objetivo del actual

    # ───────────── Relaciones (Ficticio/relaciones.parquet) ─────────────
    # Compatibilidad del candidato con el resto de integrantes del equipo según la
    # matriz de relaciones (valoraciones 1-5 en ambos sentidos, 0 = sin datos).
    compatibilidad_equipo: float = 0.0

    def __post_init__(self):
        for f in fields(self):
            valor = getattr(self, f.name)
            if isinstance(valor, bool):
                raise ValueError(f"La ponderación de '{f.name}' debe ser numérica (recibido: {valor!r}).")
            try:
                valor = float(valor)
            except (TypeError, ValueError):
                raise ValueError(f"La ponderación de '{f.name}' debe ser numérica (recibido: {valor!r}).")
            if valor < 0:
                raise ValueError(f"La ponderación de '{f.name}' no puede ser negativa (recibido: {valor}).")
            setattr(self, f.name, valor)

    # ───────────── Metadatos de los campos ─────────────
    @classmethod
    def campos(cls) -> List[str]:
        """Lista de campos ponderables."""
        return [f.name for f in fields(cls)]

    @classmethod
    def campos_por_fuente(cls, fuente: str) -> List[str]:
        """Campos que salen de una base concreta (perfiles, feedback o relaciones)."""
        return [c for c in cls.campos() if cls.fuente(c) == fuente]

    @staticmethod
    def fuente(campo: str) -> str:
        """Base de datos de la que sale un campo."""
        if campo in _CAMPOS_FEEDBACK:
            return FUENTE_FEEDBACK
        if campo in _CAMPOS_RELACIONES:
            return FUENTE_RELACIONES
        return FUENTE_PERFILES

    # ───────────── Serialización ─────────────
    @classmethod
    def from_dict(cls, data: Optional[Dict[str, Any]]) -> "DTO_ponderacion_filtro_blando":
        """
        Admite un diccionario parcial: los campos que no se envían conservan
        su valor por defecto. Un campo desconocido lanza ValueError para
        detectar erratas en el request.
        """
        if not data:
            return cls()
        if not isinstance(data, dict):
            raise ValueError("'ponderaciones' debe ser un objeto {campo: peso}.")
        validos = set(cls.campos())
        desconocidos = set(data) - validos
        if desconocidos:
            raise ValueError(
                f"Campos de ponderación desconocidos: {sorted(desconocidos)}. "
                f"Campos válidos: {sorted(validos)}."
            )
        return cls(**{k: v for k, v in data.items() if v is not None})

    def to_dict(self) -> Dict[str, float]:
        return {f.name: getattr(self, f.name) for f in fields(self)}

    # ───────────── Utilidades para el servicio ─────────────
    def activas(self) -> Dict[str, float]:
        """Solo los campos con peso > 0."""
        return {k: v for k, v in self.to_dict().items() if v > 0}

    def normalizadas(self) -> Dict[str, float]:
        """Pesos de los campos activos normalizados para que sumen 1."""
        activas = self.activas()
        total = sum(activas.values())
        if total == 0:
            return {}
        return {k: v / total for k, v in activas.items()}

    def usa_fuente(self, fuente: str) -> bool:
        """True si algún campo de esa base tiene peso > 0 (para saber si hay que cargarla)."""
        return any(self.fuente(c) == fuente for c in self.activas())


_CAMPOS_FEEDBACK = {"interes_cambio", "puesto_objetivo", "distancia_rol"}
_CAMPOS_RELACIONES = {"compatibilidad_equipo"}
