import { getCurrentUser } from "@/lib/auth";
import { CheckoutError, createOrder, getRequestOrigin } from "@/lib/orders";
import { releaseExpiredReservations } from "@/lib/queries";
import { checkRateLimit, rateLimitedResponse } from "@/lib/rateLimit";
import { orderRequestSchema } from "@/lib/validation";
import { buildCheckoutUrl, isWompiConfigured } from "@/lib/wompi/checkout";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = checkRateLimit(req, "orders", 20, 60_000);
  if (!limited.ok) return rateLimitedResponse(limited.retryAfterSec);
  const parsed = orderRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  await releaseExpiredReservations();
  const user = await getCurrentUser();

  try {
    const { order } = await createOrder(parsed.data, user?.id ?? null);

    if (order.paymentMethod === "cod") {
      return Response.json({ reference: order.reference, provider: "cod", redirectUrl: `/pedido/${order.reference}` });
    }

    if (isWompiConfigured()) {
      const origin = getRequestOrigin(req);
      const redirectUrl = buildCheckoutUrl({
        reference: order.reference,
        amountInCents: order.total * 100,
        redirectUrl: `${origin}/pedido/${order.reference}`,
        customer: order.customer,
        shipping: order.shipping,
      });
      return Response.json({ reference: order.reference, provider: "wompi", redirectUrl });
    }

    return Response.json({ reference: order.reference, provider: "sandbox", redirectUrl: `/pedido/${order.reference}` });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return Response.json(
        { error: "Algunas piezas ya no están disponibles", unavailable: error.ids },
        { status: 409 },
      );
    }
    console.error("[orders] create failed", error);
    return Response.json({ error: "No pudimos crear tu pedido" }, { status: 500 });
  }
}
