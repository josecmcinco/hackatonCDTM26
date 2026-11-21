import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCircularProgressBarProps {
  max?: number;
  min?: number;
  value: number;
  gaugePrimaryColor?: string;
  gaugeSecondaryColor?: string;
  className?: string;
  size?: number;
  strokeWidth?: number;
  showPercent?: boolean;
}

export function AnimatedCircularProgressBar({
  max = 100,
  min = 0,
  value = 0,
  gaugePrimaryColor = "var(--brand)",
  gaugeSecondaryColor = "var(--border)",
  className,
  size = 56,
  strokeWidth = 5,
  showPercent = true,
}: AnimatedCircularProgressBarProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [currentVal, setCurrentVal] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentVal(value);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  const percentage = Math.min(Math.max((currentVal - min) / (max - min), 0), 1);
  const strokeDashoffset = circumference - percentage * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center font-semibold tabular-nums", className)}
      style={{ width: size, height: size }}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      role="progressbar"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 transform"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={gaugeSecondaryColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={gaugePrimaryColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {showPercent && (
        <span className="absolute text-xs font-semibold text-foreground">
          {Math.round(currentVal)}%
        </span>
      )}
    </div>
  );
}
