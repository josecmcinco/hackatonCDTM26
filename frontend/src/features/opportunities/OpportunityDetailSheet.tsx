import { Opportunity } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/shared/StatusDot";
import { SkillChips } from "@/components/shared/SkillChips";
import { MatchRing } from "@/components/shared/MatchRing";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Building, ArrowRight } from "lucide-react";

interface OpportunityDetailSheetProps {
  opportunity: Opportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OpportunityDetailSheet({
  opportunity,
  open,
  onOpenChange,
}: OpportunityDetailSheetProps) {
  const navigate = useNavigate();

  if (!opportunity) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg space-y-6">
        <SheetHeader className="text-left space-y-2">
          <div className="flex items-center justify-between">
            <StatusDot status={opportunity.urgency} />
            <span className="text-xs text-muted-foreground">
              Abierta el {opportunity.openedAt}
            </span>
          </div>
          <SheetTitle className="text-[20px] font-semibold text-foreground">
            {opportunity.title}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>{opportunity.client}</span>
            <span>·</span>
            <span>{opportunity.sector}</span>
          </SheetDescription>
        </SheetHeader>

        {/* Highlight Score & Key Meta */}
        <div className="flex items-center justify-between p-4 rounded-[12px] bg-neutral-50 dark:bg-neutral-900 border border-border">
          <div>
            <p className="text-xs text-muted-foreground">Mejor afinidad calculada</p>
            <p className="text-xs font-semibold text-brand mt-0.5">
              Candidato compatible disponible
            </p>
          </div>
          <MatchRing score={opportunity.bestMatchScore} size={54} />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Descripción del proyecto
          </h4>
          <p className="text-sm text-foreground leading-relaxed">
            {opportunity.description}
          </p>
        </div>

        {/* Metadata Details */}
        <div className="grid grid-cols-2 gap-4 py-2 border-y border-border/60 text-xs">
          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Ubicación
            </span>
            <p className="font-medium text-foreground">
              {opportunity.location} ({opportunity.modality})
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Fecha límite
            </span>
            <p className="font-medium text-foreground">
              {opportunity.deadline}
            </p>
          </div>
        </div>

        {/* Required Skills */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Competencias requeridas
          </h4>
          <SkillChips skills={opportunity.mustHaveSkills} maxVisible={5} />
        </div>

        {/* Direct Action */}
        <div className="pt-4">
          <Button
            variant="default"
            className="w-full gap-2 shadow-soft"
            onClick={() => {
              onOpenChange(false);
              navigate(`/oportunidades/${opportunity.id}`);
            }}
          >
            <span>Analizar coincidencias explicables</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
