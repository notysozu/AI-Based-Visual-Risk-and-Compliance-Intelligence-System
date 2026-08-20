import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold cursor-pointer transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[var(--clay-btn-primary)] hover:-translate-y-0.5 active:translate-y-0.5 border border-white/20",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[var(--clay-btn-primary)] hover:-translate-y-0.5 active:translate-y-0.5 border border-white/20",
        outline:
          "border border-border bg-card text-foreground shadow-[var(--clay-shadow-sm)] hover:shadow-[var(--clay-shadow)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[var(--clay-inset)]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[var(--clay-shadow-sm)] hover:shadow-[var(--clay-shadow)] hover:-translate-y-0.5 active:translate-y-0.5 border border-border/40",
        ghost:
          "hover:bg-accent/70 hover:shadow-[var(--clay-shadow-sm)] text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-2xl px-6 text-base font-semibold",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
