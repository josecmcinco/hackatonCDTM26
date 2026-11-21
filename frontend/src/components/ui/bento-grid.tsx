import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoCard = ({
  className,
  name,
  classNameHeader,
  background,
  Icon,
  description,
  href,
  cta,
}: {
  className?: string;
  name: string;
  classNameHeader?: string;
  background?: ReactNode;
  Icon?: React.ComponentType<{ className?: string }>;
  description: string;
  href?: string;
  cta?: string;
}) => (
  <div
    key={name}
    className={cn(
      "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-[16px] bg-surface border border-border p-6 shadow-soft transition-all duration-300 hover:shadow-md",
      className
    )}
  >
    <div className={classNameHeader}>{background}</div>
    <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 transition-all duration-300">
      {Icon && <Icon className="h-6 w-6 text-brand" />}
      <h3 className="text-[20px] font-semibold text-foreground">
        {name}
      </h3>
      <p className="max-w-lg text-sm text-muted-foreground">{description}</p>
    </div>
    {cta && (
      <div className="z-10 mt-4 flex items-center gap-2 text-xs font-semibold text-brand">
        <a href={href} className="underline-offset-4 hover:underline">
          {cta}
        </a>
      </div>
    )}
  </div>
);
