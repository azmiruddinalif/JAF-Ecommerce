import * as React from "react";
import { cn } from "@/lib/cn";

export interface ProgressProps extends React.ComponentProps<"div"> {
  value?: number;
  indicatorClassName?: string;
}

export function Progress({
  className,
  value = 0,
  indicatorClassName,
  ...props
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      data-slot="progress"
      className={cn("relative h-2 w-full overflow-hidden bg-ink-raised", className)}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className={cn("h-full bg-gold-bright transition-all duration-300", indicatorClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

