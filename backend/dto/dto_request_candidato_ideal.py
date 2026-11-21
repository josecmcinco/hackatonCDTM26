from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any


@dataclass
class RequisitoSkillDTO:
    """
    Elemento individual de habilidad técnica o competencia.
    Permite evaluar nivel (1-5), años de práctica y si es excluyente o deseable.
    """
    nombre: str
    nivel_minimo: int = 1         # Nivel de 1 a 5 (según la escala del dataset)
    anios_minimos: float = 0.0     # Años de experiencia en esa tecnología específica
    es_obligatoria: bool = True    # True = obligatoria | False = deseable ("not essential")

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "RequisitoSkillDTO":
        return cls(
            nombre=str(data.get("nombre", "")),
            nivel_minimo=int(data.get("nivel_minimo", 1)),
            anios_minimos=float(data.get("anios_minimos", 0.0)),
            es_obligatoria=bool(data.get("es_obligatoria", True))
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "nombre": self.nombre,
            "nivel_minimo": self.nivel_minimo,
            "anios_minimos": self.anios_minimos,
            "es_obligatoria": self.es_obligatoria
        }


@dataclass
class RequisitoIdiomaDTO:
    """Elemento individual de idioma y nivel mínimo exigido (ej. 'Inglés', 'B2')."""
    idioma: str
    nivel_minimo: str = "B2"

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "RequisitoIdiomaDTO":
        return cls(
            idioma=str(data.get("idioma", "")),
            nivel_minimo=str(data.get("nivel_minimo", "B2"))
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "idioma": self.idioma,
            "nivel_minimo": self.nivel_minimo
        }


@dataclass
class DTO_request_candidato_ideal:
    """
    DTO final con los parámetros para buscar el mejor matching de un candidato.
    
    Nota: 'seniority' ha sido eliminado porque en la base de datos es exactamente 
    equivalente a 'anios_experiencia' (tramos cerrados de años).
    """
    # 1. Rol buscado (opcional si se infiere del brief)
    rol: Optional[str] = None
    descripcion_necesidad: Optional[str] = None

    # 2. Experiencia (Filtro duro numérico: reemplaza 'seniority')
    anios_experiencia_minimos: int = 0

    # 3. Disponibilidad (Lista de estados válidos: 'En banca', 'Roll-off próximo (<3 meses)')
    disponibilidad: List[str] = field(default_factory=lambda: ["En banca", "Roll-off próximo (<3 meses)"])

    # 4. Sector principal o de cliente (ej. 'Banca y Finanzas', 'Retail y Consumo', 'Sector Público')
    sector: Optional[str] = None

    # 5. Lista de habilidades técnicas (Cada una con nivel, años y obligatoriedad)
    skills: List[RequisitoSkillDTO] = field(default_factory=list)

    # 6. Lista de idiomas requeridos
    idiomas: List[RequisitoIdiomaDTO] = field(default_factory=list)

    # 7. Otros requisitos complementarios opcionales
    modalidad_trabajo: Optional[str] = None  # Remoto, Híbrido, Presencial
    certificaciones: List[str] = field(default_factory=list)
    
    # 8. Número de candidatos deseados en el ranking
    top_k: int = 10

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DTO_request_candidato_ideal":
        skills_data = [
            RequisitoSkillDTO.from_dict(s) if isinstance(s, dict) else RequisitoSkillDTO(nombre=str(s))
            for s in data.get("skills", [])
        ]
        idiomas_data = [
            RequisitoIdiomaDTO.from_dict(i) if isinstance(i, dict) else RequisitoIdiomaDTO(idioma=str(i))
            for i in data.get("idiomas", [])
        ]
        
        disp = data.get("disponibilidad", ["En banca", "Roll-off próximo (<3 meses)"])
        if isinstance(disp, str):
            disp = [disp]

        # Manejo de experiencia si el llamante envía 'experience', 'anios_experiencia' o 'anios_experiencia_minimos'
        exp = data.get("anios_experiencia_minimos", data.get("anios_experiencia", data.get("experience", 0)))

        return cls(
            rol=data.get("rol"),
            descripcion_necesidad=data.get("descripcion_necesidad"),
            anios_experiencia_minimos=int(exp or 0),
            disponibilidad=disp,
            sector=data.get("sector"),
            skills=skills_data,
            idiomas=idiomas_data,
            modalidad_trabajo=data.get("modalidad_trabajo"),
            certificaciones=data.get("certificaciones", []),
            top_k=int(data.get("top_k", 10))
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rol": self.rol,
            "descripcion_necesidad": self.descripcion_necesidad,
            "anios_experiencia_minimos": self.anios_experiencia_minimos,
            "disponibilidad": self.disponibilidad,
            "sector": self.sector,
            "skills": [s.to_dict() for s in self.skills],
            "idiomas": [i.to_dict() for i in self.idiomas],
            "modalidad_trabajo": self.modalidad_trabajo,
            "certificaciones": self.certificaciones,
            "top_k": self.top_k
        }


# Alias de compatibilidad
CandidatoIdealEntryDTO = DTO_request_candidato_ideal
