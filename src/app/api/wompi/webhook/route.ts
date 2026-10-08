import { applyPaymentResult } from "@/lib/orders";
import { checkRateLimit, rateLimitedResponse } from "@/lib/rateLimit";
import { verifyEventChecksum, type WompiEvent } from "@/lib/wompi/checkout";

export const dynamic = "force-dynamic";

/** URL de eventos para configurar en el dashboard de Wompi: /api/wompi/webhook */
export async function POST(req: Request) {
  // Límite generoso: Wompi reintenta eventos y no debe perderlos por throttling.
  const limited = checkRateLimit(req, "wompi:webhook", 120, 60_000);
  if (!limited.ok) return rateLimitedResponse(limited.retryAfterSec);
  const event = (await req.json().catch(() => null)) as WompiEvent | null;
  if (!event) return Response.json({ ok: false }, { status: 400 });
  if (!verifyEventChecksum(event)) {
    return Response.json({ ok: false, error: "Checksum inválido" }, { status: 401 });
  }
  const tx = event.data?.transaction;
  if (event.event === "transaction.updated" && tx?.reference) {
    await applyPaymentResult(tx.reference, tx.status, tx.id);
  }
  return Response.json({ ok: true });
}
