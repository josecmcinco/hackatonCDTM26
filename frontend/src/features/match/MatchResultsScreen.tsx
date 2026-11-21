import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Opportunity, MatchResult, Profile } from "@/types";
import { api } from "@/api";
import { useApp } from "@/providers/AppContext";
import { MatchRing } from "@/components/shared/MatchRing";
import { PersonAvatar, PersonName } from "@/components/shared/PersonAvatar";
import { StatusDot } from "@/components/shared/StatusDot";
import { SkillChips } from "@/components/shared/SkillChips";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchProfileSheet } from "./MatchProfileSheet";
import { BorderBeam } from "@/components/ui/border-beam";
import { BlurFade } from "@/components/ui/blur-fade";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Building,
  Calendar,
  MapPin,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export function MatchResultsScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mode } = useApp();

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected for sheet inspection
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Expanded state for left opportunity summary card
  const [oppExpanded, setOppExpanded] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      setThinking(true);

      const [opp, matchData, allProfiles] = await Promise.all([
        api.getOpportunityById(id, mode),
        api.getMatchesForOpportunity(id),
        api.getProfiles(mode),
      ]);

      setOpportunity(opp);
      setMatches(matchData);

      const pMap: Record<string, Profile> = {};
      allProfiles.forEach((p) => {
        pMap[p.id] = p;
      });
      setProfilesMap(pMap);

      // Simulate brief AI reasoning display (Border Beam state)
      setTimeout(() => {
        setThinking(false);
      }, 700);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar las coincidencias.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, mode]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <Skeleton className="h-72 lg:col-span-1 rounded-[16px]" />
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-44 rounded-[16px]" />
            <Skeleton className="h-44 rounded-[16px]" />
            <Skeleton className="h-44 rounded-[16px]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <ErrorState
        message={error || "Oportunidad no encontrada."}
        onRetry={loadData}
      />
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top back navigation */}
      <button
        onClick={() => navigate("/oportunidades")}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Volver a todas las oportunidades</span>
      </button>

      {/* Main Layout: Left summary + Center 3 ranked cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Compact collapsed summary card of the Opportunity (expandable) */}
        <div className="lg:col-span-4 sticky top-24">
          <Card className="p-6 border-border bg-surface shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <StatusDot status={opportunity.urgency} />
              <button
                type="button"
                onClick={() => setOppExpanded(!oppExpanded)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <span>{oppExpanded ? "Plegar" : "Detalles"}</span>
                {oppExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            <div className="space-y-1">
              <h2 className="text-[20px] font-semibold text-foreground tracking-tight">
                {opportunity.title}
              </h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Building className="h-3 w-3" />
                <span>{opportunity.client}</span>
                <span>·</span>
                <span>{opportunity.sector}</span>
              </p>
            </div>

            <div className="flex items-center justify-between py-2 border-y border-border/60 text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {opportunity.location} ({opportunity.modality})
              </span>
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {opportunity.deadline}
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Skills requeridos
              </span>
              <SkillChips skills={opportunity.mustHaveSkills} maxVisible={3} />
            </div>

            {/* Expanded details */}
            {oppExpanded && (
              <div className="pt-2 border-t border-border/60 text-xs text-foreground/90 space-y-2 animate-in fade-in-50">
                <p className="leading-relaxed">{opportunity.description}</p>
                <p className="text-muted-foreground">
                  Vacantes solicitadas: <span className="font-semibold text-foreground">{opportunity.headcount}</span>
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Center: 3 Ranked Profile cards */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-[20px] font-semibold text-foreground tracking-tight">
                Perfiles sugeridos por afinidad
              </h3>
              <p className="text-xs text-muted-foreground">
                Tú apruebas cada decisión. Elige un perfil para ver su desglose de afinidad.
              </p>
            </div>

            {thinking && (
              <Badge variant="secondary" className="gap-1.5 text-xs text-brand bg-brand/10">
                <Sparkles className="h-3 w-3 animate-spin" />
                <span>Calibrando</span>
              </Badge>
            )}
          </div>

          {/* AI Thinking Shimmer / Border Beam banner */}
          {thinking && (
            <Card className="relative overflow-hidden p-4 border-brand/30 bg-surface text-xs text-muted-foreground">
              <BorderBeam size={160} duration={8} colorFrom="var(--brand)" />
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand" />
                <span>La IA está calculando la correspondencia en base a 6 dimensiones de afinidad...</span>
              </div>
            </Card>
          )}

          {/* 3 Ranked Profile Cards */}
          {matches.length === 0 ? (
            <EmptyState
              title="No hay coincidencias disponibles"
              description="No se encontraron perfiles compatibles para esta oportunidad actualmente."
            />
          ) : (
            <div className="space-y-4">
              {matches.map((m, idx) => {
                const profile = profilesMap[m.profileId];
                if (!profile) return null;

                const isApproved = m.status === "approved";
                const isRejected = m.status === "rejected";

                return (
                  <BlurFade key={m.profileId} delay={idx * 0.08}>
                    <Card
                      onClick={() => {
                        setSelectedMatch(m);
                        setSheetOpen(true);
                      }}
                      className={`relative p-6 md:p-8 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-brand/50 ${
                        isApproved
                          ? "border-success/50 bg-success/5"
                          : isRejected
                          ? "border-danger/30 opacity-60"
                          : "border-border bg-surface"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        {/* Avatar, Name, Role & Reasons */}
                        <div className="flex items-start gap-4 flex-1">
                          <PersonAvatar
                            name={profile.name}
                            initials={profile.initials}
                            size="lg"
                          />

                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <PersonName
                                name={profile.name}
                                id={profile.id}
                                className="text-[20px] font-semibold text-foreground"
                              />

                              {/* Talento Oculto Tag only when fit comes from adjacent skills */}
                              {m.hiddenTalent && (
                                <Badge
                                  variant="secondary"
                                  className="gap-1 bg-brand/10 text-brand text-xs font-semibold"
                                >
                                  <Sparkles className="h-3 w-3" />
                                  <span>Talento oculto</span>
                                </Badge>
                              )}

                              {isApproved && (
                                <Badge variant="success" className="text-xs">
                                  Aprobado
                                </Badge>
                              )}
                              {isRejected && (
                                <Badge variant="destructive" className="text-xs">
                                  Descartado
                                </Badge>
                              )}
                            </div>

                            <p className="text-xs text-muted-foreground">
                              {profile.role} · {profile.seniority} · {profile.unit}
                            </p>

                            {/* Two Plain Language Reasons */}
                            <ul className="space-y-1 text-xs text-foreground/90 pt-1">
                              {m.reasons.map((r, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Right: Big MatchRing + Arrow */}
                        <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                          <div className="text-right">
                            <span className="text-[11px] text-muted-foreground block">
                              Afinidad IA
                            </span>
                            <MatchRing score={m.score} size={64} strokeWidth={5} />
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </Card>
                  </BlurFade>
                );
              })}
            </div>
          )}

          {/* Calm reassuring line */}
          <p className="text-xs text-muted-foreground text-center pt-2">
            Tú apruebas cada decisión. La IA actúa únicamente como asesor explicable.
          </p>
        </div>
      </div>

      {/* Right Sheet with Detailed Radar, Evidence and Approve/Reject */}
      {selectedMatch && (
        <MatchProfileSheet
          match={selectedMatch}
          profile={profilesMap[selectedMatch.profileId] || null}
          opportunity={opportunity}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onApproved={(profId) => {
            setMatches((prev) =>
              prev.map((m) =>
                m.profileId === profId ? { ...m, status: "approved" } : m
              )
            );
          }}
          onRejected={(profId) => {
            setMatches((prev) =>
              prev.map((m) =>
                m.profileId === profId ? { ...m, status: "rejected" } : m
              )
            );
          }}
        />
      )}
    </div>
  );
}
