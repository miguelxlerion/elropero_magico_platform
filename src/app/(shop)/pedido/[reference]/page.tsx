import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderStatusView } from "@/components/order/OrderStatusView";
import { applyPaymentResult } from "@/lib/orders";
import { getOrderByReference } from "@/lib/queries";
import { getTransaction, isWompiConfigured } from "@/lib/wompi/checkout";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Estado del pedido", robots: { index: false } };

type Props = {
  params: Promise<{ reference: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrderPage({ params, searchParams }: Props) {
  const [{ reference }, sp] = await Promise.all([params, searchParams]);
  let order = await getOrderByReference(reference);
  if (!order) notFound();

  // Retorno desde el checkout de Wompi: ?id=<transaction_id>
  const transactionId = typeof sp.id === "string" ? sp.id : undefined;
  if (transactionId && order.status === "pending" && isWompiConfigured()) {
    const tx = await getTransaction(transactionId);
    if (tx && tx.reference === reference) {
      await applyPaymentResult(reference, tx.status, tx.id);
      order = (await getOrderByReference(reference)) ?? order;
    }
  }

  const sandbox = !isWompiConfigured() && order.payment_method !== "cod";
  return <OrderStatusView order={order} sandbox={sandbox} />;
}
