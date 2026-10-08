import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-tinta text-hueso",
        sage: "bg-salvia-600 text-white",
        soft: "bg-salvia-100 text-salvia-700",
        beige: "bg-beige-100 text-tinta-700",
        outline: "border border-tinta/15 text-tinta-700",
        glass: "bg-white/80 text-tinta backdrop-blur-md",
        warning: "bg-amber-50 text-amber-900",
        danger: "bg-orange-50 text-terracota",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
