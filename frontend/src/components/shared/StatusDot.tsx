import { cn } from "@/lib/utils";

type StatusType = 'open' | 'matching' | 'shortlist' | 'staffed' | 'approved' | 'rejected' | 'critical' | 'high' | 'medium' | 'low';

interface StatusDotProps {
  status: StatusType | string;
  label?: string;
  className?: string;
}

const statusMap: Record<string, { colorClass: string; defaultLabel: string }> = {
  open: { colorClass: "bg-brand", defaultLabel: "Abierta" },
  matching: { colorClass: "bg-warning", defaultLabel: "Buscando afinidad" },
  shortlist: { colorClass: "bg-brand", defaultLabel: "En terna" },
  staffed: { colorClass: "bg-success", defaultLabel: "Cubierta" },
  approved: { colorClass: "bg-success", defaultLabel: "Aprobado" },
  rejected: { colorClass: "bg-danger", defaultLabel: "Descartado" },
  critical: { colorClass: "bg-danger", defaultLabel: "Crítica" },
  high: { colorClass: "bg-warning", defaultLabel: "Alta" },
  medium: { colorClass: "bg-chart-muted", defaultLabel: "Media" },
  low: { colorClass: "bg-chart-muted", defaultLabel: "Baja" },
};

export function StatusDot({ status, label, className }: StatusDotProps) {
  const config = statusMap[status.toLowerCase()] || {
    colorClass: "bg-muted-foreground",
    defaultLabel: status,
  };

  return (
    <span className={cn("inline-flex items-center gap-2 text-xs font-normal text-muted-foreground", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.colorClass)} />
      <span className="text-foreground">{label || config.defaultLabel}</span>
    </span>
  );
}
