import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Sparkles } from "lucide-react";
import { useApp } from "@/providers/AppContext";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { CopilotSheet } from "@/features/copilot/CopilotSheet";

export function AppShell({ children }: { children: ReactNode }) {
  const { isCopilotOpen, setIsCopilotOpen, isCommandOpen, setIsCommandOpen, openCopilotWithPrompt } = useApp();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pl-64 min-w-0">
        <Topbar />

        <main className="flex-1 px-8 md:px-12 py-10 max-w-[1200px] w-full mx-auto space-y-12">
          {children}
        </main>

        {/* Quiet Footer */}
        <footer className="py-6 px-12 border-t border-border/40 text-center text-xs text-muted-foreground">
          <span>Powered by NTT DATA · Talent Intelligence & Explainable AI</span>
        </footer>
      </div>

      {/* Floating Copilot Button (Bottom-Right) */}
      <button
        type="button"
        onClick={() => setIsCopilotOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground shadow-lg hover:opacity-95 transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
        aria-label="Abrir asistente Copilot"
      >
        <Sparkles className="h-4 w-4" />
        <span>Copilot</span>
      </button>

      {/* Floating Copilot Sheet */}
      <CopilotSheet open={isCopilotOpen} onOpenChange={setIsCopilotOpen} />

      {/* Command Palette (⌘K) */}
      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <CommandInput placeholder="Buscar oportunidades, acciones o perfiles..." />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          <CommandGroup heading="Navegación directa">
            <CommandItem
              onSelect={() => {
                navigate("/");
                setIsCommandOpen(false);
              }}
            >
              Inicio (Centro de mando)
            </CommandItem>
            <CommandItem
              onSelect={() => {
                navigate("/oportunidades");
                setIsCommandOpen(false);
              }}
            >
              Ver todas las Oportunidades
            </CommandItem>
            <CommandItem
              onSelect={() => {
                navigate("/skills");
                setIsCommandOpen(false);
              }}
            >
              Mapa de Skills y Brechas
            </CommandItem>
            <CommandItem
              onSelect={() => {
                navigate("/comparar");
                setIsCommandOpen(false);
              }}
            >
              Comparar Perfiles en terna
            </CommandItem>
            <CommandItem
              onSelect={() => {
                navigate("/guardarrailes");
                setIsCommandOpen(false);
              }}
            >
              Guardarraíles y Supervisión EU AI Act
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Acciones rápidas con Copilot">
            <CommandItem
              onSelect={() => {
                setIsCommandOpen(false);
                openCopilotWithPrompt("Buscar perfiles disponibles para proyecto SAP en Repsol");
              }}
            >
              Buscar perfiles SAP para Repsol
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setIsCommandOpen(false);
                openCopilotWithPrompt("¿Qué oportunidades críticas vencen esta semana?");
              }}
            >
              Consultar oportunidades críticas urgentes
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
