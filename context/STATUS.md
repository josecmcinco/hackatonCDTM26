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
- Implementado el módulo de transcripción asíncrona de voz (`transcripcion_controller.py` y `transcripcion_service.py`) con soporte para streaming de fragmentos mientras el usuario habla y cierre final.
- Conectados el filtro duro (`dataAnalysis/FiltroDuro/filtro_duro.py`) y el filtro blando (`dataAnalysis/FiltroBlando/filtro_blando.py`) a `CandidatosService`: `POST /api/candidatos/equipo` y `/matching` aplican las `ponderaciones` del request y devuelven `desglose_score` por candidato. `DTO_ponderacion_filtro_blando` incluye feedback y relaciones; sus valores por defecto son los de `ponderaciones.json`.
- Frontend (`ProjectMatcherPage`) conectado a `POST /api/projects/infer-profiles` y `POST /api/projects/search-matches`. `SearchMatchesService` relaja el filtro duro por pasos (menos skills obligatorias → sin certificaciones/modalidad) cuando un rol tiene < 3 candidatos; el paso aplicado se devuelve en `roleMatches[].filtersRelaxed`.

## En curso
- Prueba end-to-end del flujo Analizar roles → Buscar personas en el navegador.

## Bloqueos y riesgos
- `backend/venv` está incompleto (solo `Activate.ps1`); de momento el backend se ejecuta con el Python del sistema.
- `comparisonVsTop1` y `conformidadActual` siguen siendo valores aleatorios en `search_matches_service.py`.

## Próximo punto de revisión
- 
