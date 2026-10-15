"use client";

import { useFormContext } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Truck, Zap } from "lucide-react";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { CITIES, getShippingQuote } from "@/lib/shipping";
import { cn, formatCOP } from "@/lib/utils";
import type { CheckoutValues } from "@/lib/validation";

function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

export function ShippingForm({ subtotal }: { subtotal: number }) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CheckoutValues>();
  const city = watch("city");
  const quote = getShippingQuote(city, subtotal);

  return (
    <div className="space-y-10">
      <fieldset className="space-y-5">
        <legend className="mb-5 flex items-center gap-3 font-display text-2xl">
          <span className="grid size-8 place-items-center rounded-full bg-tinta font-sans text-sm text-hueso">1</span>
          Tus datos
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nombre completo" error={errors.fullName?.message} className="sm:col-span-2">
            <Input {...register("fullName")} autoComplete="name" placeholder="Valentina Ospina" aria-invalid={Boolean(errors.fullName)} />
          </Field>
          <Field label="Correo electrónico" error={errors.email?.message}>
            <Input {...register("email")} type="email" autoComplete="email" placeholder="tu@correo.com" aria-invalid={Boolean(errors.email)} />
          </Field>
          <Field label="Celular (WhatsApp)" error={errors.phone?.message}>
            <Input {...register("phone")} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="3133129691" aria-invalid={Boolean(errors.phone)} />
          </Field>
          <Field label="Tipo de documento" error={errors.documentType?.message}>
            <NativeSelect {...register("documentType")}>
              <option value="CC">Cédula de ciudadanía</option>
              <option value="CE">Cédula de extranjería</option>
              <option value="NIT">NIT</option>
              <option value="PP">Pasaporte</option>
            </NativeSelect>
          </Field>
          <Field label="Número de documento" error={errors.documentNumber?.message}>
            <Input {...register("documentNumber")} inputMode="numeric" placeholder="1020304050" aria-invalid={Boolean(errors.documentNumber)} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="mb-5 flex items-center gap-3 font-display text-2xl">
          <span className="grid size-8 place-items-center rounded-full bg-tinta font-sans text-sm text-hueso">2</span>
          Envío
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Ciudad" error={errors.city?.message}>
            <NativeSelect
              {...register("city", {
                onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                  const match = CITIES.find((c) => c.name === e.target.value);
                  if (match) setValue("department", match.department, { shouldValidate: true });
                },
              })}
            >
              {CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Departamento" error={errors.department?.message}>
            <Input {...register("department")} readOnly className="bg-beige-50" />
          </Field>
          <Field label="Dirección" error={errors.address?.message} className="sm:col-span-2">
            <Input {...register("address")} autoComplete="street-address" placeholder="Carrera 7 # 45-10, apto 302" aria-invalid={Boolean(errors.address)} />
          </Field>
          <Field label="Barrio (opcional)" error={errors.neighborhood?.message}>
            <Input {...register("neighborhood")} placeholder="Chapinero Alto" />
          </Field>
          <Field label="Indicaciones (opcional)" error={errors.notes?.message}>
            <Textarea {...register("notes")} rows={1} className="min-h-11" placeholder="Portería, horario…" />
          </Field>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${quote.zone}-${quote.cost}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "flex items-start gap-4 rounded-2xl p-4",
              quote.zone === "bogota" ? "bg-salvia-50 text-salvia-700" : "bg-beige-50 text-tinta-700",
            )}
          >
            {quote.zone === "bogota" ? <Zap className="mt-0.5 size-5" /> : <Truck className="mt-0.5 size-5" />}
            <div className="flex-1 text-sm">
              <p className="font-semibold">{quote.label}</p>
              <p className="opacity-80">{quote.eta}</p>
              {quote.zone === "bogota" && !quote.freeApplied && (
                <p className="mt-1 text-xs opacity-70">Gratis en compras desde {formatCOP(350_000)}</p>
              )}
            </div>
            <p className="text-right font-semibold">
              {quote.freeApplied ? (
                <>
                  <span className="block text-xs font-normal line-through opacity-60">{formatCOP(quote.baseCost)}</span>
                  Gratis
                </>
              ) : (
                formatCOP(quote.cost)
              )}
            </p>
          </motion.div>
        </AnimatePresence>
        <p className="flex items-center gap-2 text-xs text-tinta-400">
          <MapPin className="size-3.5" /> Enviamos a todo Colombia. Fuera de las ciudades listadas, elige la más cercana y
          lo coordinamos por WhatsApp.
        </p>
      </fieldset>
    </div>
  );
}
