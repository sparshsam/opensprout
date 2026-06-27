import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:brightness-110",
        secondary:
          "bg-muted text-foreground hover:bg-muted/80 dark:hover:bg-muted",
        outline:
          "border border-border bg-white text-foreground hover:bg-muted dark:bg-background dark:hover:bg-muted",
        ghost:
          "text-foreground hover:bg-muted",
        danger:
          "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20",
      },
      size: {
        default: "px-7 py-3.5 min-h-[44px]",
        sm: "px-5 py-2.5 min-h-[40px]",
        icon: "h-11 w-11 px-0",
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
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  ),
);

Button.displayName = "Button";
