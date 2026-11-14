"""Gestión de aprobaciones humanas para acciones que las requieran."""


def request_approval(action: str) -> bool:
    """Solicita aprobación según la interfaz que se acuerde para el equipo."""
    raise NotImplementedError("Define qué acciones requieren aprobación y cómo solicitarla.")
