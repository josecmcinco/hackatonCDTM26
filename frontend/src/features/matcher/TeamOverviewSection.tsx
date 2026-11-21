import { TeamOverviewMetrics } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NumberTicker } from "@/components/ui/number-ticker";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Sparkles, TrendingUp, Info, Target } from "lucide-react";

interface TeamOverviewSectionProps {
  overview: TeamOverviewMetrics;
}

export function TeamOverviewSection({ overview }: TeamOverviewSectionProps) {
  const dimensionsOrder: Array<
    "Factor Técnico" | "Factor Logístico" | "Factor Histórico"
  > = ["Factor Técnico", "Factor Logístico", "Factor Histórico"];

  return (
    <section aria-labelledby="team-overview-heading" className="space-y-6">
      <div className="space-y-1">
        <h2
          id="team-overview-heading"
          className="text-[20px] md:text-[28px] font-semibold tracking-tight text-foreground"
        >
          Overview del equipo propuesto (Top 1)
        </h2>
        <p className="text-sm text-muted-foreground">
          Predicción de rendimiento conjunto según metodología Belbin, cumplimiento por dimensiones y desglose cuantificado de cada factor.
        </p>
      </div>

      {/* 1. DOS INDICADORES TIPO DASHBOARD EN GRANDE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Indicador 1: Rendimiento Belbin */}
        <Card className="p-6 md:p-8 border-border bg-surface shadow-soft space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Target className="h-4 w-4 text-brand" />
              Rendimiento del equipo (Metodología Belbin)
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="Cómo se calcula el rendimiento Belbin">
                  <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Cobertura equilibrada de los 9 roles Belbin (Acción, Sociales y Mentales) combinando rol, seniority y habilidades blandas del Top 1.
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-[40px] font-semibold text-foreground tracking-tight tabular-nums">
              <NumberTicker value={overview.belbinPerformancePct} suffix="%" />
            </span>
            <span className="text-xs font-medium text-success">
              Equipo de alto rendimiento equilibrado
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Sin solapamientos críticos ni vacíos en roles clave de ejecución, coordinación e ideación.
          </p>
        </Card>

        {/* Indicador 2: Porcentaje de éxito esperado */}
        <Card className="p-6 md:p-8 border-border bg-surface shadow-soft space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-brand" />
              Porcentaje de éxito esperado del equipo
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="Cómo se calcula el éxito esperado">
                  <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Calculado combinando: Afinidad Técnica media (45%) + Disponibilidad/Logística (20%) + Histórico de éxito con Match Partners y Conformidad (20%) + Equilibrio Belbin (15%), penalizado por riesgo de salida.
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-[40px] font-semibold text-brand tracking-tight tabular-nums">
              <NumberTicker value={overview.expectedSuccessPct} suffix="%" />
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Probabilidad estimada de entrega en plazo
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Integra ajuste técnico, disponibilidad real, sinergia previa entre compañeros y equilibrio Belbin.
          </p>
        </Card>
      </div>

      {/* 2. DOS GRÁFICAS DE ARAÑA LADO A LADO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica 1: Radar de 9 dimensiones Belbin */}
        <Card className="p-6 border-border bg-surface shadow-soft space-y-4">
          <div className="space-y-1">
            <h3 className="text-[20px] font-semibold text-foreground tracking-tight">
              Predicción de equipo de alto rendimiento (9 roles Belbin)
            </h3>
            <p className="text-xs text-muted-foreground">
              Cobertura del equipo Top 1 frente al umbral óptimo de equilibrio grupal.
            </p>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={overview.belbinRadar}
                margin={{ top: 15, right: 30, left: 30, bottom: 15 }}
              >
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="role"
                  tick={{ fill: "var(--foreground)", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                />
                <Radar
                  name="Umbral óptimo"
                  dataKey="benchmark"
                  stroke="var(--chart-muted)"
                  fill="var(--chart-muted)"
                  fillOpacity={0.2}
                />
                <Radar
                  name="Equipo Top 1"
                  dataKey="teamScore"
                  stroke="var(--brand)"
                  fill="var(--brand)"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-2 border-t border-border/50 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-brand" /> Equipo Top 1
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-chart-muted" /> Umbral óptimo
            </span>
          </div>
        </Card>

        {/* Gráfica 2: Radar de cumplimiento de las 3 dimensiones vs lo esperado */}
        <Card className="p-6 border-border bg-surface shadow-soft space-y-4">
          <div className="space-y-1">
            <h3 className="text-[20px] font-semibold text-foreground tracking-tight">
              Cumplimiento global por dimensión frente a lo esperado
            </h3>
            <p className="text-xs text-muted-foreground">
              Media ponderada del equipo Top 1 en Factor Técnico, Logístico e Histórico.
            </p>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={overview.dimensionsRadar}
                margin={{ top: 20, right: 40, left: 40, bottom: 20 }}
              >
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: "var(--foreground)", fontSize: 12 }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                />
                <Radar
                  name="Esperado"
                  dataKey="expected"
                  stroke="var(--chart-muted)"
                  fill="var(--chart-muted)"
                  fillOpacity={0.2}
                />
                <Radar
                  name="Cumplimiento Top 1"
                  dataKey="teamScore"
                  stroke="var(--brand)"
                  fill="var(--brand)"
                  fillOpacity={0.38}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-2 border-t border-border/50 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-brand" /> Cumplimiento Top 1
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-chart-muted" /> Requisito esperado
            </span>
          </div>
        </Card>
      </div>

      {/* 3. GRÁFICA INFERIOR: CUMPLIMIENTO POR CADA FACTOR CONCRETO (INCLUIDOS INFERIDOS) */}
      <Card className="p-6 md:p-8 border-border bg-surface shadow-soft space-y-6">
        <div className="space-y-1">
          <h3 className="text-[20px] font-semibold text-foreground tracking-tight">
            Desglose de cumplimiento por factor concreto dentro de cada dimensión
          </h3>
          <p className="text-xs text-muted-foreground">
            Todas las variables —incluidas las cualitativas e inferidas— se normalizan a una escala de cumplimiento 0–100% sobre el equipo Top 1.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {dimensionsOrder.map((dimName) => {
            const items = overview.factorCompliance.filter(
              (f) => f.dimension === dimName
            );
            return (
              <div
                key={dimName}
                className="rounded-[12px] border border-border/60 bg-neutral-50/50 dark:bg-neutral-900/30 p-4 space-y-3"
              >
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider pb-1 border-b border-border/50">
                  {dimName}
                </h4>

                <div className="space-y-3">
                  {items.map((item) => (
                    <Tooltip key={item.factor}>
                      <TooltipTrigger asChild>
                        <div className="space-y-1 cursor-help">
                          <div className="flex items-center justify-between text-xs gap-2">
                            <span className="text-foreground flex items-center gap-1.5 truncate">
                              <span className="truncate">{item.factor}</span>
                              {item.isInferred && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 bg-brand/10 text-brand border-transparent gap-0.5"
                                >
                                  <Sparkles className="h-2.5 w-2.5" />
                                  Inferido
                                </Badge>
                              )}
                            </span>
                            <span className="tabular-nums font-semibold text-foreground shrink-0">
                              {item.scorePct}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-neutral-200/80 dark:bg-neutral-800 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${item.scorePct}%`,
                                backgroundColor:
                                  item.scorePct >= 80
                                    ? "var(--brand)"
                                    : "var(--chart-muted)",
                              }}
                            />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        {item.calculationNote}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
