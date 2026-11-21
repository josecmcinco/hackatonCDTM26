import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function EmptyState({
  title = "No hay registros disponibles",
  description = "No se encontraron resultados para los criterios seleccionados.",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center rounded-[16px] border border-dashed border-border bg-surface/50",
        className
      )}
    >
      <div className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-muted-foreground mb-3">
        <Inbox className="h-5 w-5" />
      </div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground max-w-sm mt-1">
        {description}
      </p>
    </div>
  );
}
