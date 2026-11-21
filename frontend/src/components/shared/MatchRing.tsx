import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { cn } from "@/lib/utils";

interface MatchRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showPercent?: boolean;
}

export function MatchRing({
  score,
  size = 52,
  strokeWidth = 4.5,
  className,
  showPercent = true,
}: MatchRingProps) {
  // Brand color for high affinity
  const primaryColor =
    score >= 90
      ? "var(--brand)"
      : score >= 80
      ? "var(--brand)"
      : "var(--muted-foreground)";

  return (
    <div className={cn("inline-flex items-center justify-center", className)}>
      <AnimatedCircularProgressBar
        value={score}
        size={size}
        strokeWidth={strokeWidth}
        gaugePrimaryColor={primaryColor}
        gaugeSecondaryColor="var(--border)"
        showPercent={showPercent}
      />
    </div>
  );
}
