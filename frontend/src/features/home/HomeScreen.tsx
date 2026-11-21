import { useState, useEffect } from "react";
import { Opportunity, SkillDemandSupply } from "@/types";
import { api } from "@/api";
import { useApp } from "@/providers/AppContext";
import { MatchRing } from "@/components/shared/MatchRing";
import { PersonAvatar, PersonName } from "@/components/shared/PersonAvatar";
import { TakeawayChart } from "@/components/shared/TakeawayChart";
import { OpportunitiesTable } from "@/features/opportunities/OpportunitiesTable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { BlurFade } from "@/components/ui/blur-fade";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { defaultVoiceAdapter } from "@/api/voice";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Sparkles,
  Clock,
  Briefcase,
  Play,
  Volume2,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function HomeScreen() {
  const { mode } = useApp();
  const navigate = useNavigate();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [demandSupply, setDemandSupply] = useState<SkillDemandSupply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio summary simulation state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [summaryTranscript, setSummaryTranscript] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [opps, skills] = await Promise.all([
        api.getOpportunities(mode),
        api.getSkillDemandSupply(),
      ]);
      setOpportunities(opps);
      setDemandSupply(skills);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido al cargar datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [mode]);

  const handlePlayAudioSummary = async () => {
    if (isSpeaking) {
      defaultVoiceAdapter.cancelSpeaking();
      setIsSpeaking(false);
      setAudioProgress(0);
      setSummaryTranscript("");
      return;
    }

    const text =
      "Resumen ejecutivo de staffing: 3 oportunidades críticas requieren cobertura esta semana. La posición más urgente es Arquitecto Cloud y GenAI para Banco Santander, con una afinidad máxima del 96%. Se detecta un déficit prioritario de 12 profesionales en arquitectura AWS.";

    setIsSpeaking(true);
    setSummaryTranscript(text);

    await defaultVoiceAdapter.speak(text, (pct) => {
      setAudioProgress(pct);
    });

    setIsSpeaking(false);
    setAudioProgress(0);
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="space-y-2">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-64 w-full rounded-[16px]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-[16px]" />
          <Skeleton className="h-32 rounded-[16px]" />
          <Skeleton className="h-32 rounded-[16px]" />
        </div>
        <Skeleton className="h-80 rounded-[16px]" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  // Hero: Most urgent Opportunity
  const heroOpportunity = opportunities[0] || null;

  return (
    <div className="space-y-12 pb-16">
      {/* a. Greeting + one sentence */}
      <BlurFade delay={0.05}>
        <div className="space-y-1">
          <h1 className="text-[28px] md:text-[40px] font-semibold text-foreground tracking-tight leading-tight">
            Buenos días, Alba
          </h1>
          <p className="text-base text-muted-foreground font-normal">
            3 oportunidades críticas necesitan equipo esta semana.
          </p>
        </div>
      </BlurFade>

      {/* b. HERO CARD: Most urgent Opportunity (~2x visual weight) */}
      {heroOpportunity && (
        <BlurFade delay={0.1}>
          <Card className="relative overflow-hidden border-border bg-surface p-8 shadow-soft">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              {/* Left Details */}
              <div className="space-y-4 max-w-xl">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger bg-danger/10 px-2.5 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
                    Prioridad Crítica
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Límite: {heroOpportunity.deadline}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-[24px] md:text-[28px] font-semibold text-foreground tracking-tight">
                    {heroOpportunity.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {heroOpportunity.client} · {heroOpportunity.sector} · {heroOpportunity.location} ({heroOpportunity.modality})
                  </p>
                </div>

                <p className="text-sm text-foreground/90 leading-relaxed">
                  {heroOpportunity.description}
                </p>

                {/* Primary Button (The ONLY filled primary on screen) + Ghost Voice Button */}
                <div className="flex items-center gap-4 pt-2 flex-wrap">
                  <Button
                    variant="default"
                    size="lg"
                    onClick={() => navigate(`/oportunidades/${heroOpportunity.id}`)}
                    className="gap-2 shadow-soft font-semibold"
                  >
                    <span>
                      {mode === "staffing" ? "Revisar perfiles" : "Revisar candidatos"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePlayAudioSummary}
                    className="text-xs text-muted-foreground hover:text-foreground gap-2 h-10 px-3"
                    aria-label="Escuchar resumen de situación"
                  >
                    {isSpeaking ? (
                      <>
                        <Volume2 className="h-4 w-4 text-brand animate-pulse" />
                        <span>Detener resumen ({audioProgress}%)</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>▶ Escuchar resumen</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Visible Simulated Voice Transcript */}
                {isSpeaking && summaryTranscript && (
                  <div className="mt-4 p-3.5 bg-neutral-100 dark:bg-neutral-800/60 rounded-[12px] border border-border text-xs text-foreground space-y-1.5">
                    <div className="flex items-center justify-between text-brand font-medium">
                      <span>Transcripción en audio explicativo:</span>
                      <span className="tabular-nums">{audioProgress}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-brand h-full transition-all duration-200"
                        style={{ width: `${audioProgress}%` }}
                      />
                    </div>
                    <p className="text-muted-foreground italic leading-relaxed">
                      "{summaryTranscript}"
                    </p>
                  </div>
                )}
              </div>

              {/* Right: 3 Suggested Profiles with MatchRing */}
              <div className="flex flex-col space-y-3 bg-neutral-50/80 dark:bg-neutral-900/60 p-5 rounded-[16px] border border-border/80 lg:min-w-[320px]">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Sugerencias Explicables
                  </span>
                  <Badge variant="secondary" className="text-[10px] bg-brand/10 text-brand">
                    3 perfiles afines
                  </Badge>
                </div>

                {/* Profile 1 */}
                <div className="flex items-center justify-between gap-3 p-2 rounded-[10px] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <PersonAvatar name="Elena Morales Vega" initials="EM" size="md" />
                    <div>
                      <PersonName name="Elena Morales Vega" id="prof-1" className="text-xs font-semibold block" />
                      <span className="text-[11px] text-muted-foreground">Lead Cloud Architect</span>
                    </div>
                  </div>
                  <MatchRing score={96} size={42} strokeWidth={3.5} />
                </div>

                {/* Profile 2 (Hidden talent) */}
                <div className="flex items-center justify-between gap-3 p-2 rounded-[10px] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <PersonAvatar name="Sara Gallego Prieto" initials="SG" size="md" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <PersonName name="Sara Gallego Prieto" id="prof-5" className="text-xs font-semibold" />
                        <Sparkles className="h-3 w-3 text-brand" />
                      </div>
                      <span className="text-[11px] text-muted-foreground">MLOps & LLMs</span>
                    </div>
                  </div>
                  <MatchRing score={89} size={42} strokeWidth={3.5} />
                </div>

                {/* Profile 3 */}
                <div className="flex items-center justify-between gap-3 p-2 rounded-[10px] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <PersonAvatar name="Beatriz Marín Torres" initials="BM" size="md" />
                    <div>
                      <PersonName name="Beatriz Marín Torres" id="prof-13" className="text-xs font-semibold block" />
                      <span className="text-[11px] text-muted-foreground">Data Engineer AWS</span>
                    </div>
                  </div>
                  <MatchRing score={83} size={42} strokeWidth={3.5} />
                </div>
              </div>
            </div>
          </Card>
        </BlurFade>
      )}

      {/* c. 3 KPI CARDS WITH SPARKLINES + NUMBER TICKER */}
      <BlurFade delay={0.15}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* KPI 1 */}
          <Card className="p-6 space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Oportunidades abiertas
              </span>
              <Briefcase className="h-4 w-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[40px] font-semibold text-foreground tracking-tight tabular-nums">
                <NumberTicker value={opportunities.length} />
              </span>
              <span className="text-xs text-muted-foreground">posiciones activas</span>
            </div>
            {/* Minimal SVG Sparkline */}
            <div className="h-7 w-full pt-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 20">
                <path
                  d="M0,15 Q25,8 50,14 T100,5"
                  fill="none"
                  stroke="var(--brand)"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">
              3 prioritarias para staffing antes del viernes
            </p>
          </Card>

          {/* KPI 2 */}
          <Card className="p-6 space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Talento oculto detectado
              </span>
              <Sparkles className="h-4 w-4 text-brand" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[40px] font-semibold text-foreground tracking-tight tabular-nums">
                <NumberTicker value={8} />
              </span>
              <span className="text-xs text-brand font-medium">por afinidad adyacente</span>
            </div>
            {/* Sparkline */}
            <div className="h-7 w-full pt-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 20">
                <path
                  d="M0,18 Q30,12 60,8 T100,2"
                  fill="none"
                  stroke="var(--brand)"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">
              Skills puente identificadas (ej. COBOL a Java Spring)
            </p>
          </Card>

          {/* KPI 3 */}
          <Card className="p-6 space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Tiempo hasta shortlist
              </span>
              <Clock className="h-4 w-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[40px] font-semibold text-foreground tracking-tight tabular-nums">
                <NumberTicker value={14} suffix=" min" />
              </span>
              <span className="text-xs text-success font-medium">antes 6 días</span>
            </div>
            {/* Sparkline */}
            <div className="h-7 w-full pt-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 20">
                <path
                  d="M0,4 Q30,6 60,12 T100,18"
                  fill="none"
                  stroke="var(--success)"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">
              Reducción del 98% en cribado con matching explicable
            </p>
          </Card>
        </div>
      </BlurFade>

      {/* d. ONE HERO CHART: Demand vs Available Talent by Skill */}
      <BlurFade delay={0.2}>
        <Card className="p-8">
          <TakeawayChart data={demandSupply} />
        </Card>
      </BlurFade>

      {/* e. OPPORTUNITIES TABLE */}
      <BlurFade delay={0.25}>
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-[20px] font-semibold tracking-tight text-foreground">
              Oportunidades en curso
            </h3>
            <p className="text-sm text-muted-foreground">
              Haz clic en cualquier fila para desplegar el análisis de afinidad y detalles.
            </p>
          </div>

          <OpportunitiesTable data={opportunities} showExport={true} />
        </div>
      </BlurFade>
    </div>
  );
}
