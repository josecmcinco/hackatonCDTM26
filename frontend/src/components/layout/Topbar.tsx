import { useTheme } from "next-themes";
import { Sun, Moon, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/providers/AppContext";

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const { blindMode, setBlindMode } = useApp();

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border/60 bg-surface/80 backdrop-blur-md px-8 md:px-12">
      <div className="flex items-center gap-2">
        <span className="font-bold tracking-tight text-lg text-foreground">
          NTT <span className="text-brand">DATA</span>
        </span>
        <span className="text-xs text-muted-foreground ml-1.5 font-normal">
          Talent Matcher
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <EyeOff className="h-3.5 w-3.5" />
          <span>Modo ciego</span>
          <Switch
            checked={blindMode}
            onCheckedChange={setBlindMode}
            aria-label="Activar modo ciego"
          />
        </div>

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
      </div>
    </header>
  );
}
