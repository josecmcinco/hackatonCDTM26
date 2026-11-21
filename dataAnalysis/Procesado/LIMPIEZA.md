# profiles_procesado.parquet: limpieza de los datos

Origen: `CaseContext/profiles.parquet` (190.000 perfiles). Se regenera con:

```bash
cd dataAnalysis/Procesado
python limpieza.py ../../CaseContext/profiles.parquet profiles_procesado.parquet
```

Las reglas están en `diccionarios.py`.

## Qué se mantiene

- Las 28 columnas originales conservan nombre y formato, así que el backend actual (`candidatos_repository.py`) funciona apuntando al nuevo fichero.
- **Los filtros duros no se tocan**: `anios_experiencia` y `disponibilidad` conservan sus valores originales.
- Cada valor que se cambia guarda su original (`skill_original`, `nombre_original`, `variante`…), así que no se pierde información.

## Qué se ha limpiado

| Elemento | Problema encontrado | Tratamiento |
|---|---|---|
| Skills | El mismo concepto aparece con distinta jerga según el departamento: "Backup y DR" (sysadmin) frente a "Backup y recuperación" (DBA); "Incident Management" (SRE) frente a "Gestión de incidencias" (service desk); "Control de costes", "Controlling de costes" y "Gestión de costes"; también pares ES/EN como "GDPR" y "RGPD" o "Marca empleadora" y "Employer branding" | Se unifican en un nombre canónico: 80.204 skills renombradas y 1.616 duplicados fusionados (se queda el mayor nivel y años) |
| Skills ambiguas | "Networking" (lo usa Sales Executive, no es de redes), "DORA" (reglamento UE, no métricas DevOps), "Tuning", "Flow", "Gobierno"… | Se desambiguan según el rol que las usa: "Networking comercial", "DORA (Reglamento UE)", "Tuning de BBDD", "Salesforce Flow"… |
| Skills compuestas | "SAP FI/CO" y "Cloud (AWS/Azure)" | Se expanden en sus skills individuales (SAP FI + SAP CO; AWS + Azure) |
| Tecnologías en experiencia y proyectos | Mismo vocabulario que las skills | Se aplica la misma normalización |
| Idiomas | 3.728 registros de "Valenciano" frente a "Catalán", y perfiles con el mismo idioma repetido con dos niveles | Se unifican en Catalán (con `variante = 'Valenciano'`); los duplicados se quedan con el nivel más alto |
| Certificaciones | Microsoft solo con código ("DP-203") o solo con nombre ("Azure Developer Associate"); 189 duplicados | Formato "código + nombre" (ej. "Microsoft AZ-204 Azure Developer Associate") y duplicados eliminados |
| Proyectos | 1.044 nombres con la palabra repetida ("plataforma de plataforma de contenidos") | Corregidos. Además el nombre se divide en `tipo_proyecto` y `dominio_funcional` |
| Empresas | Everis es la antigua marca de NTT DATA; Minsait y Tecnocom son de Indra; Altran es de Capgemini | Se añaden `grupo_empresa`, `es_grupo_ntt`, `tipo_empresa` y `sector_empresa` |
| Puestos (experiencia y proyectos) | Seniority mezclada en el texto ("Senior Data Engineer") | Se separan `rol_base` y `seniority` |
| Instituciones | Los centros de FP llevan la ciudad entre paréntesis | Se separan `institucion_nombre` e `institucion_ciudad` |
| Texto | 56 nombres con espacios dobles o finales | Se recortan y se normalizan a Unicode NFC |

## Columnas nuevas más útiles para el matching

- `sectores_experiencia` y `experiencia_sectorial`: sector principal, sectores de los proyectos y sectores de las empresas anteriores. Sirven para detectar requisitos implícitos, por ejemplo experiencia en banca aunque no sea el sector principal.
- `skills_texto_ampliado` y `texto_busqueda`: incluyen alias ES/EN ("orquestación de contenedores" encuentra Kubernetes). `texto_busqueda` está en minúsculas y sin acentos.
- `skills[].evidencias` y `skills_con_evidencia`: en cuántos proyectos o empleos se usó cada skill, como evidencia para explicar las recomendaciones.
- `skills[].area_skill`: área dominante de cada skill.
- `rol_es` y `rol_alias`: nombre del rol en español y sinónimos ES/EN.
- `disponible_inmediato`, `disponible_3_meses`, `disponibilidad_codigo` y `seniority_nivel` (0 = Trainee … 5 = Principal).
- `idiomas[].nivel_num` (A1 = 1 … C2 = 6, Nativo = 7) y `nivel_ingles_num`.
- `anios_experiencia_real`: años calculados a partir de la trayectoria. Es solo informativo; para el filtro duro hay que seguir usando `anios_experiencia`.
- `calidad_flags`: lista de las correcciones aplicadas a cada perfil.

## Notas

- En unos 27.000 perfiles `anios_en_ntt` supera a `anios_experiencia`, siempre por menos de 1 año. Se debe a que `anios_experiencia` es un número entero redondeado hacia abajo. Se marca en `calidad_flags`, pero no se corrige.
- Algunos dominios de proyecto pertenecen a un sector distinto del cliente; por ejemplo, historia clínica para clientes del sector público. No es un error: se recoge en `proyectos[].sector_dominio`.
