import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useApp } from "@/providers/AppContext";
import { cn } from "@/lib/utils";

interface PersonAvatarProps {
  name: string;
  initials: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PersonAvatar({
  initials,
  size = "md",
  className,
}: PersonAvatarProps) {
  const { blindMode } = useApp();

  const sizeClasses = {
    sm: "h-7 w-7 text-[11px]",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-sm",
  };

  return (
    <Avatar className={cn(sizeClasses[size], "border border-border/60", className)}>
      <AvatarFallback
        className={cn(
          "font-semibold",
          blindMode
            ? "bg-neutral-200 dark:bg-neutral-800 text-muted-foreground"
            : "bg-brand/10 text-brand"
        )}
      >
        {blindMode ? "••" : initials}
      </AvatarFallback>
    </Avatar>
  );
}

export function PersonName({
  name,
  id,
  className,
}: {
  name: string;
  id?: string;
  className?: string;
}) {
  const { blindMode } = useApp();

  if (blindMode) {
    return (
      <span className={cn("font-medium text-foreground tracking-tight", className)}>
        Candidato anónimo {id ? `#${id.replace('prof-', '').replace('cand-', '')}` : ''}
      </span>
    );
  }

  return (
    <span className={cn("font-medium text-foreground", className)}>
      {name}
    </span>
  );
}
