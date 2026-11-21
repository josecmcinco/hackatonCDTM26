# Estado

## Fase actual
Desarrollo de Backend / Arquitectura.

## Objetivo inmediato
Conectar la API del backend con el frontend en React y preparar la vista de matching y equipos.

## Hecho
- Estructura base del repositorio creada.
- Instalado DuckDB para consultas directas sobre `CaseContext/profiles.parquet` (54 ms en 190.000 filas).
- Diseñados los DTOs de entrada: `DTO_request_candidato_ideal` y `DTO_request_obtener_candidatos`.
- Creada la arquitectura en capas: Controller (`candidatos_controller.py`), Service (`candidatos_service.py`) y Repository (`candidatos_repository.py`).
- Implementados y validados los endpoints `POST /api/candidatos/matching`, `POST /api/candidatos/equipo` y `GET /api/candidatos/<id>`.
- Creada la capa de herramientas (`backend/tools/`) con esquemas y despacho para Function Calling con Gemini.
- Implementado el flujo de entrada por voz: Audio $\rightarrow$ ElevenLabs Speech-to-Text $\rightarrow$ Gemini con Tools sobre DuckDB $\rightarrow$ Decisión final (`backend/controller/agente_controller.py`, `backend/service/agente_service.py`).

## En curso
- 

## Bloqueos y riesgos
- 

## Próximo punto de revisión
- 
