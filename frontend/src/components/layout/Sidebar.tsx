import { NavLink } from "react-router-dom";
import {
  Home,
  Briefcase,
  Sparkles,
  Columns,
  ShieldCheck,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useApp } from "@/providers/AppContext";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/oportunidades", label: "Oportunidades", icon: Briefcase },
  { to: "/skills", label: "Skills", icon: Sparkles },
  { to: "/comparar", label: "Comparar", icon: Columns },
  { to: "/guardarrailes", label: "Guardarraíles", icon: ShieldCheck },
];

export function Sidebar() {
  const { mode, setMode } = useApp();

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-30 flex w-64 flex-col border-r border-border bg-surface">
      {/* Brand header */}
      <div className="flex h-16 items-center px-6 border-b border-border/50">
        <div className="flex items-center gap-2">
          {/* NTT DATA Wordmark placeholder */}
          <span className="font-bold tracking-tight text-lg text-foreground">
            NTT <span className="text-brand">DATA</span>
          </span>
          <span className="text-xs text-muted-foreground ml-1.5 font-normal">
            Talent Intel
          </span>
        </div>
      </div>

      {/* Navigation (max 5 items, icon + label only) */}
      <nav className="flex-1 space-y-1.5 px-3 py-6" aria-label="Navegación principal">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3.5 rounded-[10px] px-3.5 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand/10 text-brand font-semibold"
                    : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-foreground"
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Mode Switcher */}
      <div className="p-4 border-t border-border/50 space-y-2">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-1">
          Modalidad de análisis
        </div>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(val) => {
            if (val) setMode(val as 'staffing' | 'recruitment');
          }}
          className="w-full justify-stretch grid grid-cols-2 bg-neutral-100 dark:bg-neutral-900 rounded-[10px] p-1"
        >
          <ToggleGroupItem
            value="staffing"
            className="text-xs py-1 data-[state=on]:bg-surface data-[state=on]:shadow-sm rounded-[8px]"
          >
            Staffing
          </ToggleGroupItem>
          <ToggleGroupItem
            value="recruitment"
            className="text-xs py-1 data-[state=on]:bg-surface data-[state=on]:shadow-sm rounded-[8px]"
          >
            Selección
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </aside>
  );
}
