import type { ReactNode } from "react";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getCurrentUser } from "@/lib/auth";
import { getCountdownSnapshot, getLiveDrop } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * Si la DB tarda o cuelga (Hyperdrive/Neon inestable), la página se sigue
 * mostrando sin los datos del header en lugar de devolver 500.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export default async function ShopLayout({ children }: { children: ReactNode }) {
  const [user, announcement, liveDrop] = await Promise.all([
    withTimeout(getCurrentUser(), 1500, null),
    withTimeout(getCountdownSnapshot(), 1500, null),
    withTimeout(getLiveDrop(), 1500, null),
  ]);

  return (
    <>
      <Navbar
        user={user ? { name: user.name, role: user.role } : null}
        announcement={announcement}
        liveDropId={liveDrop?.id ?? null}
      />
      <main className="min-h-[70vh]">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
