import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { getCurrentUser } from "@/lib/auth";
import { isWompiConfigured } from "@/lib/wompi/checkout";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  return (
    <CheckoutView
      user={user ? { name: user.name, email: user.email, phone: user.phone } : null}
      wompiEnabled={isWompiConfigured()}
    />
  );
}
