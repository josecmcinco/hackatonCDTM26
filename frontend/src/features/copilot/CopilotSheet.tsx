import { useState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MatchRing } from "@/components/shared/MatchRing";
import { defaultVoiceAdapter, VoiceState } from "@/api/voice";
import { Mic, MicOff, Send, Sparkles, Volume2, ArrowRight, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BorderBeam } from "@/components/ui/border-beam";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender: "user" | "copilot";
  text: string;
  inlineCard?: {
    opportunityId: string;
    opportunityTitle: string;
    client: string;
    topMatches: Array<{
      name: string;
      role: string;
      score: number;
    }>;
  };
}

const SUGGESTED_PROMPTS = [
  "Necesito 4 personas para un proyecto SAP en banca, empiezan en enero",
  "¿Qué perfiles de Cloud Architecture tienen disponibilidad inmediata?",
  "Mostrar casos de talento oculto identificados recientemente",
];

export function CopilotSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-welcome",
      sender: "copilot",
      text: "Hola Alba, soy tu asistente de Talent Intelligence. Puedo ayudarte a emparejar necesidades de clientes con perfiles disponibles o resolver dudas de staffing mediante IA explicable.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [speechProgress, setSpeechProgress] = useState(0);
  const [showMicNotice, setShowMicNotice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, liveTranscript]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    // Simulate AI reasoning and formatted answer
    setTimeout(() => {
      setIsThinking(false);

      let replyMsg: Message;

      if (text.toLowerCase().includes("sap")) {
        replyMsg = {
          id: `cop-${Date.now()}`,
          sender: "copilot",
          text: "He identificado la oportunidad de 'Líder SAP S/4HANA Supply' con Repsol y encontrado 2 profesionales con alta afinidad verificada en el sector energético.",
          inlineCard: {
            opportunityId: "opp-2",
            opportunityTitle: "Líder SAP S/4HANA Supply",
            client: "Repsol Digital",
            topMatches: [
              { name: "Lucía Domínguez Rey", role: "Lead SAP Consultant", score: 94 },
              { name: "Carmen Pascual Gil", role: "Supply Chain Specialist", score: 88 },
            ],
          },
        };
      } else if (text.toLowerCase().includes("cloud") || text.toLowerCase().includes("banca")) {
        replyMsg = {
          id: `cop-${Date.now()}`,
          sender: "copilot",
          text: "En 'Arquitecto Cloud y GenAI' para Banco Santander disponemos de Elena Morales (afinidad 96%) y Sara Gallego como talento oculto proveniente de LLMOps.",
          inlineCard: {
            opportunityId: "opp-1",
            opportunityTitle: "Arquitecto Cloud y GenAI",
            client: "Banco Santander",
            topMatches: [
              { name: "Elena Morales Vega", role: "Cloud & AI Architect", score: 96 },
              { name: "Sara Gallego Prieto", role: "MLOps Engineer (Talento oculto)", score: 89 },
            ],
          },
        };
      } else {
        replyMsg = {
          id: `cop-${Date.now()}`,
          sender: "copilot",
          text: "He contrastado la base de datos de talento interno con los requisitos del proyecto. Los profesionales han sido puntuados exclusivamente con criterios técnicos y experiencia objetiva, de acuerdo con el marco ético del AI Act.",
        };
      }

      setMessages((prev) => [...prev, replyMsg]);
    }, 1100);
  };

  const handleMicClick = async () => {
    if (voiceState === "idle") {
      // Show one-time privacy notice in UI if not dismissed
      setShowMicNotice(true);
      setVoiceState("listening");
      setLiveTranscript("Escuchando tu consulta...");

      await defaultVoiceAdapter.startListening((partial) => {
        setLiveTranscript(partial);
      });
    } else if (voiceState === "listening") {
      setVoiceState("processing");
      const finalText = await defaultVoiceAdapter.stopListening();
      setLiveTranscript("");
      setVoiceState("idle");
      handleSend(finalText);
    }
  };

  const handleSpeakResponse = async (text: string) => {
    if (voiceState === "speaking") {
      defaultVoiceAdapter.cancelSpeaking();
      setVoiceState("idle");
      setSpeechProgress(0);
      return;
    }

    setVoiceState("speaking");
    await defaultVoiceAdapter.speak(text, (pct) => {
      setSpeechProgress(pct);
    });
    setVoiceState("idle");
    setSpeechProgress(0);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col p-0 bg-surface border-l border-border h-full"
      >
        {/* Header */}
        <SheetHeader className="p-6 border-b border-border/50 text-left">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-brand/10 text-brand flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <SheetTitle className="text-lg">Copilot de Staffing</SheetTitle>
              <SheetDescription className="text-xs">
                Asistencia conversacional con IA explicable y supervisión humana
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Microphone / Privacy Notice Banner */}
        {showMicNotice && (
          <div className="px-6 py-2.5 bg-neutral-100 dark:bg-neutral-800/80 border-b border-border flex items-start gap-2.5 text-xs text-muted-foreground">
            <ShieldAlert className="h-4 w-4 text-brand shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-medium text-foreground">Aviso de privacidad de voz: </span>
              El procesamiento de voz es simulado en local y no analiza emociones ni almacena grabaciones biométricas.
            </div>
            <button
              onClick={() => setShowMicNotice(false)}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold"
            >
              Entendido
            </button>
          </div>
        )}

        {/* Live Speaking Progress indicator */}
        {voiceState === "speaking" && (
          <div className="px-6 py-2 bg-brand/10 border-b border-brand/20 flex items-center justify-between text-xs text-brand">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 animate-pulse" />
              <span>Reproduciendo audio simulado...</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{speechProgress}%</span>
              <button
                onClick={() => defaultVoiceAdapter.cancelSpeaking()}
                className="underline hover:opacity-80"
              >
                Detener
              </button>
            </div>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex flex-col space-y-1 max-w-[85%]",
                m.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div
                className={cn(
                  "p-4 rounded-[14px] text-sm leading-relaxed",
                  m.sender === "user"
                    ? "bg-brand text-white rounded-br-none"
                    : "bg-neutral-100 dark:bg-neutral-800/80 text-foreground rounded-bl-none border border-border/50"
                )}
              >
                <p>{m.text}</p>

                {/* Inline Match Result Card */}
                {m.inlineCard && (
                  <div className="mt-3 p-3 bg-surface rounded-[12px] border border-border shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {m.inlineCard.opportunityTitle}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {m.inlineCard.client}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        Recomendación IA
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {m.inlineCard.topMatches.map((cand) => (
                        <div
                          key={cand.name}
                          className="flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-medium text-foreground">{cand.name}</span>
                            <span className="text-muted-foreground text-[10px] block">
                              {cand.role}
                            </span>
                          </div>
                          <MatchRing score={cand.score} size={36} strokeWidth={3} />
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onOpenChange(false);
                        navigate(`/oportunidades/${m.inlineCard?.opportunityId}`);
                      }}
                      className="w-full text-xs gap-1.5 mt-1"
                    >
                      <span>Ver oportunidad completa</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {m.sender === "copilot" && (
                <button
                  type="button"
                  onClick={() => handleSpeakResponse(m.text)}
                  className="text-[11px] text-muted-foreground hover:text-brand flex items-center gap-1 mt-0.5 px-1"
                >
                  <Volume2 className="h-3 w-3" />
                  <span>Escuchar</span>
                </button>
              )}
            </div>
          ))}

          {/* AI is thinking shimmer state */}
          {isThinking && (
            <div className="relative mr-auto p-4 rounded-[14px] bg-neutral-100 dark:bg-neutral-800/80 border border-border/50 text-xs text-muted-foreground max-w-[80%] overflow-hidden">
              <BorderBeam size={100} duration={6} colorFrom="var(--brand)" />
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-brand animate-spin" />
                <span>Analizando afinidades con IA explicable...</span>
              </div>
            </div>
          )}

          {/* Live speech transcription display */}
          {voiceState === "listening" && (
            <div className="p-3 bg-brand/5 border border-brand/20 rounded-[12px] text-xs text-foreground space-y-1">
              <div className="flex items-center gap-2 text-brand font-semibold">
                <span className="h-2 w-2 rounded-full bg-brand animate-ping" />
                <span>Transcripción en directo:</span>
              </div>
              <p className="italic text-muted-foreground">
                "{liveTranscript || "Habla ahora para dictar tu consulta..."}"
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div className="px-6 py-2 border-t border-border/40 flex items-center gap-2 overflow-x-auto">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              className="text-xs shrink-0 rounded-full border border-border bg-neutral-100/60 dark:bg-neutral-800/60 px-3 py-1 text-muted-foreground hover:text-foreground hover:border-brand/40 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-border bg-surface flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            placeholder={
              voiceState === "listening"
                ? "Escuchando voz..."
                : "Escribe una petición para el Copilot..."
            }
            className="flex-1"
          />

          {/* Microphone button with state indicator */}
          <Button
            type="button"
            variant={voiceState === "listening" ? "destructive" : "secondary"}
            size="icon"
            onClick={handleMicClick}
            aria-label="Dictar consulta por voz"
            className="rounded-[10px]"
          >
            {voiceState === "listening" ? (
              <MicOff className="h-4 w-4 text-white animate-pulse" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>

          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="rounded-[10px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
