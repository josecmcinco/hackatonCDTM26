import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Opportunity, MatchResult, Profile } from "@/types";
import { api } from "@/api";
import { useApp } from "@/providers/AppContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { MatchRing } from "@/components/shared/MatchRing";
import { PersonAvatar, PersonName } from "@/components/shared/PersonAvatar";
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
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { Check, AlertCircle, Minus, Sparkles, Building } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { BlurFade } from "@/components/ui/blur-fade";

export function CompareScreen() {
  const [searchParams] = useSearchParams();
  const { mode } = useApp();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedOppId, setSelectedOppId] = useState<string>("opp-1");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const oppParam = searchParams.get("opp");
    if (oppParam) {
      setSelectedOppId(oppParam);
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [opps, allProfs] = await Promise.all([
        api.getOpportunities(mode),
        api.getProfiles(mode),
      ]);
      setOpportunities(opps);
      setProfiles(allProfs);

      const targetId = selectedOppId || (opps[0]?.id ?? "opp-1");
      const matchData = await api.getMatchesForOpportunity(targetId);
      setMatches(matchData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar la comparativa.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [mode, selectedOppId]);

  const currentOpp = useMemo(() => {
    return opportunities.find((o) => o.id === selectedOppId) || opportunities[0] || null;
  }, [opportunities, selectedOppId]);

  // Map 2-3 compared profiles
  const comparedProfiles = useMemo(() => {
    return matches.slice(0, 3).map((m) => {
      const prof = profiles.find((p) => p.id === m.profileId);
      return {
        match: m,
        profile: prof,
      };
    }).filter((item): item is { match: MatchResult; profile: Profile } => Boolean(item.profile));
  }, [matches, profiles]);

  // Combined Radar data overlaid for 2-3 profiles
  const overlaidRadarData = useMemo(() => {
    if (comparedProfiles.length === 0) return [];
    const baseAxes = comparedProfiles[0].match.radar;
    return baseAxes.map((point) => {
      const row: Record<string, string | number> = {
        axis: point.axis,
        Requerido: point.requiredValue,
      };
      comparedProfiles.forEach((cp, idx) => {
        const found = cp.match.radar.find((r) => r.axis === point.axis);
        row[`P${idx + 1}`] = found ? found.profileValue : 0;
      });
      return row;
    });
  }, [comparedProfiles]);

  const handleApproveRecommended = async () => {
    if (!currentOpp || comparedProfiles.length === 0) return;
    const recommended = comparedProfiles[0];
    try {
      await api.approveMatch(currentOpp.id, recommended.profile.id);
      toast.success(`Selección de ${recommended.profile.name} aprobada`, {
        description: `Asignado con éxito a la oportunidad ${currentOpp.title}.`,
      });
    } catch {
      toast.error("Error al registrar la aprobación.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-14 w-full rounded-[16px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-80 rounded-[16px]" />
          <Skeleton className="h-80 rounded-[16px]" />
        </div>
      </div>
    );
  }

  if (error || !currentOpp) {
    return <ErrorState message={error || "Oportunidad no encontrada."} onRetry={loadData} />;
  }

  const radarColors = ["var(--brand)", "#10B981", "#8B5CF6"];

  return (
    <div className="space-y-8 pb-16">
      <BlurFade delay={0.05}>
        <PageHeader
          title="Comparativa de Terna y Decisión"
          description="Contraste de habilidades y dimensionalidad técnica para seleccionar al mejor candidato con supervisión humana."
        />
      </BlurFade>

      {/* Selector at top for ONE Opportunity */}
      <BlurFade delay={0.1}>
        <Card className="p-4 border-border bg-surface shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Oportunidad analizada
              </span>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5" />
                <span>{currentOpp.client} · {currentOpp.sector}</span>
              </p>
            </div>

            <div className="w-full sm:w-96">
              <Select value={selectedOppId} onValueChange={setSelectedOppId}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Seleccionar oportunidad" />
                </SelectTrigger>
                <SelectContent>
                  {opportunities.map((opp) => (
                    <SelectItem key={opp.id} value={opp.id}>
                      {opp.title} ({opp.client})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </BlurFade>

      {/* ONE HIGHLIGHTED RECOMENDACIÓN CARD with plain-language reasoning & single primary button */}
      {comparedProfiles.length > 0 && (
        <BlurFade delay={0.15}>
          <Card className="p-8 border-brand/40 bg-brand/5 shadow-soft">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1.5 bg-brand text-white text-xs">
                    <Sparkles className="h-3 w-3" />
                    <span>Recomendación IA Explicable</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Afinidad más alta ({comparedProfiles[0].match.score}%)
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-[20px] font-semibold text-foreground tracking-tight">
                    {comparedProfiles[0].profile.name} ofrece la mayor solvencia técnica inmediata
                  </h3>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {comparedProfiles[0].match.reasons[0]} {comparedProfiles[0].match.reasons[1]}
                  </p>
                </div>
              </div>

              {/* The ONLY filled primary button on this screen */}
              <div className="shrink-0">
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleApproveRecommended}
                  className="gap-2 shadow-soft font-semibold w-full sm:w-auto"
                >
                  <Check className="h-4 w-4" />
                  <span>Aprobar selección recomendada</span>
                </Button>
              </div>
            </div>
          </Card>
        </BlurFade>
      )}

      {/* Side-by-side comparison cards */}
      <BlurFade delay={0.2}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {comparedProfiles.map((cp) => (
            <Card key={cp.profile.id} className="p-6 space-y-4 border-border bg-surface shadow-soft">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <PersonAvatar name={cp.profile.name} initials={cp.profile.initials} size="md" />
                  <div>
                    <PersonName name={cp.profile.name} id={cp.profile.id} className="text-sm font-semibold block" />
                    <span className="text-xs text-muted-foreground">{cp.profile.role}</span>
                  </div>
                </div>
                <MatchRing score={cp.match.score} size={46} strokeWidth={4} />
              </div>

              <div className="text-xs text-muted-foreground border-y border-border/50 py-2 space-y-1">
                <p>Seniority: <span className="text-foreground font-medium">{cp.profile.seniority}</span></p>
                <p>Disponibilidad: <span className="text-foreground font-medium">{cp.profile.availability}</span></p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Afinidad explicable
                </span>
                <p className="text-xs text-foreground/90">
                  {cp.match.reasons[0]}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </BlurFade>

      {/* Overlaid Radar Chart + Skills Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Overlaid Radar Chart */}
        <BlurFade delay={0.25}>
          <Card className="p-6 space-y-4">
            <div className="space-y-1">
              <h4 className="text-[20px] font-semibold text-foreground tracking-tight">
                Superposición de ejes dimensionales
              </h4>
              <p className="text-xs text-muted-foreground">
                Comparativa simultánea de perfiles frente al requisito mínimo establecido.
              </p>
            </div>

            <div className="h-[300px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={overlaidRadarData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--foreground)", fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Requerido"
                    dataKey="Requerido"
                    stroke="var(--chart-muted)"
                    fill="var(--chart-muted)"
                    fillOpacity={0.15}
                  />
                  {comparedProfiles.map((cp, idx) => (
                    <Radar
                      key={cp.profile.id}
                      name={cp.profile.name}
                      dataKey={`P${idx + 1}`}
                      stroke={radarColors[idx]}
                      fill={radarColors[idx]}
                      fillOpacity={0.25}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-6 pt-2 border-t border-border/50 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-chart-muted" />
                <span className="text-muted-foreground">Requerido</span>
              </div>
              {comparedProfiles.map((cp, idx) => (
                <div key={cp.profile.id} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: radarColors[idx] }}
                  />
                  <span className="text-foreground font-medium">{cp.profile.name.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </Card>
        </BlurFade>

        {/* Compact Table of Must-have skills with check / partial / missing dots */}
        <BlurFade delay={0.3}>
          <Card className="p-6 space-y-4">
            <div className="space-y-1">
              <h4 className="text-[20px] font-semibold text-foreground tracking-tight">
                Cumplimiento de competencias mandatorias
              </h4>
              <p className="text-xs text-muted-foreground">
                Verificación de cada competencia requerida para el éxito del proyecto.
              </p>
            </div>

            <div className="rounded-[12px] border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-border">
                  <tr>
                    <th className="p-3 text-left font-semibold text-muted-foreground">
                      Competencia Requerida
                    </th>
                    {comparedProfiles.map((cp) => (
                      <th key={cp.profile.id} className="p-3 text-center font-semibold text-foreground">
                        {cp.profile.name.split(" ")[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {currentOpp.mustHaveSkills.map((skillName) => (
                    <tr key={skillName} className="hover:bg-neutral-50/50">
                      <td className="p-3 font-medium text-foreground">{skillName}</td>
                      {comparedProfiles.map((cp) => {
                        const skillMatch = cp.profile.skills.find(
                          (s) => s.name.toLowerCase() === skillName.toLowerCase()
                        );
                        const level = skillMatch ? skillMatch.level : 0;

                        return (
                          <td key={cp.profile.id} className="p-3 text-center">
                            {level >= 4 ? (
                              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-success/15 text-success">
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              </span>
                            ) : level >= 2 ? (
                              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-warning/15 text-warning">
                                <AlertCircle className="h-3.5 w-3.5" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-neutral-100 dark:bg-neutral-800 text-muted-foreground">
                                <Minus className="h-3 w-3" />
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-6 pt-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success" /> Dominio completo (L4-L5)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-warning" /> Parcial (L2-L3)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-neutral-400" /> Sin evidencia directa
              </span>
            </div>
          </Card>
        </BlurFade>
      </div>
    </div>
  );
}
