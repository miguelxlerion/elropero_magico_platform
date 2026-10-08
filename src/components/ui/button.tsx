import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-wide transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-tinta text-hueso shadow-[0_10px_30px_-12px_rgba(21,20,18,0.55)] hover:bg-tinta-700",
        sage: "bg-salvia-600 text-white shadow-[0_10px_30px_-14px_rgba(71,86,61,0.8)] hover:bg-salvia-700",
        secondary: "bg-beige-100 text-tinta hover:bg-beige-200",
        outline: "border border-tinta/15 bg-transparent text-tinta hover:border-tinta/40 hover:bg-beige-50",
        ghost: "text-tinta hover:bg-beige-100",
        light: "bg-hueso text-tinta hover:bg-white",
        link: "h-auto rounded-none px-0 text-tinta underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        default: "h-11 px-6",
        lg: "h-13 px-8 text-[0.95rem]",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
