import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/dashboard");
  if (user.role !== "admin") redirect("/");

  return (
    <div className="min-h-screen bg-beige-50/60 lg:grid lg:grid-cols-[250px_1fr]">
      <AdminSidebar user={{ name: user.name, email: user.email }} />
      <main className="mx-auto w-full max-w-6xl min-w-0 px-4 py-8 sm:px-8 lg:py-10">{children}</main>
    </div>
  );
}
