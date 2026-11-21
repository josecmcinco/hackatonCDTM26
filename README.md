# NTT DATA · AI Talent Matcher 🚀
> **Hackathon CDTM 2026** · Plataforma inteligente de descubrimiento, asignación y predicción de equipos de alto rendimiento para proyectos tecnológicos sobre la base de talento de NTT DATA (+190.000 perfiles).

---

## 📌 Visión general del proyecto

En proyectos de consultoría estratégica y tecnológica, formar el equipo adecuado en tiempo récord es crítico. **AI Talent Matcher** permite a directores de proyecto, gerentes y recruiters describir la necesidad de un cliente (por texto o mediante dictado por voz) y obtener:

1. **Perfiles ideales inferidos:** Detección automática de roles, niveles de seniority, certificaciones imprescindibles, competencias técnicas y requisitos implícitos.
2. **Matching multicriterio en 3 dimensiones:**
   - 🔵 **Factor Técnico:** Alineación de área, rol, seniority, años de experiencia, sector principal, matriz de competencias y certificaciones. Incluye detección de **Talento Oculto** (*Hidden talent detected*).
   - 🟢 **Factor Logístico:** País, ciudad, disponibilidad estricta (*En banca*, *Roll-off próximo*), modalidad de trabajo e idiomas requeridos.
   - 🟣 **Factor Histórico y Humano:** Nivel de conformidad en su puesto actual (*Open to change* si <70%), sinergia comprobada en proyectos exitosos previos (*Partner matched*) y cálculo del **riesgo de salida** al mover a la persona de su proyecto actual.
3. **Predicción de Equipo de Alto Rendimiento:**
   - Cobertura equilibrada de los **9 roles de la metodología Belbin** (Acción, Sociales y Mentales).
   - **Porcentaje de éxito esperado del proyecto** integrando ajuste técnico, disponibilidad, sinergias y estabilidad.
4. **Experiencia de usuario explicable y minimalista:**
   - Carrusel visual superior de candidatos Top 1 con fotos y porcentaje de afinidad.
   - Tarjetas Top 1 minimalistas con desglose fino de factores bajo demanda (con códigos de color diferenciados).
   - Comparador horizontal de alternativas considerado vs. titular sin sobrecarga de información.
   - Soporte para **Modo Ciego** (anonimización para prevenir sesgos cognitivos).

---

## 📂 Estructura del repositorio

```text
hackatonCDTM26/
├── frontend/                  # Aplicación SPA cliente (React + TypeScript + Vite)
│   ├── src/
│   │   ├── api/               # Capa de comunicación con backend y mocks
│   │   ├── components/        # Componentes UI reutilizables (shadcn/ui, Magic UI)
│   │   │   ├── layout/        # Cabecera, AppShell y navegación
│   │   │   ├── shared/        # Avatares, MatchRing, StatusDot, SkillChips
│   │   │   └── ui/            # Primitivas Radix UI estilizadas con Tailwind
│   │   ├── features/
│   │   │   └── matcher/       # Flujo principal: Intake, Perfiles, Overview y Matches
│   │   │       ├── ProjectMatcherPage.tsx   # Página orquestadora del matching
│   │   │       ├── TeamOverviewSection.tsx  # Métricas Belbin, radares y KPIs
│   │   │       └── Top1ProfileCarousel.tsx  # Carrusel horizontal con fotos
│   │   ├── mock/              # Datos simulados y catálogo oficial de áreas
│   │   ├── providers/         # Estado global (AppContext: modo ciego, etc.)
│   │   └── types/             # Definiciones e interfaces TypeScript
│   └── package.json
│
├── backend/                   # API REST en Python (Flask)
│   ├── controller/            # Blueprints de endpoints (candidatos, proyectos, voz)
│   ├── dto/                   # Data Transfer Objects para requests y responses
│   ├── repository/            # Acceso y consultas analíticas DuckDB sobre parquet
│   ├── service/               # Lógica de scoring, recomendación y audio
│   ├── tools/                 # Utilidades de consulta y filtrado de candidatos
│   ├── app.py                 # Punto de entrada de la aplicación Flask
│   └── requirements.txt       # Dependencias Python
│
├── CaseContext/               # Datos del reto y documentación de contexto
│   ├── profiles.parquet       # Dataset real con los perfiles profesionales
│   └── *.pdf                  # Documentación y reglas del caso de estudio
│
├── dataAnalysis/              # Scripts de preprocesamiento, limpieza y EDA
│   └── Procesado/             # Scripts de limpieza de datos en Python
│
├── context/                   # Documentación viva de gestión del proyecto
│   ├── PROJECT.md             # Alcance, hipótesis y propuesta de valor
│   ├── DECISIONS.md           # Registro de decisiones de arquitectura
│   ├── STATUS.md              # Estado actual de los entregables
│   └── TASKS.md               # Backlog de tareas
│
└── README.md                  # Este documento
```

---

## 🛠️ Tecnologías utilizadas

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Radix UI, Sonner, Motion.
- **Backend:** Python 3.12+, Flask, Flask-CORS, DuckDB (consultas vectoriales/analíticas sobre Parquet), Google Generative AI (Gemini).
- **Procesamiento de Voz:** Web Speech API integrada y endpoints de transcripción.

---

## 🚀 Guía rápida de ejecución

### 1. Requisitos previos
- **Node.js** (v18 o superior) y **npm**.
- **Python** (v3.10 o superior) y entorno virtual activo.

### 2. Levantar el Backend (Flask)
```bash
# Desde la raíz del repositorio con el venv activado:
cd backend
python app.py
```
> El servidor API se iniciará en `http://127.0.0.1:5000` (comprobación de salud en `http://127.0.0.1:5000/api/health`).

### 3. Levantar el Frontend (Vite)
En otra terminal:
```bash
cd frontend
npm install   # Solo la primera vez
npm run dev
```
> La interfaz estará disponible en `http://localhost:5174/` (o `5173`).

---

## 🎯 Flujo de demostración recomendado

1. **Entrada de necesidad:** Escribe o dicta por voz una necesidad de proyecto (por ejemplo, *Migración Core Bancario a Cloud* o *Asistente IA para Retail*).
2. **Interpretación y Perfiles Ideales:** Revisa los roles extraídos automáticamente con sus filtros estrictos y requisitos técnicos.
3. **Buscar matches:** Haz clic en *"Buscar matches"* para consultar la base de datos de talento.
4. **Overview del equipo:**
   - Explora el **carrusel superior de tarjetas Top 1** con sus fotos y porcentajes de match.
   - Observa los **indicadores de rendimiento Belbin** y **éxito esperado** junto con los gráficos de araña.
5. **Matches detallados por puesto:**
   - Lee el **disclaimer de 1 línea** sobre por qué se escogió a cada titular Top 1.
   - Despliega la flecha para inspeccionar los **3 factores coloreados** (Técnico en azul, Logístico en verde e Histórico en morado).
   - Abre *"Ver otros candidatos considerados"* para ver la comparativa horizontal minimalista y promover a cualquier candidato a titular con un solo clic.
