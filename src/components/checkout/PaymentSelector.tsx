"use client";

import * as RadioGroup from "@radix-ui/react-radio-group";
import { motion } from "framer-motion";
import { Check, FlaskConical, Lock } from "lucide-react";
import { PAYMENT_METHODS } from "@/lib/payments";
import { SHIPPING_RULES } from "@/lib/shipping";
import { cn, formatCOP } from "@/lib/utils";
import type { PaymentMethod } from "@/types/order";

type PaymentSelectorProps = {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  wompiEnabled: boolean;
};

export function PaymentSelector({ value, onChange, wompiEnabled }: PaymentSelectorProps) {
  return (
    <fieldset>
      <legend className="mb-5 flex items-center gap-3 font-display text-2xl">
        <span className="grid size-8 place-items-center rounded-full bg-tinta font-sans text-sm text-hueso">3</span>
        Método de pago
      </legend>
      <RadioGroup.Root
        value={value}
        onValueChange={(v) => onChange(v as PaymentMethod)}
        className="grid gap-3"
        aria-label="Método de pago"
      >
        {PAYMENT_METHODS.map((m) => {
          const active = value === m.id;
          return (
            <RadioGroup.Item
              key={m.id}
              value={m.id}
              className={cn(
                "relative isolate flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-salvia-200",
                active ? "border-tinta" : "border-border hover:border-tinta/30",
              )}
            >
              {active && (
                <motion.span
                  layoutId="payment-active"
                  className="absolute inset-0 -z-10 rounded-2xl bg-white shadow-[0_20px_40px_-30px_rgba(21,20,18,0.5)]"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
              <span className={cn("grid h-9 min-w-12 place-items-center rounded-lg px-2 text-xs font-bold", m.markClass)}>
                {m.mark}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  {m.label}
                  {m.id === "cod" && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-900">
                      +{formatCOP(SHIPPING_RULES.codFee)}
                    </span>
                  )}
                </span>
                <span className="block text-xs text-tinta-500">{m.description}</span>
                <span className="block text-[0.7rem] text-tinta-400">{m.detail}</span>
              </span>
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border transition",
                  active ? "border-tinta bg-tinta text-hueso" : "border-tinta/25",
                )}
              >
                <RadioGroup.Indicator>
                  <Check className="size-3" strokeWidth={3} />
                </RadioGroup.Indicator>
              </span>
            </RadioGroup.Item>
          );
        })}
      </RadioGroup.Root>

      <div className="mt-4 space-y-2 text-xs text-tinta-500">
        <p className="flex items-start gap-2">
          <Lock className="mt-0.5 size-3.5 shrink-0 text-salvia-600" />
          {value === "cod"
            ? "Confirmamos tu pedido por WhatsApp antes de despacharlo. El recargo cubre el manejo de efectivo de la transportadora."
            : "Serás redirigida al checkout seguro de Wompi (Bancolombia) para completar el pago. No guardamos datos de tarjetas."}
        </p>
        {!wompiEnabled && value !== "cod" && (
          <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-amber-900">
            <FlaskConical className="mt-0.5 size-3.5 shrink-0" />
            Modo sandbox: las llaves de Wompi no están configuradas, así que el pago se simulará en la página del pedido.
          </p>
        )}
      </div>
    </fieldset>
  );
}
