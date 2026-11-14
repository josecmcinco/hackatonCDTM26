# HACKATHON-OS

Base de trabajo para descubrir, diseñar, construir y presentar un proyecto de hackathon. La estructura separa las instrucciones para agentes, la orquestación, el contexto compartido y la aplicación.

## Flujo recomendado

1. Ejecuta `hackathon-init` para definir el reto, el equipo y las restricciones.
2. Usa `product-discovery` para concretar usuarios, problema y propuesta de valor.
3. Usa `architecture` para acordar el alcance técnico y los contratos principales.
4. Construye en `app/` siguiendo `development`; registra decisiones y progreso en `context/`.
5. Pasa `code-review` antes de integrar cambios.
6. Prepara la demostración y el pitch con `pitch-generator`.

Las guías de `.agents/skills/` son independientes del proveedor. `adapters/` contiene puntos de extensión para herramientas concretas; las integraciones reales se añaden cuando el equipo elija sus herramientas.

## Estructura

- `AGENTS.md`: instrucciones compartidas para personas y agentes que trabajen en el repositorio.
- `.agents/skills/`: guías para las etapas del hackathon.
- `adapters/`: espacio para configurar asistentes y herramientas externas.
- `orchestration/`: módulos iniciales para coordinar tareas y contexto.
- `context/`: fuente compartida de verdad para el proyecto, decisiones, estado y tareas.
- `app/`: código del producto. El stack se elige durante la inicialización.

## Empezar

Completa `context/PROJECT.md` y `context/TASKS.md` con el equipo. Mantén `context/STATUS.md` al día al cerrar cada bloque de trabajo y registra en `context/DECISIONS.md` las decisiones que afecten al alcance o la arquitectura.
