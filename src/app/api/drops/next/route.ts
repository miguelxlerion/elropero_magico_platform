import { getCountdownSnapshot } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const drop = await getCountdownSnapshot();
    return Response.json({ drop, serverTime: Date.now() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[drops/next]", error);
    return Response.json({ drop: null, serverTime: Date.now() }, { status: 500 });
  }
}
