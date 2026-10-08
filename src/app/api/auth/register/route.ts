import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, hashPassword } from "@/lib/auth";
import { checkRateLimit, rateLimitedResponse } from "@/lib/rateLimit";
import { registerSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = checkRateLimit(req, "auth:register", 10, 60_000);
  if (!limited.ok) return rateLimitedResponse(limited.retryAfterSec);
  const parsed = registerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) {
    return Response.json({ error: "Ya existe una cuenta con ese correo" }, { status: 409 });
  }
  const [user] = await db
    .insert(users)
    .values({
      email,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      passwordHash: await hashPassword(parsed.data.password),
      role: "customer",
    })
    .returning({ id: users.id, name: users.name });
  await createSession(user.id);
  return Response.json({ ok: true, user: { name: user.name, role: "customer" } });
}
