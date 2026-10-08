"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

const sideClasses = {
  right:
    "inset-y-0 right-0 h-full w-full max-w-md border-l data-[state=closed]:animate-slide-out-right data-[state=open]:animate-slide-in-right",
  left: "inset-y-0 left-0 h-full w-full max-w-sm border-r data-[state=closed]:animate-slide-out-left data-[state=open]:animate-slide-in-left",
  bottom:
    "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-3xl border-t data-[state=closed]:animate-slide-out-bottom data-[state=open]:animate-slide-in-bottom",
} as const;

function SheetContent({
  side = "right",
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { side?: keyof typeof sideClasses }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-tinta/35 backdrop-blur-[2px] data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 flex flex-col border-border bg-hueso shadow-[0_0_80px_-20px_rgba(21,20,18,0.45)]",
          sideClasses[side],
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-beige-100/70 text-tinta-500 transition hover:bg-beige-200 hover:text-tinta">
          <X className="size-4" />
          <span className="sr-only">Cerrar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("border-b border-border px-6 pb-4 pt-6 pr-16", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("font-display text-2xl font-medium", className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm text-tinta-500", className)} {...props} />;
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription };
