import { randomBytes } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { drops, orderItems, orders, products } from "@/db/schema";
import { calculateTotals } from "@/lib/shipping";
import type { CheckoutValues } from "@/lib/validation";

export class CheckoutError extends Error {
  ids: string[];
  constructor(ids: string[]) {
    super("unavailable");
    this.ids = ids;
  }
}

export function generateReference() {
  const ymd = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `MAG-${ymd}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function createOrder(input: CheckoutValues & { items: string[] }, userId: string | null) {
  return db.transaction(async (tx) => {
    const locked = await tx.select().from(products).where(inArray(products.id, input.items)).for("update");
    const dropIds = [...new Set(locked.map((p) => p.dropId).filter((x): x is string => Boolean(x)))];
    const dropRows = dropIds.length
      ? await tx.select({ id: drops.id, launchDate: drops.launchDate }).from(drops).where(inArray(drops.id, dropIds))
      : [];
    const launched = new Map(dropRows.map((d) => [d.id, d.launchDate.getTime() <= Date.now()]));

    const unavailable = input.items.filter((id) => {
      const p = locked.find((r) => r.id === id);
      if (!p || p.status !== "published") return true;
      return p.dropId ? launched.get(p.dropId) === false : false;
    });
    if (unavailable.length) throw new CheckoutError(unavailable);

    const subtotal = locked.reduce((acc, p) => acc + p.price, 0);
    const totals = calculateTotals(subtotal, input.city, input.paymentMethod);
    const isCod = input.paymentMethod === "cod";
    const reference = generateReference();

    const [order] = await tx
      .insert(orders)
      .values({
        reference,
        userId,
        status: isCod ? "cod_confirmed" : "pending",
        paymentMethod: input.paymentMethod,
        customer: {
          fullName: input.fullName,
          email: input.email.toLowerCase(),
          phone: input.phone,
          documentType: input.documentType,
          documentNumber: input.documentNumber,
        },
        shipping: {
          city: input.city,
          department: input.department,
          address: input.address,
          neighborhood: input.neighborhood,
          notes: input.notes,
          zone: totals.quote.zone,
          eta: totals.quote.eta,
        },
        subtotal: totals.subtotal,
        shippingCost: totals.shipping,
        codFee: totals.codFee,
        total: totals.total,
      })
      .returning();

    await tx.insert(orderItems).values(
      locked.map((p) => ({
        orderId: order.id,
        productId: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        size: p.size,
        price: p.price,
        image: p.images[0] ?? "",
      })),
    );

    await tx
      .update(products)
      .set({ status: isCod ? "sold" : "reserved" })
      .where(inArray(products.id, input.items));

    return { order, totals };
  });
}

/** Aplica el resultado de pago (Wompi o simulación sandbox) de forma idempotente. */
export async function applyPaymentResult(reference: string, status: string, transactionId?: string | null) {
  const [order] = await db.select().from(orders).where(eq(orders.reference, reference)).limit(1);
  if (!order) return null;
  if (order.status !== "pending" && order.status !== "expired") return order;

  const items = await db
    .select({ productId: orderItems.productId })
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));
  const ids = items.map((i) => i.productId).filter((x): x is string => Boolean(x));

  if (status === "APPROVED") {
    await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({
          status: "paid",
          wompiTransactionId: transactionId ?? order.wompiTransactionId,
          paymentStatusDetail: "APPROVED",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));
      if (ids.length) await tx.update(products).set({ status: "sold" }).where(inArray(products.id, ids));
    });
  } else if (status === "DECLINED" || status === "VOIDED" || status === "ERROR") {
    await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({
          status: "failed",
          wompiTransactionId: transactionId ?? order.wompiTransactionId,
          paymentStatusDetail: status,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));
      if (ids.length) {
        await tx
          .update(products)
          .set({ status: "published" })
          .where(and(inArray(products.id, ids), eq(products.status, "reserved")));
      }
    });
  } else if (transactionId) {
    await db
      .update(orders)
      .set({ wompiTransactionId: transactionId, paymentStatusDetail: status, updatedAt: new Date() })
      .where(eq(orders.id, order.id));
  }

  const [updated] = await db.select().from(orders).where(eq(orders.id, order.id)).limit(1);
  return updated ?? null;
}

export function getRequestOrigin(req: Request) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto.split(",")[0]}://${host.split(",")[0]}`;
  return new URL(req.url).origin;
}
