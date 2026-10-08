import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { createSession, verifyPassword } from "@/lib/auth";
import { checkRateLimit, rateLimitedResponse } from "@/lib/rateLimit";
import { loginSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = checkRateLimit(req, "auth:login", 10, 60_000);
  if (!limited.ok) return rateLimitedResponse(limited.retryAfterSec);
  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  await ensureSeeded();
  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email.toLowerCase())).limit(1);
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return Response.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
  }
  await createSession(user.id);
  return Response.json({ ok: true, user: { name: user.name, role: user.role } });
}
