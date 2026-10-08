import { applyPaymentResult } from "@/lib/orders";
import { isWompiConfigured } from "@/lib/wompi/checkout";

export const dynamic = "force-dynamic";

/** Solo disponible en modo sandbox (sin llaves de Wompi configuradas). */
export async function POST(req: Request, { params }: { params: Promise<{ reference: string }> }) {
  if (isWompiConfigured()) {
    return Response.json({ error: "La simulación está deshabilitada con Wompi activo" }, { status: 403 });
  }
  const { reference } = await params;
  const body = (await req.json().catch(() => ({}))) as { outcome?: string };
  const outcome = body.outcome === "APPROVED" ? "APPROVED" : "DECLINED";
  const order = await applyPaymentResult(reference, outcome, `sandbox-${Date.now()}`);
  if (!order) return Response.json({ error: "Pedido no encontrado" }, { status: 404 });
  return Response.json({ status: order.status });
}
