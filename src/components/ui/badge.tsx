import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        gold: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
        emerald: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
        neutral: "bg-slate-100 text-slate-600 border border-slate-200",
        danger: "bg-rose-50 text-rose-700 border border-rose-200/80",
        success: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
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
