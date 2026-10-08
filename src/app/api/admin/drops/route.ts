import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { assignProductsToDrop, createDrop, updateDrop } from "@/lib/queries";
import { dropInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await requireAdmin())) return Response.json({ error: "No autorizado" }, { status: 401 });
  const parsed = dropInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  if (Number.isNaN(new Date(parsed.data.launch_date).getTime())) {
    return Response.json({ error: "Fecha inválida" }, { status: 400 });
  }
  const drop = await createDrop(parsed.data);
  return Response.json({ drop });
}

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["upcoming", "live", "ended"]).optional(),
  launch_date: z.string().optional(),
  assign: z.array(z.string().uuid()).optional(),
});

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return Response.json({ error: "No autorizado" }, { status: 401 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Datos inválidos" }, { status: 400 });
  const { id, status, launch_date, assign } = parsed.data;
  if (launch_date && Number.isNaN(new Date(launch_date).getTime())) {
    return Response.json({ error: "Fecha inválida" }, { status: 400 });
  }
  const assigned = assign?.length ? await assignProductsToDrop(id, assign) : 0;
  const drop = status || launch_date ? await updateDrop(id, { status, launch_date }) : null;
  return Response.json({ ok: true, drop, assigned });
}
