import type { ReactNode } from "react";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getCurrentUser } from "@/lib/auth";
import { getCountdownSnapshot, getLiveDrop } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: ReactNode }) {
  const [user, announcement, liveDrop] = await Promise.all([
    getCurrentUser(),
    getCountdownSnapshot().catch(() => null),
    getLiveDrop().catch(() => null),
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
