import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SkillChipsProps {
  skills: string[];
  maxVisible?: number;
  className?: string;
}

export function SkillChips({
  skills,
  maxVisible = 2,
  className,
}: SkillChipsProps) {
  const [open, setOpen] = useState(false);
  const visible = skills.slice(0, maxVisible);
  const hidden = skills.slice(maxVisible);

  return (
    <div className={cn("inline-flex items-center gap-1.5 flex-nowrap", className)}>
      {visible.map((skill) => (
        <Badge
          key={skill}
          variant="secondary"
          className="truncate max-w-[140px] font-normal text-xs py-0.5 px-2 bg-neutral-100 dark:bg-neutral-800 text-foreground border-border"
        >
          {skill}
        </Badge>
      ))}

      {hidden.length > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center rounded-full bg-neutral-100 dark:bg-neutral-800 border border-border px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              +{hidden.length}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 shadow-md" align="start">
            <p className="text-xs font-semibold text-muted-foreground mb-1.5 px-1">
              Habilidades requeridas
            </p>
            <div className="flex flex-wrap gap-1">
              {skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="text-xs font-normal bg-neutral-100 dark:bg-neutral-800 border-border"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
