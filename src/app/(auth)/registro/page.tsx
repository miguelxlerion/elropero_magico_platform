import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/AuthForms";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Crear cuenta" };

export default async function RegistroPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");
  return <RegisterForm />;
}
