from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from .dto_request_candidato_ideal import DTO_request_candidato_ideal
from .dto_ponderacion_filtro_blando import DTO_ponderacion_filtro_blando


@dataclass
class DTO_request_obtener_candidatos:
    """
    DTO de entrada (Request) para solicitar candidatos para múltiples perfiles/roles a la vez.
    Permite solicitar un equipo o conjunto de necesidades donde cada elemento es un candidato ideal
    (DTO_request_candidato_ideal), gestionando restricciones globales como evitar duplicados entre roles.

    `ponderaciones` define el peso de cada campo del perfil en el filtro blando
    (ver DTO_ponderacion_filtro_blando). Se aplica a todos los roles del request.

    `equipo_actual` (opcional) son los employee_id ya elegidos para el proyecto:
    no compiten por los roles y `compatibilidad_equipo` mide la relación de cada
    candidato con ellos (y con los que se van asignando rol a rol).
    """
    candidatos_ideales: List[DTO_request_candidato_ideal] = field(default_factory=list)
    nombre_proyecto: Optional[str] = None
    descripcion_global: Optional[str] = None
    evitar_duplicados_entre_roles: bool = True
    ponderaciones: DTO_ponderacion_filtro_blando = field(default_factory=DTO_ponderacion_filtro_blando)
    equipo_actual: List[str] = field(default_factory=list)

    def __post_init__(self):
        if isinstance(self.ponderaciones, dict) or self.ponderaciones is None:
            self.ponderaciones = DTO_ponderacion_filtro_blando.from_dict(self.ponderaciones)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DTO_request_obtener_candidatos":
        # Acepta lista bajo 'candidatos_ideales' o 'roles' o 'perfiles'
        raw_list = data.get("candidatos_ideales") or data.get("roles") or data.get("perfiles") or []
        
        candidatos = [
            DTO_request_candidato_ideal.from_dict(c) if isinstance(c, dict) else c
            for c in raw_list
        ]

        # Acepta 'ponderaciones' o 'pesos'; los campos no enviados usan el valor por defecto
        raw_pond = data.get("ponderaciones", data.get("pesos"))

        return cls(
            candidatos_ideales=candidatos,
            nombre_proyecto=data.get("nombre_proyecto"),
            descripcion_global=data.get("descripcion_global"),
            evitar_duplicados_entre_roles=bool(data.get("evitar_duplicados_entre_roles", True)),
            ponderaciones=DTO_ponderacion_filtro_blando.from_dict(raw_pond),
            equipo_actual=[str(e) for e in (data.get("equipo_actual") or [])]
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "nombre_proyecto": self.nombre_proyecto,
            "descripcion_global": self.descripcion_global,
            "evitar_duplicados_entre_roles": self.evitar_duplicados_entre_roles,
            "ponderaciones": self.ponderaciones.to_dict(),
            "equipo_actual": self.equipo_actual,
            "candidatos_ideales": [c.to_dict() for c in self.candidatos_ideales]
        }
