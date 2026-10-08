import { z } from "zod";
import { generateProductCopy } from "@/lib/ai/describe";
import { requireAdmin } from "@/lib/auth";
import { describeInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const schema = describeInputSchema.extend({ has3d: z.boolean().optional() });

export async function POST(req: Request) {
  if (!(await requireAdmin())) return Response.json({ error: "No autorizado" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Completa nombre, marca y categoría" }, { status: 400 });
  }
  const copy = await generateProductCopy(parsed.data);
  return Response.json(copy);
}
