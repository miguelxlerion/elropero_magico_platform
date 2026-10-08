"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Lock, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/controls";
import { FieldError } from "@/components/ui/label";
import { useCart } from "@/hooks/useCart";
import { track } from "@/lib/analytics";
import { calculateTotals } from "@/lib/shipping";
import { cn, formatCOP } from "@/lib/utils";
import { checkoutSchema, type CheckoutValues } from "@/lib/validation";
import { OrderSummary } from "./OrderSummary";
import { PaymentSelector } from "./PaymentSelector";
import { ShippingForm } from "./ShippingForm";

type CheckoutViewProps = {
  user: { name: string; email: string; phone: string | null } | null;
  wompiEnabled: boolean;
};

const STEPS = ["Carrito", "Datos y envío", "Pago", "Confirmación"];

export function CheckoutView({ user, wompiEnabled }: CheckoutViewProps) {
  const router = useRouter();
  const { items, hydrated, subtotal, savings, removeMany, clear } = useCart();
  const [redirecting, setRedirecting] = useState(false);

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      documentType: "CC",
      documentNumber: "",
      city: "Bogotá D.C.",
      department: "Bogotá D.C.",
      address: "",
      neighborhood: "",
      notes: "",
      paymentMethod: "pse",
      acceptTerms: false,
    },
  });

  const city = form.watch("city");
  const method = form.watch("paymentMethod");
  const acceptTerms = form.watch("acceptTerms");
  const totals = calculateTotals(subtotal, city, method);
  const { isSubmitting, errors } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    track("begin_checkout", { value: totals.total, items: items.length, method: values.paymentMethod });
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, items: items.map((i) => i.id) }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      reference?: string;
      redirectUrl?: string;
      provider?: "wompi" | "sandbox" | "cod";
      error?: string;
      unavailable?: string[];
    };
    if (res.status === 409 && data.unavailable) {
      removeMany(data.unavailable);
      toast.error("Alguien se te adelantó", {
        description: "Quitamos de tu carrito las piezas que ya no están disponibles.",
      });
      return;
    }
    if (!res.ok || !data.redirectUrl) {
      toast.error(data.error ?? "No pudimos crear tu pedido. Intenta de nuevo.");
      return;
    }
    track("order_created", { reference: data.reference ?? "", value: totals.total, method: values.paymentMethod });
    setRedirecting(true);
    clear();
    if (data.provider === "wompi") window.location.href = data.redirectUrl;
    else router.push(data.redirectUrl);
  });

  if (!hydrated) return <div className="min-h-[60vh]" />;

  if (!items.length && !redirecting) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
        <ShoppingBag className="size-8 text-tinta-400" />
        <h1 className="mt-4 font-display text-4xl">No hay piezas para pagar</h1>
        <Button asChild className="mt-6">
          <Link href="/catalogo">Volver al catálogo</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ol className="mb-10 flex flex-wrap items-center gap-2 text-xs font-semibold">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-3 py-1.5",
                i === 0 ? "bg-salvia-100 text-salvia-700" : i <= 2 ? "bg-tinta text-hueso" : "bg-beige-100 text-tinta-400",
              )}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-border" />}
          </li>
        ))}
      </ol>

      <FormProvider {...form}>
        <form onSubmit={onSubmit} noValidate className="grid gap-12 lg:grid-cols-[1fr_400px]">
          <div className="space-y-12">
            <ShippingForm subtotal={subtotal} />
            <PaymentSelector
              value={method}
              onChange={(v) => form.setValue("paymentMethod", v, { shouldValidate: true })}
              wompiEnabled={wompiEnabled}
            />
            <div>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-tinta-600">
                <Checkbox
                  checked={acceptTerms}
                  onCheckedChange={(v) => form.setValue("acceptTerms", v === true, { shouldValidate: true })}
                  className="mt-0.5"
                  aria-invalid={Boolean(errors.acceptTerms)}
                />
                <span>
                  Acepto los términos de compra y autorizo el tratamiento de mis datos personales según la Ley 1581 de
                  2012 (Habeas Data).
                </span>
              </label>
              <FieldError message={errors.acceptTerms?.message} />
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-32 lg:self-start">
            <OrderSummary items={items} totals={totals} method={method} savings={savings} />
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || redirecting}>
              {isSubmitting || redirecting ? (
                <>
                  <Loader2 className="animate-spin" /> Procesando…
                </>
              ) : method === "cod" ? (
                <>
                  Confirmar pedido · {formatCOP(totals.total)} <ArrowRight />
                </>
              ) : (
                <>
                  <Lock /> Pagar {formatCOP(totals.total)}
                </>
              )}
            </Button>
            <p className="text-center text-xs text-tinta-400">
              Tus piezas quedan reservadas 30 minutos mientras completas el pago.
            </p>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
