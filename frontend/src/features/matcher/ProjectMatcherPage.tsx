import { useState } from "react";
import {
  ImportanceLevel,
  ProjectSearchResponse,
  IdealProfile,
  CandidateMatch,
} from "@/types";
import { api } from "@/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { BorderBeam } from "@/components/ui/border-beam";
import { BlurFade } from "@/components/ui/blur-fade";
import { MatchRing } from "@/components/shared/MatchRing";
import { PersonAvatar, PersonName } from "@/components/shared/PersonAvatar";
import { SkillChips } from "@/components/shared/SkillChips";
import { StatusDot } from "@/components/shared/StatusDot";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  Search,
  Sparkles,
  Layers,
  Award,
  Building2,
  Code2,
  ShieldCheck,
  MapPin,
  Users,
  RefreshCw,
  AlertTriangle,
  Briefcase,
  Clock,
  Flame,
  ChevronDown,
  Globe,
  Languages,
  History,
} from "lucide-react";

const SAMPLE_BRIEFS = [
  {
    label: "Migración Core Bancario a Cloud",
    importance: "critical" as ImportanceLevel,
    text: "Necesitamos migrar el core bancario hacia microservicios en AWS. Buscamos un Arquitecto Cloud Lead con experiencia en banca, un especialista en modernización COBOL/CICS a Java y un ingeniero DevSecOps.",
  },
  {
    label: "Asistente IA para Retail",
    importance: "high" as ImportanceLevel,
    text: "Proyecto de asistente conversacional con GenAI para cliente retail. Requerimos un Arquitecto GenAI con Python y Azure OpenAI (imprescindible) y un desarrollador Frontend React/TypeScript.",
  },
];

const IMPORTANCE_CONFIG: Record<
  ImportanceLevel,
  { label: string; colorClass: string }
> = {
  critical: { label: "Crítica", colorClass: "text-danger bg-danger/10" },
  high: { label: "Alta", colorClass: "text-warning bg-warning/10" },
  medium: { label: "Media", colorClass: "text-brand bg-brand/10" },
  low: {
    label: "Baja",
    colorClass: "text-muted-foreground bg-neutral-100 dark:bg-neutral-800",
  },
};

function ImportanceIndicator({ level }: { level: ImportanceLevel }) {
  const cfg = IMPORTANCE_CONFIG[level];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.colorClass}`}
    >
      <Flame className="h-3 w-3" />
      <span>{cfg.label}</span>
    </span>
  );
}

/**
 * Pequeño indicador que muestra qué tanto mejor/peor (%) es una dimensión
 * respecto al candidato elegido como Top 1.
 */
function DiffPctPill({ value }: { value?: number }) {
  if (value === undefined) return null;
  const formatted = value > 0 ? `+${value}%` : `${value}%`;
  const colorClass =
    value > 0
      ? "text-success bg-success/10"
      : value < 0
      ? "text-danger bg-danger/10"
      : "text-muted-foreground bg-neutral-100 dark:bg-neutral-800";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ml-1.5 ${colorClass}`}
        >
          {formatted}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {value > 0
          ? `${value}% superior respecto al Top 1 en esta dimensión`
          : value < 0
          ? `${Math.abs(value)}% inferior respecto al Top 1 en esta dimensión`
          : "Mismo nivel que el Top 1 en esta dimensión"}
      </TooltipContent>
    </Tooltip>
  );
}

function CandidateMatchCard({
  cand,
  rankLabel,
  isAlternative = false,
}: {
  cand: CandidateMatch;
  rankLabel?: string;
  isAlternative?: boolean;
}) {
  const diff = isAlternative ? cand.comparisonVsTop1 : undefined;

  return (
    <Card
      className={`p-6 border-border shadow-soft space-y-5 ${
        isAlternative ? "bg-background/80" : "bg-surface"
      }`}
    >
      {/* Cabecera: Persona + Ranking + MatchRing */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <PersonAvatar
            name={cand.nombre_completo}
            initials={cand.initials}
            size="lg"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {rankLabel && (
                <Badge
                  variant={isAlternative ? "outline" : "default"}
                  className="text-xs font-semibold tabular-nums"
                >
                  {rankLabel}
                </Badge>
              )}

              <PersonName
                name={cand.nombre_completo}
                id={cand.employee_id}
                className="text-[20px] font-semibold text-foreground"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {cand.puesto_actual} · {cand.employee_id}
            </p>
            <p className="text-xs text-foreground/90 pt-0.5">{cand.matchReason}</p>
            {cand.riskFlag && (
              <p className="inline-flex items-center gap-1 text-xs text-warning">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>Riesgo: {cand.riskFlag}</span>
              </p>
            )}
          </div>
        </div>

        {/* Afinidad Global */}
        <div className="flex items-center self-end md:self-start shrink-0">
          <MatchRing score={cand.matchScore} size={58} strokeWidth={4.5} />
          <DiffPctPill value={diff?.overallScorePct} />
        </div>
      </div>

      {/* 3 DIMENSIONES AGRUPADAS: 1. Factor Técnico, 2. Factor Logístico, 3. Factor Histórico */}
      <div className="space-y-4 pt-2 border-t border-border/60">
        {/* 1. FACTOR TÉCNICO */}
        <div className="rounded-[12px] border border-border/60 bg-neutral-50/50 dark:bg-neutral-900/30 p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-brand" />
              <span>1. Factor Técnico</span>
            </span>

            {/* Badge en Factor Técnico cuando es talento oculto */}
            {cand.isHiddenTalent && (
              <Badge variant="default" className="gap-1 text-xs">
                <Sparkles className="h-3 w-3" />
                <span>Hidden talent detected</span>
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <Layers className="h-3 w-3" /> Área
              </span>
              <p className="font-medium text-foreground">{cand.area}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> Rol
              </span>
              <p className="font-medium text-foreground">{cand.rol}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <Award className="h-3 w-3" /> Seniority y Exp.
              </span>
              <p className="font-medium text-foreground tabular-nums flex items-center flex-wrap">
                <span>
                  {cand.nivel_seniority} · {cand.anios_experiencia}a
                </span>
                <DiffPctPill value={diff?.experiencePct} />
                <DiffPctPill value={diff?.seniorityPct} />
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" /> Sector principal
              </span>
              <p className="font-medium text-foreground">{cand.sector_principal}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Certificaciones
              </span>
              <p className="font-medium text-foreground flex items-center flex-wrap">
                <span className="truncate max-w-[140px]">
                  {cand.certificaciones.length > 0
                    ? cand.certificaciones.map((c) => `${c.nombre} (${c.anio})`).join(", ")
                    : "Sin certificaciones"}
                </span>
                <DiffPctPill value={diff?.certificationsPct} />
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
            <span className="text-muted-foreground font-medium flex items-center">
              Skills:
              <DiffPctPill value={diff?.skillsPct} />
            </span>
            {cand.skills.map((s) => (
              <Badge
                key={s.skill}
                variant="secondary"
                className="font-normal text-xs bg-surface border-border tabular-nums"
              >
                {s.skill} · N{s.nivel} ({s.anios}a)
              </Badge>
            ))}
          </div>
        </div>

        {/* 2. FACTOR LOGÍSTICO + 3. FACTOR HISTÓRICO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 2. FACTOR LOGÍSTICO */}
          <div className="rounded-[12px] border border-border/60 bg-neutral-50/50 dark:bg-neutral-900/30 p-4 space-y-3">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-brand" />
              <span>2. Factor Logístico</span>
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" /> País
                </span>
                <p className="font-medium text-foreground">{cand.pais}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-muted-foreground">Disponibilidad</span>
                <div>
                  <StatusDot
                    status={
                      cand.disponibilidad === "En banca"
                        ? "approved"
                        : cand.disponibilidad === "Asignado"
                        ? "rejected"
                        : "matching"
                    }
                    label={cand.disponibilidad}
                  />
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-muted-foreground">Modalidad</span>
                <p className="font-medium text-foreground">{cand.modalidad_trabajo}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Languages className="h-3 w-3" /> Idiomas
                </span>
                <p className="font-medium text-foreground">
                  {cand.idiomas.map((i) => `${i.idioma} (${i.nivel})`).join(", ")}
                </p>
              </div>
            </div>
          </div>

          {/* 3. FACTOR HISTÓRICO */}
          <div className="rounded-[12px] border border-border/60 bg-neutral-50/50 dark:bg-neutral-900/30 p-4 space-y-3">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-brand" />
              <span>3. Factor Histórico</span>
            </span>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Conformidad puesto actual</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums text-foreground">
                    {cand.conformidadActual}%
                  </span>
                  {cand.conformidadActual < 70 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="warning" className="gap-1 text-xs">
                          <RefreshCw className="h-3 w-3" />
                          <span>Open to change</span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        Conformidad &lt; 70% en encuestas internas: abierto a cambiar de proyecto
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/40">
                <span className="text-muted-foreground">Sinergia con equipo</span>
                {cand.matchPartners.length > 0 ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="success" className="gap-1 text-xs">
                        <Users className="h-3 w-3" />
                        <span>Partner matched</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      Compañero en proyectos exitosos previos con: {cand.matchPartners.join(", ")}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <span className="text-muted-foreground">Sin coincidencia previa</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ProjectMatcherPage() {
  const [projectImportance, setProjectImportance] =
    useState<ImportanceLevel>("critical");
  const [description, setDescription] = useState<string>(SAMPLE_BRIEFS[0].text);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProjectSearchResponse | null>(null);

  const handleSearchMatches = async () => {
    if (!description.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.searchMatches({
        description,
        projectImportance,
      });
      setResult(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al buscar coincidencias."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-12 pb-16">
        {/* 1. SECCIÓN: CREAR PROYECTO */}
        <BlurFade delay={0.05}>
          <section aria-labelledby="crear-proyecto-heading" className="space-y-6">
            <div className="space-y-1">
              <h1
                id="crear-proyecto-heading"
                className="text-[28px] md:text-[40px] font-semibold tracking-tight text-foreground leading-tight"
              >
                Crear proyecto y buscar talento
              </h1>
              <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
                Describe el proyecto o los perfiles que necesitas. La IA extraerá los perfiles ideales, inferirá su importancia y encontrará el mejor equipo dentro de NTT DATA.
              </p>
            </div>

            <Card className="relative overflow-hidden p-6 md:p-8 border-border bg-surface shadow-soft space-y-6">
              {loading && (
                <BorderBeam size={180} duration={8} colorFrom="var(--brand)" />
              )}

              {/* Controles superiores: Importancia del proyecto + Ejemplos rápidos */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="project-importance"
                    className="text-xs font-semibold text-muted-foreground whitespace-nowrap"
                  >
                    Importancia del proyecto
                  </label>
                  <Select
                    value={projectImportance}
                    onValueChange={(v) =>
                      setProjectImportance(v as ImportanceLevel)
                    }
                  >
                    <SelectTrigger
                      id="project-importance"
                      className="w-40 h-9 text-xs"
                    >
                      <SelectValue placeholder="Importancia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Crítica</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="low">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Ejemplos:</span>
                  {SAMPLE_BRIEFS.map((b) => (
                    <button
                      key={b.label}
                      type="button"
                      onClick={() => {
                        setDescription(b.text);
                        setProjectImportance(b.importance);
                      }}
                      className="text-xs rounded-full border border-border bg-neutral-100/70 dark:bg-neutral-800/70 px-3 py-1 text-muted-foreground hover:text-foreground hover:border-brand/40 transition-colors"
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input de texto del proyecto / perfiles buscados */}
              <div className="space-y-2">
                <label htmlFor="project-description" className="sr-only">
                  Descripción del proyecto y perfiles buscados
                </label>
                <textarea
                  id="project-description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe el proyecto, sector del cliente, tecnologías imprescindibles, disponibilidad y roles necesarios..."
                  className="w-full rounded-[12px] border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand resize-y leading-relaxed"
                />
              </div>

              {/* Botón único primario: search matches */}
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  size="lg"
                  onClick={handleSearchMatches}
                  disabled={loading || !description.trim()}
                  className="gap-2 font-semibold shadow-soft"
                >
                  <Search className="h-4 w-4" />
                  <span>{loading ? "Buscando perfiles..." : "search matches"}</span>
                </Button>
              </div>
            </Card>

            {/* Estado de carga */}
            {loading && (
              <div className="space-y-4">
                <Skeleton className="h-56 w-full rounded-[16px]" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Skeleton className="h-48 rounded-[16px]" />
                  <Skeleton className="h-48 rounded-[16px]" />
                </div>
              </div>
            )}

            {/* Estado de error */}
            {error && !loading && (
              <ErrorState message={error} onRetry={handleSearchMatches} />
            )}

            {/* SUB-COMPONENTE: IDEAL PROFILES */}
            {result && !loading && (
              <BlurFade delay={0.08}>
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h2 className="text-[20px] font-semibold tracking-tight text-foreground">
                        Ideal Profiles
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Perfiles inferidos automáticamente desde la descripción con sus dimensiones de emparejamiento e importancia.
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {result.idealProfiles.length} perfiles requeridos
                    </Badge>
                  </div>

                  <div className="rounded-[16px] border border-border bg-surface shadow-soft overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Puesto e Importancia</TableHead>
                          <TableHead>Área y Sector</TableHead>
                          <TableHead>Seniority y Exp.</TableHead>
                          <TableHead>Skills clave</TableHead>
                          <TableHead>Certificaciones</TableHead>
                          <TableHead>Disponibilidad</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.idealProfiles.map((ideal: IdealProfile) => (
                          <TableRow key={ideal.roleId} className="cursor-default">
                            <TableCell>
                              <div className="flex flex-col gap-1 py-1.5">
                                <span className="font-semibold text-sm text-foreground">
                                  {ideal.roleName}
                                </span>
                                <div>
                                  <ImportanceIndicator level={ideal.inferredImportance} />
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex flex-col gap-1 text-xs">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-1.5 text-foreground font-medium">
                                      <Layers className="h-3.5 w-3.5 text-brand shrink-0" />
                                      <span className="truncate max-w-[160px]">
                                        {ideal.area}
                                      </span>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Área de trabajo: {ideal.area}
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                                      <span className="truncate max-w-[160px]">
                                        {ideal.sectorPrincipal}
                                      </span>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Sector: {ideal.sectorPrincipal}
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2 text-xs">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-1 rounded-[8px] border border-border px-2 py-1 text-foreground font-medium">
                                      <Award className="h-3.5 w-3.5 text-brand" />
                                      <span>{ideal.seniority}</span>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Nivel de seniority requerido
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-1 text-muted-foreground tabular-nums">
                                      <Clock className="h-3.5 w-3.5" />
                                      <span>≥ {ideal.minExperienceYears}a</span>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Mínimo {ideal.minExperienceYears} años de experiencia
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="inline-flex items-center gap-1.5">
                                <Code2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <SkillChips skills={ideal.requiredSkills} maxVisible={2} />
                              </div>
                            </TableCell>

                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <ShieldCheck
                                      className={`h-3.5 w-3.5 shrink-0 ${
                                        ideal.certifications.length > 0
                                          ? "text-success"
                                          : "text-muted-foreground/50"
                                      }`}
                                    />
                                    <span className="truncate max-w-[150px]">
                                      {ideal.certifications.length > 0
                                        ? ideal.certifications[0]
                                        : "No requerida"}
                                    </span>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {ideal.certifications.length > 0
                                    ? ideal.certifications.join(", ")
                                    : "Sin certificación obligatoria"}
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>

                            <TableCell>
                              <div className="flex flex-col gap-0.5 text-xs">
                                <span className="inline-flex items-center gap-1.5 text-foreground">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>{ideal.modality}</span>
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {ideal.availabilityRequired}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </BlurFade>
            )}
          </section>
        </BlurFade>

        {/* 2. SECCIÓN: MATCHES (1 Top 1 por perfil + desplegable de alternativas ordenadas con % vs Top 1) */}
        {result && !loading && (
          <BlurFade delay={0.14}>
            <section aria-labelledby="matches-heading" className="space-y-8">
              <div className="space-y-1">
                <h2
                  id="matches-heading"
                  className="text-[20px] md:text-[28px] font-semibold tracking-tight text-foreground"
                >
                  Matches por perfil buscado
                </h2>
                <p className="text-sm text-muted-foreground">
                  Se muestra el candidato óptimo (Top 1) para cada puesto. Despliega el ranking alternativo para comparar cuánto mejor o peor (%) rinde cada candidato frente al Top 1.
                </p>
              </div>

              <div className="space-y-10">
                {result.roleMatches.map((group) => {
                  const top1 = group.matches[0];
                  const alternatives = group.matches.slice(1);

                  return (
                    <div key={group.roleId} className="space-y-4">
                      {/* Cabecera del puesto */}
                      <div className="flex items-center justify-between border-b border-border/70 pb-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Briefcase className="h-4 w-4 text-brand" />
                          <h3 className="text-[20px] font-semibold text-foreground tracking-tight">
                            {group.roleName}
                          </h3>
                          <ImportanceIndicator level={group.inferredImportance} />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {group.matches.length} evaluados
                        </span>
                      </div>

                      {/* Top 1 único visible por defecto */}
                      {top1 && (
                        <CandidateMatchCard
                          cand={top1}
                          rankLabel="Top 1"
                          isAlternative={false}
                        />
                      )}

                      {/* Desplegable con los demás candidatos considerados */}
                      {alternatives.length > 0 && (
                        <Collapsible className="rounded-[14px] border border-border/80 bg-surface/60 px-5 py-3">
                          <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group">
                            <span className="flex items-center gap-2">
                              <Users className="h-3.5 w-3.5 text-brand" />
                              <span>
                                Ver otros candidatos considerados ({alternatives.length}) · Comparativa % vs Top 1
                              </span>
                            </span>
                            <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                          </CollapsibleTrigger>

                          <CollapsibleContent className="pt-4 space-y-4">
                            {alternatives.map((alt, idx) => (
                              <CandidateMatchCard
                                key={alt.employee_id}
                                cand={alt}
                                rankLabel={`#${alt.rank ?? idx + 2}`}
                                isAlternative={true}
                              />
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </BlurFade>
        )}
      </div>
    </TooltipProvider>
  );
}
export default ProjectMatcherPage;
