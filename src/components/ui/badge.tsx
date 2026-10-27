import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
  {
    variants: {
      variant: {
        gold: "bg-gold-bright text-ink",
        emerald: "bg-success text-ink",
        neutral: "bg-ink-raised text-paper border border-ink-border",
        danger: "bg-danger/15 text-danger border border-danger/40",
        success: "bg-success/15 text-success border border-success/40",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
