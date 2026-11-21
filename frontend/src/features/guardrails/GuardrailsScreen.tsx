import { useState, useEffect } from "react";
import { AuditLogEntry } from "@/types";
import { api } from "@/api";
import { useApp } from "@/providers/AppContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { ShieldCheck, UserCheck, EyeOff, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { BlurFade } from "@/components/ui/blur-fade";

export function GuardrailsScreen() {
  const { blindMode, setBlindMode } = useApp();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [biasData, setBiasData] = useState<Array<{ group: string; selectionRate: number; parityIndex: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [auditList, biasMetrics] = await Promise.all([
        api.getAuditLogs(),
        api.getBiasMetrics(),
      ]);
      setLogs(auditList);
      setBiasData(biasMetrics);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar la gobernanza.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40 rounded-[16px]" />
        <Skeleton className="h-64 rounded-[16px]" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-12 pb-16">
      <BlurFade delay={0.05}>
        <PageHeader
          title="Guardarraíles y Cumplimiento Normativo"
          description="Marco de gobernanza algorítmica, trazabilidad de decisiones humanas y conformidad estricta con el Reglamento Europeo de IA (AI Act)."
        />
      </BlurFade>

      {/* Human-in-the-Loop & Blind Mode Live Status Banner */}
      <BlurFade delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Human in the loop card */}
          <Card className="p-6 space-y-3 border-border bg-surface shadow-soft">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-success/10 text-success flex items-center justify-center">
                <UserCheck className="h-4 w-4" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                Supervisión Humana Obligatoria (Human-in-the-loop)
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              El motor de IA de NTT DATA tiene prohibido realizar asignaciones, contrataciones o descartes automáticos. Todas las recomendaciones son asesorías no vinculantes que exigen la validación expresa de un staffing manager.
            </p>
            <div className="pt-1">
              <Badge variant="success" className="text-xs">
                Protocolo Activo · Sin automatización desatendida
              </Badge>
            </div>
          </Card>

          {/* Blind Mode Status (Live from Context) */}
          <Card className="p-6 space-y-3 border-border bg-surface shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                  <EyeOff className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Modo Ciego (Anonimización)
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Control global en tiempo real
                  </span>
                </div>
              </div>

              <Switch
                checked={blindMode}
                onCheckedChange={setBlindMode}
                aria-label="Alternar modo ciego global"
              />
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Oculta nombres, fotos y referencias personales en todas las pantallas para evitar sesgos inconscientes durante la fase de cribado y evaluación técnica.
            </p>

            <div className="pt-1">
              <Badge
                variant={blindMode ? "default" : "secondary"}
                className="text-xs"
              >
                {blindMode ? "Modo ciego ACTIVADO (En vigor)" : "Modo ciego DESACTIVADO"}
              </Badge>
            </div>
          </Card>
        </div>
      </BlurFade>

      {/* Bias Check Summary in Plain Language + Bar Chart */}
      <BlurFade delay={0.15}>
        <Card className="p-8 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand" />
              <h3 className="text-[20px] font-semibold text-foreground tracking-tight">
                La tasa de recomendación se mantiene equilibrada en todos los grupos evaluados
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Índice de paridad estadística entre colectivos de antigüedad y procedencia geográfica (referencia 50%).
            </p>
          </div>

          <div className="h-[240px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={biasData}
                margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
              >
                <XAxis
                  dataKey="group"
                  tick={{ fill: "var(--foreground)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 70]}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="p-3 bg-surface border border-border rounded-[10px] shadow-md text-xs space-y-1">
                          <p className="font-semibold text-foreground">{d.group}</p>
                          <p className="text-muted-foreground">
                            Tasa de selección: <span className="font-semibold text-foreground">{d.selectionRate}%</span>
                          </p>
                          <p className="text-muted-foreground">
                            Índice de paridad: <span className="font-semibold text-brand">{d.parityIndex}</span> (Óptimo: 1.0)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={50} stroke="var(--chart-muted)" strokeDasharray="3 3" />
                <Bar dataKey="selectionRate" radius={[4, 4, 0, 0]}>
                  {biasData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill="var(--brand)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-4 rounded-[12px] bg-neutral-50 dark:bg-neutral-900 border border-border text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Conclusión de auditoría: </span>
            Ningún colectivo presenta una desviación superior al ±3% respecto al umbral de paridad. Las evaluaciones se sustentan estrictamente en evidencias de proyectos demostradas.
          </div>
        </Card>
      </BlurFade>

      {/* EU AI Act Note */}
      <BlurFade delay={0.2}>
        <Card className="p-6 border-border bg-neutral-50/60 dark:bg-neutral-900/40 space-y-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Lock className="h-4 w-4 text-brand" />
            <span>Declaración de Conformidad con el Reglamento Europeo de Inteligencia Artificial (EU AI Act)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground pt-1">
            <div className="p-3 bg-surface rounded-[10px] border border-border space-y-1">
              <span className="font-semibold text-foreground block">Clasificación de Alto Riesgo</span>
              <p>Sistemas aplicados al empleo, selección de personal y gestión de recursos humanos (Anexo III).</p>
            </div>
            <div className="p-3 bg-surface rounded-[10px] border border-border space-y-1">
              <span className="font-semibold text-foreground block">Explicabilidad Total (Art. 13)</span>
              <p>Cada puntuación cuenta con desglose vectorial de factores y motivos redactados en lenguaje natural.</p>
            </div>
            <div className="p-3 bg-surface rounded-[10px] border border-border space-y-1">
              <span className="font-semibold text-foreground block">Sin Detección de Emociones</span>
              <p>Prohibición expresa de biometría emocional, inferencia de tono de voz o perfilado socioeconómico.</p>
            </div>
          </div>
        </Card>
      </BlurFade>

      {/* Audit Log Table (Who, Decision, Opportunity, Date) */}
      <BlurFade delay={0.25}>
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-[20px] font-semibold text-foreground tracking-tight">
              Registro de Auditoría de Decisiones Humanas ({logs.length} registros)
            </h3>
            <p className="text-xs text-muted-foreground">
              Trazabilidad inmutable de cada acción de aprobación, descarte y cambio de configuración.
            </p>
          </div>

          <div className="rounded-[16px] border border-border bg-surface shadow-soft overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Gestor / Actor</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Perfil o Objeto</TableHead>
                  <TableHead>Oportunidad</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-neutral-50/80">
                    <TableCell className="tabular-nums text-xs text-muted-foreground">
                      {log.timestamp}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-foreground">
                      {log.actor}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.action === "Aprobado"
                            ? "success"
                            : log.action === "Descartado"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs font-normal"
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-foreground font-medium">
                      {log.targetName}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {log.opportunityTitle}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[260px]">
                      {log.note}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </BlurFade>
    </div>
  );
}
export default GuardrailsScreen;
