import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message = "Ha ocurrido un error al cargar la información.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center rounded-[16px] border border-danger/20 bg-danger/5",
        className
      )}
    >
      <div className="h-10 w-10 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-3">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h4 className="text-sm font-semibold text-foreground">Error de carga</h4>
      <p className="text-xs text-muted-foreground max-w-sm mt-1">{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          className="mt-4 gap-2"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reintentar</span>
        </Button>
      )}
    </div>
  );
}
