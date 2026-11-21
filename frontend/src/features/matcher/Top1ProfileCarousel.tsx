import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/providers/AppContext";
import type { CandidateMatch, RoleMatchGroup } from "@/types";

interface Top1ProfileCarouselProps {
  roleMatches: RoleMatchGroup[];
  onViewCandidate?: (roleId: string, candidate: CandidateMatch) => void;
}

const INVENTED_PORTRAITS = [
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/68.jpg",
  "https://randomuser.me/api/portraits/men/75.jpg",
  "https://randomuser.me/api/portraits/women/26.jpg",
  "https://randomuser.me/api/portraits/men/52.jpg",
];

function getPortraitUrl(employeeId: string, index: number): string {
  const hash = employeeId
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), index);
  return INVENTED_PORTRAITS[hash % INVENTED_PORTRAITS.length];
}

export function Top1ProfileCarousel({
  roleMatches,
  onViewCandidate,
}: Top1ProfileCarouselProps) {
  const { blindMode } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const items = roleMatches
    .map((group, index) => ({
      group,
      top1: group.matches[0] ?? null,
      index,
    }))
    .filter(
      (
        entry,
      ): entry is { group: RoleMatchGroup; top1: CandidateMatch; index: number } =>
        entry.top1 !== null,
    );

  if (items.length === 0) return null;

  function scrollToCard(idx: number) {
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    setActiveIndex(clamped);
    const container = scrollRef.current;
    if (!container) return;
    const cardEl = container.children[clamped] as HTMLElement | undefined;
    if (cardEl) {
      cardEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative flex items-center gap-2">
        {/* Left Arrow */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Anterior candidato"
          onClick={() => scrollToCard(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="hidden h-10 w-10 shrink-0 rounded-full text-brand hover:bg-brand/10 disabled:opacity-30 sm:flex"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        {/* Horizontal Sliding Cards */}
        <div
          ref={scrollRef}
          className="flex w-full gap-5 overflow-x-auto scroll-smooth py-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map(({ group, top1, index }) => {
            const displayName = blindMode
              ? `Candidato ${top1.employee_id}`
              : top1.nombre_completo;
            const portraitUrl = getPortraitUrl(top1.employee_id, index);
            const showFallback = blindMode || failedImages[top1.employee_id];
            const topSkills = top1.skills
              .slice(0, 3)
              .map((s) => s.skill)
              .join(" · ");

            return (
              <div
                key={group.roleId}
                className="flex w-[275px] shrink-0 snap-center flex-col overflow-hidden rounded-[22px] border border-border bg-surface shadow-soft transition-transform duration-200 hover:-translate-y-0.5 sm:w-[290px]"
              >
                {/* Blue curved top header */}
                <div className="relative flex flex-col items-center justify-center bg-brand px-4 pb-6 pt-6">
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-5 rounded-tl-[24px] bg-surface" />

                  <Badge className="absolute right-3 top-3 border border-white/25 bg-white/15 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/20 tabular-nums">
                    {top1.matchScore}% match
                  </Badge>

                  <div className="relative z-10 h-24 w-24 overflow-hidden rounded-full border-[3.5px] border-white bg-white/15 shadow-md ring-2 ring-white/30">
                    {showFallback ? (
                      <div className="flex h-full w-full items-center justify-center bg-white/15 text-xl font-bold text-white">
                        {blindMode ? top1.employee_id.slice(-2) : top1.initials}
                      </div>
                    ) : (
                      <img
                        src={portraitUrl}
                        alt={displayName}
                        onError={() =>
                          setFailedImages((prev) => ({
                            ...prev,
                            [top1.employee_id]: true,
                          }))
                        }
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                </div>

                {/* Lower card body */}
                <div className="flex flex-1 flex-col items-center justify-between px-5 pb-5 pt-1 text-center">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      {displayName}
                    </h3>
                    <p className="text-xs font-medium text-brand">
                      {group.roleName}
                    </p>
                    <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                      {top1.nivel_seniority} · {top1.anios_experiencia} años
                      exp. · {top1.disponibilidad}.{" "}
                      {topSkills ? `Skills: ${topSkills}.` : ""}
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onViewCandidate?.(group.roleId, top1)}
                    className="mt-4 w-36 rounded-lg bg-brand text-xs font-medium text-white shadow-sm hover:bg-brand/90"
                  >
                    Ver más
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Siguiente candidato"
          onClick={() => scrollToCard(activeIndex + 1)}
          disabled={activeIndex >= items.length - 1}
          className="hidden h-10 w-10 shrink-0 rounded-full text-brand hover:bg-brand/10 disabled:opacity-30 sm:flex"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Pagination dots */}
      <div className="flex items-center justify-center gap-1.5">
        {items.map((item, idx) => (
          <button
            key={item.group.roleId}
            type="button"
            aria-label={`Ir a ${item.group.roleName}`}
            onClick={() => scrollToCard(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === activeIndex
                ? "w-5 bg-brand"
                : "w-2 bg-brand/30 hover:bg-brand/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
