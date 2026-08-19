import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-neutral-100 text-neutral-900 shadow hover:bg-neutral-100/80",
        secondary:
          "border-transparent bg-neutral-800 text-neutral-200 hover:bg-neutral-800/80",
        destructive:
          "border-transparent bg-red-900/50 text-red-300 border-red-800 hover:bg-red-900/80",
        outline: "text-neutral-300 border-neutral-700",
        success:
          "border-emerald-800 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-950/80",
        warning:
          "border-amber-800 bg-amber-950/60 text-amber-300 hover:bg-amber-950/80",
        info: "border-blue-800 bg-blue-950/60 text-blue-300 hover:bg-blue-950/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
