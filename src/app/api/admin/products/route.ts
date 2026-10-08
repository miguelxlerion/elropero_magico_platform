import { requireAdmin } from "@/lib/auth";
import { createProduct } from "@/lib/queries";
import { productInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await requireAdmin())) return Response.json({ error: "No autorizado" }, { status: 401 });
  const parsed = productInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return Response.json(
      { error: issue ? `${issue.path.join(".")}: ${issue.message}` : "Datos inválidos" },
      { status: 400 },
    );
  }
  try {
    const product = await createProduct(parsed.data);
    return Response.json({ product });
  } catch (error) {
    console.error("[admin/products]", error);
    return Response.json({ error: "No se pudo guardar la prenda" }, { status: 500 });
  }
}
