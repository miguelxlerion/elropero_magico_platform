"use client";

import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, Loader2, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/label";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { subscribeSchema, type SubscribeValues } from "@/lib/validation";

type NotifyFormProps = {
  dropId?: string;
  source?: string;
  cta?: string;
  tone?: "light" | "dark";
  successText?: string;
  className?: string;
};

export function NotifyForm({
  dropId,
  source = "drop_countdown",
  cta = "Notifícame",
  tone = "light",
  successText = "Listo. Te avisaremos 1 hora antes del lanzamiento.",
  className,
}: NotifyFormProps) {
  const pillId = useId();
  const storageKey = `magco-notify-${dropId ?? "general"}-${source}`;
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(storageKey)) setDone(true);
  }, [storageKey]);

  const form = useForm<SubscribeValues>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: { channel: "email", contact: "", dropId, source },
  });
  const channel = form.watch("channel");
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; created?: boolean };
    if (!res.ok) {
      form.setError("contact", { message: data.error ?? "No pudimos registrarte, intenta de nuevo" });
      return;
    }
    window.localStorage.setItem(storageKey, "1");
    setDone(true);
    track("drop_notify_subscribed", { channel: values.channel, drop: dropId ?? "general", source });
    toast.success(data.created === false ? "Ya estabas en la lista 💚" : "¡Quedaste en la lista!", {
      description: values.channel === "email" ? "Revisa tu correo el día del drop." : "Te escribiremos por WhatsApp.",
    });
  });

  const dark = tone === "dark";

  return (
    <div className={className}>
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm",
              dark ? "bg-white/10 text-hueso" : "bg-salvia-50 text-salvia-700",
            )}
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="grid size-7 shrink-0 place-items-center rounded-full bg-salvia-500 text-white"
            >
              <Check className="size-4" strokeWidth={3} />
            </motion.span>
            {successText}
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={onSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -6 }}
            noValidate
            className="space-y-2.5"
          >
            <div
              className={cn(
                "inline-flex rounded-full p-1 text-xs font-semibold",
                dark ? "bg-white/10" : "bg-beige-100",
              )}
            >
              {(["email", "whatsapp"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    form.setValue("channel", c);
                    form.clearErrors("contact");
                  }}
                  className={cn(
                    "relative isolate inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors",
                    channel === c ? (dark ? "text-tinta" : "text-hueso") : dark ? "text-hueso/70" : "text-tinta-500",
                  )}
                >
                  {channel === c && (
                    <motion.span
                      layoutId={`notify-pill-${pillId}`}
                      className={cn("absolute inset-0 -z-10 rounded-full", dark ? "bg-hueso" : "bg-tinta")}
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  {c === "email" ? <Mail className="size-3.5" /> : <MessageCircle className="size-3.5" />}
                  {c === "email" ? "Correo" : "WhatsApp"}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                {...form.register("contact")}
                type={channel === "email" ? "email" : "tel"}
                inputMode={channel === "email" ? "email" : "numeric"}
                autoComplete={channel === "email" ? "email" : "tel"}
                placeholder={channel === "email" ? "tu@correo.com" : "313 312 9691"}
                aria-invalid={Boolean(errors.contact)}
                aria-label={channel === "email" ? "Correo electrónico" : "Número de WhatsApp"}
                className={cn(dark && "border-white/20 bg-white/10 text-hueso placeholder:text-hueso/50")}
              />
              <Button type="submit" variant={dark ? "light" : "default"} disabled={isSubmitting} className="shrink-0">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Bell />}
                {cta}
              </Button>
            </div>
            <FieldError message={errors.contact?.message} />
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
