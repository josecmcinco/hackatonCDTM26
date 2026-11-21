import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-[28px] md:text-[40px] font-semibold tracking-tight text-foreground leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
