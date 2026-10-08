import { getCountdownSnapshot } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Canal en tiempo real (Server-Sent Events) del próximo drop.
 * Emite el snapshot + la hora del servidor cada 10 s; el cliente reconecta solo.
 */
export async function GET(req: Request) {
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let closed = false;

  const cleanup = () => {
    closed = true;
    if (interval) clearInterval(interval);
    if (timeout) clearTimeout(timeout);
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const close = () => {
        if (closed) return;
        cleanup();
        try {
          controller.close();
        } catch {
          // ya cerrado
        }
      };
      const push = async () => {
        if (closed) return;
        try {
          const drop = await getCountdownSnapshot();
          if (closed) return;
          controller.enqueue(encoder.encode(`event: drop\ndata: ${JSON.stringify({ drop, serverTime: Date.now() })}\n\n`));
        } catch {
          if (!closed) controller.enqueue(encoder.encode(`: error ${Date.now()}\n\n`));
        }
      };
      controller.enqueue(encoder.encode("retry: 5000\n\n"));
      await push();
      interval = setInterval(() => void push(), 10_000);
      timeout = setTimeout(close, 5 * 60_000);
      req.signal.addEventListener("abort", close);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
