from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from .dto_request_candidato_ideal import DTO_request_candidato_ideal


@dataclass
class DTO_request_obtener_candidatos:
    """
    DTO de entrada (Request) para solicitar candidatos para múltiples perfiles/roles a la vez.
    Permite solicitar un equipo o conjunto de necesidades donde cada elemento es un candidato ideal
    (DTO_request_candidato_ideal), gestionando restricciones globales como evitar duplicados entre roles.
    """
    candidatos_ideales: List[DTO_request_candidato_ideal] = field(default_factory=list)
    nombre_proyecto: Optional[str] = None
    descripcion_global: Optional[str] = None
    evitar_duplicados_entre_roles: bool = True

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DTO_request_obtener_candidatos":
        # Acepta lista bajo 'candidatos_ideales' o 'roles' o 'perfiles'
        raw_list = data.get("candidatos_ideales") or data.get("roles") or data.get("perfiles") or []
        
        candidatos = [
            DTO_request_candidato_ideal.from_dict(c) if isinstance(c, dict) else c
            for c in raw_list
        ]

        return cls(
            candidatos_ideales=candidatos,
            nombre_proyecto=data.get("nombre_proyecto"),
            descripcion_global=data.get("descripcion_global"),
            evitar_duplicados_entre_roles=bool(data.get("evitar_duplicados_entre_roles", True))
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "nombre_proyecto": self.nombre_proyecto,
            "descripcion_global": self.descripcion_global,
            "evitar_duplicados_entre_roles": self.evitar_duplicados_entre_roles,
            "candidatos_ideales": [c.to_dict() for c in self.candidatos_ideales]
        }
