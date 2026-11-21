import { useTheme } from "next-themes";
import { Search, Sun, Moon, EyeOff, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useApp } from "@/providers/AppContext";

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const { blindMode, setBlindMode, setIsCommandOpen } = useApp();

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border/60 bg-surface/80 backdrop-blur-md px-8 md:px-12">
      {/* 1. Command Palette Trigger */}
      <button
        type="button"
        onClick={() => setIsCommandOpen(true)}
        className="flex items-center gap-2.5 rounded-[10px] border border-border bg-neutral-100/60 dark:bg-neutral-800/60 px-3.5 py-1.5 text-xs text-muted-foreground hover:border-brand/40 hover:bg-neutral-100 transition-colors w-64 md:w-80"
        aria-label="Abrir buscador y comandos"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Buscar oportunidades o skills...</span>
        <kbd className="pointer-events-none rounded bg-surface border border-border px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      {/* Right controls: Theme toggle + Avatar Menu with Blind Mode switch */}
      <div className="flex items-center gap-3">
        {/* 2. Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-9 w-9 rounded-[10px] text-muted-foreground hover:text-foreground"
          aria-label="Alternar modo oscuro"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* 3. Avatar Menu containing Blind Mode */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 p-0.5"
              aria-label="Menú de usuario y privacidad"
            >
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="bg-brand/10 text-brand text-xs font-semibold">
                  AR
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64 p-2 shadow-lg">
            <DropdownMenuLabel className="font-normal p-2">
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-semibold text-foreground">Alba Ruiz</p>
                <p className="text-xs text-muted-foreground">Staffing Manager · NTT DATA</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Blind Mode Toggle */}
            <div className="flex items-center justify-between p-2 rounded-[8px] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <div className="flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground">
                    Modo ciego
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Anonimizar nombres y fotos
                  </span>
                </div>
              </div>
              <Switch
                checked={blindMode}
                onCheckedChange={setBlindMode}
                aria-label="Activar modo ciego"
              />
            </div>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs gap-2 py-2 cursor-pointer"
              onClick={() => (window.location.href = "/guardarrailes")}
            >
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Verificación de imparcialidad</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
