import type { Metadata } from "next";
import { DropManager } from "@/components/admin/DropManager";
import { SITE } from "@/lib/constants";
import { getAllDrops, getUnassignedProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gestión de drops" };

function toBogotaInput(date: Date) {
  return new Date(date.getTime() - 5 * 3_600_000).toISOString().slice(0, 16);
}

export default async function AdminDropsPage() {
  const [drops, unassigned] = await Promise.all([getAllDrops(), getUnassignedProducts()]);
  const latest = drops.reduce<Date>((acc, d) => (new Date(d.launch_date) > acc ? new Date(d.launch_date) : acc), new Date());
  const suggested = new Date(latest.getTime() + SITE.dropCadenceDays * 86_400_000);
  suggested.setUTCHours(24, 0, 0, 0);

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-salvia-600">Lanzamientos</p>
        <h1 className="mt-2 font-display text-5xl">Drops</h1>
        <p className="mt-2 max-w-2xl text-tinta-500">
          Programa colecciones cada {SITE.dropCadenceDays} días. Los cambios de fecha y estado se sincronizan en tiempo
          real con el countdown de la tienda.
        </p>
      </header>
      <DropManager
        drops={drops.map((d) => ({
          id: d.id,
          number: d.number,
          name: d.name,
          theme: d.theme,
          status: d.status,
          launch_date: d.launch_date,
          launch_input: toBogotaInput(new Date(d.launch_date)),
          products: d.product_ids.length,
        }))}
        unassigned={unassigned.map((p) => ({ id: p.id, name: p.name, brand: p.brand, image: p.images[0] ?? "", status: p.status }))}
        suggestedLaunch={toBogotaInput(suggested)}
      />
    </div>
  );
}
