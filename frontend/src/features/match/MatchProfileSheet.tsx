import { useState } from "react";
import { MatchResult, Profile, Opportunity } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MatchRing } from "@/components/shared/MatchRing";
import { PersonAvatar, PersonName } from "@/components/shared/PersonAvatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/api";
import { toast } from "sonner";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { Check, ChevronDown, Sparkles, Building, Briefcase, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MatchProfileSheetProps {
  match: MatchResult | null;
  profile: Profile | null;
  opportunity: Opportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApproved: (profileId: string) => void;
  onRejected: (profileId: string) => void;
}

export function MatchProfileSheet({
  match,
  profile,
  opportunity,
  open,
  onOpenChange,
  onApproved,
  onRejected,
}: MatchProfileSheetProps) {
  const [rejectReason, setRejectReason] = useState<string>("seniority");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const navigate = useNavigate();

  if (!match || !profile || !opportunity) return null;

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      await api.approveMatch(opportunity.id, profile.id);
      toast.success(`${profile.name} ha sido asignado a la oportunidad`, {
        description: "Se ha registrado la decisión en el registro de auditoría de supervisión humana.",
      });
      onApproved(profile.id);
      onOpenChange(false);
    } catch {
      toast.error("Error al registrar la aprobación.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsRejecting(true);
      await api.rejectMatch(opportunity.id, profile.id, rejectReason);
      toast.info(`Perfil descartado para esta oportunidad`, {
        description: `Motivo: ${rejectReason}`,
      });
      onRejected(profile.id);
      onOpenChange(false);
    } catch {
      toast.error("Error al registrar el descarte.");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl space-y-6">
        {/* Header */}
        <SheetHeader className="text-left space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PersonAvatar name={profile.name} initials={profile.initials} size="lg" />
              <div>
                <PersonName name={profile.name} id={profile.id} className="text-[20px] font-semibold" />
                <p className="text-xs text-muted-foreground">
                  {profile.role} · {profile.seniority}
                </p>
              </div>
            </div>
            <MatchRing score={match.score} size={58} strokeWidth={4.5} />
          </div>

          <SheetDescription className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
            <Building className="h-3.5 w-3.5" />
            <span>Unidad: {profile.unit}</span>
            <span>·</span>
            <span>Disponibilidad: {profile.availability}</span>
          </SheetDescription>
        </SheetHeader>

        {/* Explainable Reasons Summary */}
        <div className="p-4 rounded-[12px] bg-neutral-50 dark:bg-neutral-900 border border-border space-y-2">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Por qué esta persona
          </p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {match.reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand shrink-0 mt-1.5" />
                <span className="text-foreground/90">{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Talento Oculto Adjacency Path if applicable */}
        {match.hiddenTalent && match.adjacentPath && (
          <div className="p-4 rounded-[12px] bg-brand/5 border border-brand/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Puente de habilidades (Talento oculto)</span>
            </div>
            <p className="text-xs text-foreground">
              De <span className="font-semibold">{match.adjacentPath.fromSkill}</span>{" "}
              a través de <span className="font-semibold">{match.adjacentPath.bridge}</span>{" "}
              hacia <span className="font-semibold">{match.adjacentPath.toSkill}</span>.
            </p>
          </div>
        )}

        {/* Radar Chart (Profile vs Opportunity Requirement) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Afinidad por dimensiones
            </h4>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand" /> Perfil
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-chart-muted" /> Requerido
              </span>
            </div>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={match.radar} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--foreground)", fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Requerido"
                  dataKey="requiredValue"
                  stroke="var(--chart-muted)"
                  fill="var(--chart-muted)"
                  fillOpacity={0.2}
                />
                <Radar
                  name="Perfil"
                  dataKey="profileValue"
                  stroke="var(--brand)"
                  fill="var(--brand)"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown of factor contributions */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Contribución por factores
          </h4>
          <div className="space-y-2">
            {match.breakdown.map((item) => (
              <div key={item.factor} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground">{item.factor}</span>
                  <span className="tabular-nums font-semibold text-brand">
                    +{item.percentage}%
                  </span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-brand h-full rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, item.percentage * 1.5))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence list */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Evidencias validadas en proyectos
          </h4>
          <div className="space-y-2">
            {match.evidence.map((ev, idx) => (
              <div
                key={idx}
                className="p-3 rounded-[10px] border border-border/70 bg-surface text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-medium text-foreground">{ev.project}</span>
                  <span className="tabular-nums">{ev.year}</span>
                </div>
                <p className="text-muted-foreground">{ev.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Collapsible: Cómo se calculó esta puntuación */}
        <Collapsible className="border border-border/70 rounded-[12px] p-3 text-xs space-y-2">
          <CollapsibleTrigger className="flex items-center justify-between w-full font-semibold text-muted-foreground hover:text-foreground">
            <span className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              <span>Cómo se calculó esta puntuación (Supervisión técnica)</span>
            </span>
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 text-muted-foreground pt-2 border-t border-border/50">
            <p>
              El modelo evalúa la superposición de grafos de competencias ponderada por experiencia contrastada en proyectos cerrados de los últimos 36 meses.
            </p>
            <p>
              Factores auditados: experiencia sectorial directa (25%), competencias mandatorias (50%), disponibilidad temporal (15%), validación de pares técnicos (10%). No se utilizan variables protegidas por el AI Act europeo.
            </p>
          </CollapsibleContent>
        </Collapsible>

        {/* Decision Actions Bar */}
        <div className="pt-4 border-t border-border/80 space-y-3">
          <p className="text-xs text-muted-foreground text-center italic">
            Tú apruebas cada decisión. El sistema no realiza asignaciones automáticas.
          </p>

          <div className="flex items-center gap-3">
            {/* The ONLY filled primary button on this screen */}
            <Button
              variant="default"
              size="default"
              onClick={handleApprove}
              disabled={isApproving || match.status === "approved"}
              className="flex-1 font-semibold gap-1.5 shadow-soft"
            >
              <Check className="h-4 w-4" />
              <span>{match.status === "approved" ? "Aprobado" : "Aprobar asignación"}</span>
            </Button>

            <Button
              variant="outline"
              size="default"
              onClick={() => {
                onOpenChange(false);
                navigate(`/comparar?opp=${opportunity.id}&p1=${profile.id}`);
              }}
              className="text-xs gap-1.5"
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Comparar</span>
            </Button>

            <Select value={rejectReason} onValueChange={setRejectReason}>
              <SelectTrigger className="w-[140px] text-xs h-10">
                <SelectValue placeholder="Motivo descarte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seniority">Seniority no afín</SelectItem>
                <SelectItem value="disponibilidad">Fecha incompat.</SelectItem>
                <SelectItem value="experiencia">Falta exp. sector</SelectItem>
                <SelectItem value="otro">Otro motivo</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="default"
              onClick={handleReject}
              disabled={isRejecting || match.status === "rejected"}
              className="text-xs text-danger hover:text-danger hover:bg-danger/10"
            >
              Descartar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
