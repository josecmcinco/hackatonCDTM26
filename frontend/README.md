# Talent Intelligence by NTT DATA 🌐

Aplicación web integral para la gestión estratégica de talento y staffing de proyectos en **NTT DATA**, diseñada con principios de **IA explicable** y estricto cumplimiento del **Reglamento Europeo de Inteligencia Artificial (EU AI Act)**.

La plataforma permite a gestores de staffing y recruiters conectar perfiles de empleados o candidatos con oportunidades y proyectos corporativos mediante afinidad técnica transparente, supervisión humana continua (*Human-in-the-loop*) y detección de talento oculto mediante rutas adyacentes de habilidades.

---

## 🚀 Puesta en Marcha

### Requisitos previos
- Node.js v18.0.0 o superior (recomendado v20+ / v22+)
- npm v9+

### Instalación y Ejecución

```bash
# 1. Navegar a la carpeta frontend
cd frontend

# 2. Instalar dependencias (ya configuradas en package.json)
npm install

# 3. Iniciar el servidor de desarrollo en Vite (puerto 5173)
npm run dev

# 4. Compilar para producción (TypeScript + Vite)
npm run build

# 5. Ejecutar linter con cero errores
npm run lint
```

La aplicación se abrirá en: `http://localhost:5173`

---

## 🧭 Mapa de Rutas y Pantallas

| Ruta | Pantalla | Descripción |
|---|---|---|
| `/` | **Centro de mando (Home)** | Saludo contextual, tarjeta héroe de oportunidad urgente con sugerencias y MatchRing, 3 KPIs con Number Ticker y sparklines, gráfico divergente demanda vs disponibilidad y tabla filtrable. |
| `/oportunidades` | **Oportunidades** | Catálogo completo con buscador, selector multi-filtro escalable a 25+ sectores, 3 vistas guardadas (Todas, Urgentes, Asignadas), ordenación y exportación client-side a CSV. |
| `/oportunidades/:id` | **Resultados de Matching** | Tarjeta izquierda plegable con resumen de la vacante, 3 tarjetas de perfiles sugeridos con afinidad explicable y etiqueta de *Talento oculto*. Al hacer clic se despliega el Sheet con gráfico radar, desglose de factores, evidencias de proyectos y botones de Aprobación/Descarte. |
| `/skills` | **Mapa de Habilidades** | 3 visualizaciones exclusivas por pestaña: Mapa de calor de brechas por unidad (Nivo Heatmap), Flujos de transición del banquillo a proyectos (Nivo Sankey), y Grafo interactivo de habilidades adyacentes (@xyflow/react) con selector de perfil. |
| `/comparar` | **Comparativa de Terna** | Comparador simultáneo de 2 a 3 perfiles para una oportunidad: radar superpuesto multidimensional, matriz de verificación de skills (puntos de cumplimiento), y tarjeta destacada de Recomendación con botón de aprobación. |
| `/guardarrailes` | **Gobernanza y AI Act** | Estado del Human-in-the-loop, interruptor de Modo Ciego en vivo, tabla de registro de auditoría inmutable de decisiones, gráfico de paridad estadística sin sesgo y declaración de conformidad AI Act (alto riesgo, sin biometría emocional). |
| *Overlay* | **Copilot de Staffing** | Sheet lateral conversacional accesible desde el botón flotante y `⌘K`, con chips de prompts sugeridos, respuestas con tarjetas de oportunidad integradas, transcripción en directo y simulación de síntesis de voz. |

---

## 📂 Estructura de Carpetas (`frontend/src/`)

```plaintext
src/
├── api/
│   ├── index.ts                # Fachada única y tipada de la API (promesas con latencia 300-800ms)
│   └── voice.ts                # VoiceAdapter simulado con estados (idle, listening, processing, speaking)
│
├── mock/
│   ├── data.ts                 # Datos deterministas para "Staffing Interno" (oportunidades, perfiles, auditoría, KPIs)
│   └── recruitment.ts          # Datos para la modalidad de "Selección" (candidatos externos y vacantes)
│
├── types/
│   └── index.ts                # Definiciones TypeScript de todos los modelos del dominio
│
├── providers/
│   └── AppContext.tsx          # Estado global: modo Staffing/Selección, Modo Ciego, atajos ⌘K y Copilot
│
├── lib/
│   └── utils.ts                # Utilidades de combinación de clases CSS (clsx + tailwind-merge)
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx        # Contenedor principal con Sidebar, Topbar, max-width 1200px y atajo ⌘K
│   │   ├── Sidebar.tsx         # Navegación lateral (5 enlaces, wordmark NTT DATA y toggle Staffing/Selección)
│   │   └── Topbar.tsx          # Buscador ⌘K, toggle de modo oscuro (next-themes) y menú de usuario con Modo Ciego
│   │
│   ├── shared/
│   │   ├── MatchRing.tsx       # Anillo circular animado con porcentaje de afinidad (Magic UI)
│   │   ├── SkillChips.tsx      # Chips de competencias con límite de 2 visibles y popover "+N"
│   │   ├── StatusDot.tsx       # Puntos de estado coloreados con etiqueta (sin píldoras invasivas)
│   │   ├── PersonAvatar.tsx    # Avatar con soporte nativo para anonimización (Modo Ciego)
│   │   ├── TakeawayChart.tsx   # Gráfico de barras divergente con conclusión directa en el título
│   │   ├── FilterPopover.tsx   # Filtro multi-select con buscador preparado para más de 30 categorías
│   │   ├── EmptyState.tsx      # Vista tranquila para listas vacías
│   │   ├── ErrorState.tsx      # Vista de recuperación ante fallos de carga
│   │   └── PageHeader.tsx      # Títulos principales tipográficos y acciones
│   │
│   └── ui/                     # Primitivas shadcn/ui y componentes Magic UI accesibles
│       ├── animated-circular-progress-bar.tsx
│       ├── number-ticker.tsx
│       ├── blur-fade.tsx
│       ├── border-beam.tsx
│       ├── shimmer-button.tsx
│       ├── button.tsx, card.tsx, dialog.tsx, sheet.tsx, popover.tsx, ...
│
└── features/
    ├── home/                   # Pantalla de inicio y KPIs
    ├── opportunities/          # Tabla TanStack Table y ficha de oportunidad
    ├── match/                  # Pantalla de resultados de matching y ficha explicable
    ├── skills/                 # Heatmap Nivo, Sankey Nivo y Grafo React Flow
    ├── compare/                # Comparador de perfiles y radar superpuesto
    ├── guardrails/             # Auditoría, imparcialidad y AI Act
    └── copilot/                # Chatbot conversacional asistido por voz simulada
```

---

## 🎨 Tokens de Diseño y Filosofía Visual

Siguiendo las referencias de diseño de **Apple** y **Cosmos.so**:
- **Superficies y contraste:** Fondo neutro suave (`#FAFAFA` en modo claro, `#0B0B0D` en modo oscuro), tarjetas elevadas con sombra suave única y radios de `16px` para tarjetas y `10px` para controles.
- **Color restringido:** El azul corporativo NTT DATA (`#0072BC` en claro / `#3AA0E8` en oscuro) se reserva estrictamente para el botón primario principal, los estados activos y la serie de datos destacada.
- **Tipografía y jerarquía:** Tamaños tipográficos restringidos (12px, 14px, 20px, 40px) con soporte de números tabulares (`tabular-nums`) para métricas y gráficos.
- **Modo Ciego:** Oculta fotos y nombres en toda la interfaz reemplazándolos por iniciales anónimas para evaluaciones desprovistas de sesgos cognitivos o demográficos.

---

## 🧪 Pruebas de Resiliencia (Query Params)

La capa de API (`src/api/index.ts`) incluye un conmutador de desarrollo para validar los estados de la interfaz sin alterar el código:

- `http://localhost:5173/?state=loading` → Muestra los esqueletos de carga animados (*Skeletons*).
- `http://localhost:5173/?state=error` → Simula un error de red y muestra los estados de recuperación (*ErrorState* con reintento).
- `http://localhost:5173/?state=empty` → Simula colecciones vacías (*EmptyState*).

---

## 🔮 Lista de Tareas para Integración Futura (TODOs)

### 1. Reemplazo del Mock por Backend Real (`src/api/index.ts`)
- [ ] Cambiar la clase `MockStore` por llamadas HTTP / Fetch hacia endpoints REST o GraphQL:
  - `GET /api/v1/opportunities`
  - `GET /api/v1/profiles`
  - `POST /api/v1/opportunities/:id/match`
  - `POST /api/v1/matches/approve`
  - `POST /api/v1/matches/reject`
- [ ] Conectar la mutación de estado con la base de datos relacional o grafo de competencias corporativo.
- [ ] Implementar autenticación SSO corporativa (SAML / OAuth2 con Azure AD o Okta).

### 2. Integración de ElevenLabs Conversational Voice API (`src/api/voice.ts`)
- [ ] En `src/api/voice.ts`, sustituir la clase `MockVoiceAdapter` por el cliente WebSockets oficial de ElevenLabs:
  ```typescript
  // Conexión con ElevenLabs Conversational Agent:
  import { Conversation } from '@11labs/client';
  const conversation = await Conversation.startSession({
    agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID,
    onMessage: ({ message }) => onTranscriptUpdate(message),
  });
  ```
- [ ] En `speak()`, conectar con el endpoint Text-to-Speech `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream`.
- [ ] Configurar variables de entorno seguras `VITE_ELEVENLABS_API_KEY` y `VITE_ELEVENLABS_AGENT_ID` en el servidor intermedio para evitar exponer tokens en el navegador.
