import { getProductStatus } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return Response.json({ error: "Identificador inválido" }, { status: 400 });
  }
  const status = await getProductStatus(id);
  if (!status) return Response.json({ error: "No encontrado" }, { status: 404 });
  return Response.json({ status }, { headers: { "Cache-Control": "no-store" } });
}
