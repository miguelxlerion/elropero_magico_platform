import { addSubscriber } from "@/lib/queries";
import { checkRateLimit, rateLimitedResponse } from "@/lib/rateLimit";
import { subscribeSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = checkRateLimit(req, "subscribe", 10, 60_000);
  if (!limited.ok) return rateLimitedResponse(limited.retryAfterSec);
  const parsed = subscribeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  try {
    const result = await addSubscriber(parsed.data);
    return Response.json(result);
  } catch (error) {
    console.error("[subscribe]", error);
    return Response.json({ error: "No pudimos registrarte, intenta de nuevo" }, { status: 500 });
  }
}
