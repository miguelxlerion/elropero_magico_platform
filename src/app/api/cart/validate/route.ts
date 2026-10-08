import { getProductsAvailability } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { ids?: unknown } | null;
  const raw = body?.ids;
  const ids = Array.isArray(raw)
    ? raw.filter((x): x is string => typeof x === "string" && /^[0-9a-f-]{36}$/i.test(x)).slice(0, 30)
    : [];
  const rows = await getProductsAvailability(ids);
  const items = ids.map((id) => {
    const row = rows.find((r) => r.id === id);
    return row
      ? { id, available: row.available, status: row.status, price: row.price }
      : { id, available: false, status: "sold", price: 0 };
  });
  return Response.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
