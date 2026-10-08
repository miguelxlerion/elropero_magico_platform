"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/controls";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { track } from "@/lib/analytics";
import { loginSchema, registerSchema, type LoginValues, type RegisterValues } from "@/lib/validation";

function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pr-11" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-tinta-400 hover:text-tinta"
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function LoginForm({ next, demo }: { next?: string; demo: { email: string; password: string } }) {
  const router = useRouter();
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; user?: { name: string; role: string } };
    if (!res.ok) {
      form.setError("password", { message: data.error ?? "No pudimos iniciar sesión" });
      return;
    }
    track("login", { role: data.user?.role ?? "customer" });
    toast.success(`¡Hola de nuevo, ${data.user?.name.split(" ")[0] ?? ""}!`);
    router.push(next ?? (data.user?.role === "admin" ? "/admin/dashboard" : "/"));
    router.refresh();
  });

  return (
    <div>
      <h1 className="font-display text-5xl">Ingresar</h1>
      <p className="mt-2 text-tinta-500">Sigue tus pedidos y recibe acceso anticipado a los drops.</p>
      <form onSubmit={onSubmit} noValidate className="mt-10 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} aria-invalid={Boolean(errors.email)} />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <PasswordInput id="password" autoComplete="current-password" {...form.register("password")} aria-invalid={Boolean(errors.password)} />
          <FieldError message={errors.password?.message} />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />} Ingresar
        </Button>
      </form>
      <div className="mt-6 rounded-2xl border border-dashed border-salvia-300 bg-salvia-50 p-4 text-sm text-salvia-700">
        <p className="flex items-center gap-2 font-semibold">
          <KeyRound className="size-4" /> Acceso demo al panel admin
        </p>
        <p className="mt-1 font-mono text-xs">
          {demo.email} · {demo.password}
        </p>
        <button
          type="button"
          onClick={() => {
            form.setValue("email", demo.email);
            form.setValue("password", demo.password);
          }}
          className="mt-2 text-xs font-semibold underline underline-offset-4"
        >
          Autocompletar
        </button>
      </div>
      <p className="mt-8 text-center text-sm text-tinta-500">
        ¿Primera vez?{" "}
        <Link href="/registro" className="font-semibold text-tinta underline underline-offset-4">
          Crea tu cuenta
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "", acceptTerms: false },
  });
  const { errors, isSubmitting } = form.formState;
  const accept = form.watch("acceptTerms");

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      form.setError(res.status === 409 ? "email" : "password", { message: data.error ?? "No pudimos crear tu cuenta" });
      return;
    }
    track("sign_up", { method: "email" });
    toast.success("¡Bienvenida al ropero! 💚");
    router.push("/");
    router.refresh();
  });

  return (
    <div>
      <h1 className="font-display text-5xl">Crear cuenta</h1>
      <p className="mt-2 text-tinta-500">Guarda tus datos de envío y entérate primero de cada drop.</p>
      <form onSubmit={onSubmit} noValidate className="mt-10 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" autoComplete="name" {...form.register("name")} aria-invalid={Boolean(errors.name)} />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} aria-invalid={Boolean(errors.email)} />
            <FieldError message={errors.email?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Celular (opcional)</Label>
            <Input id="phone" type="tel" inputMode="numeric" placeholder="3001234567" {...form.register("phone")} aria-invalid={Boolean(errors.phone)} />
            <FieldError message={errors.phone?.message} />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <PasswordInput id="password" autoComplete="new-password" {...form.register("password")} aria-invalid={Boolean(errors.password)} />
            <FieldError message={errors.password?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar</Label>
            <PasswordInput id="confirmPassword" autoComplete="new-password" {...form.register("confirmPassword")} aria-invalid={Boolean(errors.confirmPassword)} />
            <FieldError message={errors.confirmPassword?.message} />
          </div>
        </div>
        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-tinta-600">
            <Checkbox
              checked={accept}
              onCheckedChange={(v) => form.setValue("acceptTerms", v === true, { shouldValidate: true })}
              className="mt-0.5"
            />
            Autorizo el tratamiento de mis datos personales (Ley 1581 de 2012) y acepto recibir novedades de los drops.
          </label>
          <FieldError message={errors.acceptTerms?.message} />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />} Crear cuenta
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-tinta-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-tinta underline underline-offset-4">
          Ingresa
        </Link>
      </p>
    </div>
  );
}
