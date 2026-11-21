from dataclasses import dataclass, fields
from typing import Dict, Any, Optional


@dataclass
class DTO_ponderacion_filtro_blando:
    """
    Ponderación (peso relativo) de cada campo del perfil de un profesional
    dentro del filtro blando (scoring / ranking).

    - Un campo por cada columna del dataset, salvo las de identificación y
      datos personales (employee_id, nombre, apellidos, nombre_completo, email)
      y las columnas redundantes (skills_texto se deriva de skills,
      fecha_incorporacion equivale a anios_en_ntt).
    - Los nombres coinciden con las columnas del parquet para poder iterar
      sobre ellos directamente en el servicio.
    - Los pesos son números >= 0 en cualquier escala: se normalizan con
      `normalizadas()` para que sumen 1. Un peso 0 desactiva ese campo
      en el filtro blando.
    - Los valores por defecto reproducen el scoring actual de
      CandidatosService (skills 50, experiencia 20, sector 15, idiomas 15).
    """
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

    def __post_init__(self):
        for f in fields(self):
            valor = getattr(self, f.name)
            try:
                valor = float(valor)
            except (TypeError, ValueError):
                raise ValueError(f"La ponderación de '{f.name}' debe ser numérica (recibido: {valor!r}).")
            if valor < 0:
                raise ValueError(f"La ponderación de '{f.name}' no puede ser negativa (recibido: {valor}).")
            setattr(self, f.name, valor)

    @classmethod
    def campos(cls) -> list:
        """Lista de campos ponderables (nombres de columna del dataset)."""
        return [f.name for f in fields(cls)]

    @classmethod
    def from_dict(cls, data: Optional[Dict[str, Any]]) -> "DTO_ponderacion_filtro_blando":
        """
        Admite un diccionario parcial: los campos que no se envían conservan
        su valor por defecto. Un campo desconocido lanza ValueError para
        detectar erratas en el request.
        """
        if not data:
            return cls()
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
