import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

/** TEMPORAL diagnóstico prod. Se borra enseguida. */
export async function GET() {
  let ctxEnvKeys: string[] = [];
  let ctxError: string | null = null;
  try {
    const c = getCloudflareContext() as unknown as { env?: Record<string, unknown> };
    ctxEnvKeys = Object.keys(c.env ?? {});
  } catch (e) {
    ctxError = e instanceof Error ? e.message : String(e);
  }
  const mask = (v: string | undefined) => (v ? `len=${v.length}` : "MISSING");
  return Response.json({
    ctxError,
    ctxEnvKeys,
    viaProcessEnv: {
      NEON: mask(process.env.NEON_DATABASE_URL),
      SITE: mask(process.env.NEXT_PUBLIC_SITE_URL),
    },
  });
}
