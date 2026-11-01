import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold uppercase tracking-wider transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 [&_svg]:pointer-events-none [&_svg]:shrink-0 rounded-none",
  {
    variants: {
      variant: {
        primary: "bg-amber-400 text-slate-950 font-bold shadow-sm shadow-amber-400/25 hover:bg-amber-500 hover:shadow-md hover:shadow-amber-400/35 active:scale-[0.99] border border-amber-500/30",
        secondary: "border border-ink-border bg-ink-raised text-paper hover:bg-slate-200/60 shadow-2xs",
        outline: "border border-slate-300 bg-white/80 text-slate-900 hover:border-slate-950 hover:bg-slate-100 shadow-2xs",
        ghost: "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
        danger: "bg-danger text-white hover:bg-danger/80 shadow-xs",
        dark: "bg-slate-950 text-white shadow-xs hover:bg-black active:scale-[0.99]",
      },
      size: {
        xs: "px-2.5 py-1 text-[10px] tracking-wide",
        sm: "px-3 py-1.5 text-[11px] tracking-wider",
        md: "px-4 py-2 text-xs tracking-wider",
        lg: "px-5 py-2.5 text-xs sm:text-[13px] tracking-wider",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
