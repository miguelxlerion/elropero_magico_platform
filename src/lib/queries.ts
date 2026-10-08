import { and, count, desc, eq, inArray, isNull, lt, lte, ne, or, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import { drops, orderItems, orders, products, subscribers } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { RESERVATION_MINUTES } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import type { ProductInput, DropInput } from "@/lib/validation";
import { conditionFromScore } from "@/lib/conditions";
import type { Drop, DropSnapshot, DropStatus } from "@/types/drop";
import type { Order, OrderStatus } from "@/types/order";
import type { Product, ProductCategory, ProductStatus, ProductWithDrop } from "@/types/product";

type ProductRow = typeof products.$inferSelect;
type DropRow = typeof drops.$inferSelect;
type OrderRow = typeof orders.$inferSelect;

const VISIBLE: ProductStatus[] = ["published", "reserved", "sold"];
const PAID_STATUSES: OrderStatus[] = ["paid", "cod_confirmed", "shipped", "delivered"];

export function effectiveDropStatus(
  row: Pick<DropRow, "status" | "launchDate">,
  now: number = Date.now(),
): DropStatus {
  if (row.launchDate.getTime() > now) return "upcoming";
  return row.status === "ended" ? "ended" : "live";
}

export function toProduct(r: ProductRow): Product {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    brand: r.brand,
    category: r.category,
    subcategory: r.subcategory,
    size: r.size,
    measurements: r.measurements ?? {},
    condition: r.condition,
    condition_score: r.conditionScore,
    condition_notes: r.conditionNotes,
    color: r.color,
    material: r.material,
    price: r.price,
    original_price: r.originalPrice ?? undefined,
    images: r.images ?? [],
    model_3d_url: r.model3dUrl ?? undefined,
    ar_supported: r.arSupported,
    drop_id: r.dropId ?? "",
    status: r.status,
    featured: r.featured,
    tags: r.tags ?? [],
    ai_generated_description: r.aiGeneratedDescription,
    created_at: r.createdAt.toISOString(),
  };
}

export function toDrop(r: DropRow, productIds: string[] = []): Drop {
  return {
    id: r.id,
    number: r.number,
    name: r.name,
    theme: r.theme,
    description: r.description,
    cover_image: r.coverImage,
    launch_date: r.launchDate.toISOString(),
    status: effectiveDropStatus(r),
    product_ids: productIds,
  };
}

export function toOrder(r: OrderRow, items: (typeof orderItems.$inferSelect)[]): Order {
  return {
    id: r.id,
    reference: r.reference,
    status: r.status,
    payment_method: r.paymentMethod,
    customer: r.customer,
    shipping: r.shipping,
    items: items.map((i) => ({
      product_id: i.productId,
      slug: i.slug,
      name: i.name,
      brand: i.brand,
      size: i.size,
      price: i.price,
      image: i.image,
    })),
    subtotal: r.subtotal,
    shipping_cost: r.shippingCost,
    cod_fee: r.codFee,
    total: r.total,
    wompi_transaction_id: r.wompiTransactionId,
    created_at: r.createdAt.toISOString(),
  };
}

const launchedOrNoDrop = () => or(isNull(products.dropId), lte(drops.launchDate, new Date()));
const availabilityOrder = sql`case ${products.status} when 'published' then 0 when 'reserved' then 1 else 2 end`;

/** Libera prendas de pedidos online que no se pagaron dentro de la ventana de reserva. */
export async function releaseExpiredReservations() {
  const cutoff = new Date(Date.now() - RESERVATION_MINUTES * 60_000);
  const expired = await db
    .update(orders)
    .set({ status: "expired", updatedAt: new Date() })
    .where(and(eq(orders.status, "pending"), lt(orders.createdAt, cutoff)))
    .returning({ id: orders.id });
  if (!expired.length) return;
  const items = await db
    .select({ productId: orderItems.productId })
    .from(orderItems)
    .where(inArray(orderItems.orderId, expired.map((e) => e.id)));
  const ids = items.map((i) => i.productId).filter((x): x is string => Boolean(x));
  if (ids.length) {
    await db
      .update(products)
      .set({ status: "published" })
      .where(and(inArray(products.id, ids), eq(products.status, "reserved")));
  }
}

// ----------------------------------------------------------------------------
// Catálogo
// ----------------------------------------------------------------------------

export async function getCatalogProducts(): Promise<Product[]> {
  await ensureSeeded();
  await releaseExpiredReservations();
  const rows = await db
    .select({ product: products })
    .from(products)
    .leftJoin(drops, eq(products.dropId, drops.id))
    .where(and(inArray(products.status, VISIBLE), launchedOrNoDrop()))
    .orderBy(desc(products.createdAt));
  return rows.map((r) => toProduct(r.product));
}

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  await ensureSeeded();
  const rows = await db
    .select({ product: products })
    .from(products)
    .leftJoin(drops, eq(products.dropId, drops.id))
    .where(and(eq(products.status, "published"), launchedOrNoDrop()))
    .orderBy(desc(products.featured), desc(products.createdAt))
    .limit(limit);
  return rows.map((r) => toProduct(r.product));
}

export async function getProductBySlug(slug: string): Promise<ProductWithDrop | null> {
  await ensureSeeded();
  const rows = await db
    .select({ product: products, drop: drops })
    .from(products)
    .leftJoin(drops, eq(products.dropId, drops.id))
    .where(eq(products.slug, slug))
    .limit(1);
  const row = rows[0];
  if (!row || row.product.status === "draft") return null;
  const dropStatus = row.drop ? effectiveDropStatus(row.drop) : null;
  if (dropStatus === "upcoming") return null;
  return {
    ...toProduct(row.product),
    drop: row.drop
      ? { id: row.drop.id, name: row.drop.name, number: row.drop.number, status: dropStatus ?? "live" }
      : null,
  };
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const sameDrop = product.drop_id
    ? await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.dropId, product.drop_id),
            ne(products.id, product.id),
            inArray(products.status, VISIBLE),
          ),
        )
        .orderBy(availabilityOrder, desc(products.featured), desc(products.createdAt))
        .limit(limit)
    : [];
  const result = sameDrop.map(toProduct);
  if (result.length >= limit) return result;
  const exclude = [product.id, ...result.map((p) => p.id)];
  const filler = await db
    .select({ product: products })
    .from(products)
    .leftJoin(drops, eq(products.dropId, drops.id))
    .where(
      and(
        eq(products.category, product.category),
        eq(products.status, "published"),
        launchedOrNoDrop(),
        sql`${products.id} not in (${sql.join(
          exclude.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      ),
    )
    .limit(limit - result.length);
  return [...result, ...filler.map((r) => toProduct(r.product))];
}

export async function getProductsAvailability(ids: string[]) {
  if (!ids.length) return [];
  await releaseExpiredReservations();
  const rows = await db
    .select({ id: products.id, status: products.status, price: products.price, launchDate: drops.launchDate })
    .from(products)
    .leftJoin(drops, eq(products.dropId, drops.id))
    .where(inArray(products.id, ids));
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    price: r.price,
    available: r.status === "published" && (!r.launchDate || r.launchDate.getTime() <= Date.now()),
  }));
}

export async function getProductStatus(id: string): Promise<ProductStatus | null> {
  const rows = await db.select({ status: products.status }).from(products).where(eq(products.id, id)).limit(1);
  return rows[0]?.status ?? null;
}

// ----------------------------------------------------------------------------
// Drops
// ----------------------------------------------------------------------------

export async function getAllDrops(): Promise<Drop[]> {
  await ensureSeeded();
  const [dropRows, productRows] = await Promise.all([
    db.select().from(drops).orderBy(desc(drops.launchDate)),
    db.select({ id: products.id, dropId: products.dropId }).from(products).where(inArray(products.status, VISIBLE)),
  ]);
  const byDrop = new Map<string, string[]>();
  for (const p of productRows) {
    if (!p.dropId) continue;
    const list = byDrop.get(p.dropId) ?? [];
    list.push(p.id);
    byDrop.set(p.dropId, list);
  }
  return dropRows.map((d) => toDrop(d, byDrop.get(d.id) ?? []));
}

export async function getNextDrop(): Promise<Drop | null> {
  const all = await getAllDrops();
  return (
    all
      .filter((d) => d.status === "upcoming")
      .sort((a, b) => +new Date(a.launch_date) - +new Date(b.launch_date))[0] ?? null
  );
}

export async function getLiveDrop(): Promise<Drop | null> {
  const all = await getAllDrops();
  return (
    all
      .filter((d) => d.status === "live")
      .sort((a, b) => +new Date(b.launch_date) - +new Date(a.launch_date))[0] ?? null
  );
}

export async function getDropById(id: string): Promise<Drop | null> {
  const all = await getAllDrops();
  return all.find((d) => d.id === id) ?? null;
}

export async function getDropProducts(dropId: string): Promise<Product[]> {
  await ensureSeeded();
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.dropId, dropId), inArray(products.status, VISIBLE)))
    .orderBy(availabilityOrder, desc(products.featured), desc(products.createdAt));
  return rows.map(toProduct);
}

export function toSnapshot(drop: Drop): DropSnapshot {
  return {
    id: drop.id,
    name: drop.name,
    theme: drop.theme,
    launch_date: drop.launch_date,
    status: drop.status,
    number: drop.number,
    cover_image: drop.cover_image,
    product_count: drop.product_ids.length,
  };
}

export async function getCountdownSnapshot(): Promise<DropSnapshot | null> {
  const next = await getNextDrop();
  if (next) return toSnapshot(next);
  const live = await getLiveDrop();
  return live ? toSnapshot(live) : null;
}

// ----------------------------------------------------------------------------
// Pedidos y suscriptores
// ----------------------------------------------------------------------------

export async function getOrderByReference(reference: string): Promise<Order | null> {
  const rows = await db.select().from(orders).where(eq(orders.reference, reference)).limit(1);
  const order = rows[0];
  if (!order) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  return toOrder(order, items);
}

export async function addSubscriber(input: {
  channel: "email" | "whatsapp";
  contact: string;
  dropId?: string;
  source?: string;
}) {
  const contact = input.channel === "whatsapp" ? input.contact.replace(/\D/g, "") : input.contact.toLowerCase();
  const inserted = await db
    .insert(subscribers)
    .values({
      channel: input.channel,
      contact,
      dropId: input.dropId || "general",
      source: input.source || "newsletter",
    })
    .onConflictDoNothing()
    .returning({ id: subscribers.id });
  return { created: inserted.length > 0 };
}

// ----------------------------------------------------------------------------
// Admin
// ----------------------------------------------------------------------------

export async function getDashboardData() {
  await ensureSeeded();
  await releaseExpiredReservations();
  const [revenueRows, statusRows, categoryRows, subscriberRows, pendingRows, recentOrders, recentProducts, dropStatusRows, subsByDrop, allDrops] =
    await Promise.all([
      db.select({ revenue: sum(orders.total), orders: count() }).from(orders).where(inArray(orders.status, PAID_STATUSES)),
      db.select({ status: products.status, value: count() }).from(products).groupBy(products.status),
      db
        .select({ category: products.category, value: count() })
        .from(products)
        .where(inArray(products.status, VISIBLE))
        .groupBy(products.category),
      db.select({ value: count() }).from(subscribers),
      db.select({ value: count() }).from(orders).where(eq(orders.status, "pending")),
      db.select().from(orders).orderBy(desc(orders.createdAt)).limit(8),
      db.select().from(products).orderBy(desc(products.createdAt)).limit(8),
      db
        .select({ dropId: products.dropId, status: products.status, value: count() })
        .from(products)
        .groupBy(products.dropId, products.status),
      db.select({ dropId: subscribers.dropId, value: count() }).from(subscribers).groupBy(subscribers.dropId),
      getAllDrops(),
    ]);

  const revenue = Number(revenueRows[0]?.revenue ?? 0);
  const paidOrders = revenueRows[0]?.orders ?? 0;
  const statusCount = (s: ProductStatus) => statusRows.find((r) => r.status === s)?.value ?? 0;

  const drops = allDrops.map((d) => {
    const rows = dropStatusRows.filter((r) => r.dropId === d.id);
    const total = rows.reduce((a, r) => a + r.value, 0);
    const sold = rows.filter((r) => r.status === "sold").reduce((a, r) => a + r.value, 0);
    return {
      ...d,
      total,
      sold,
      sellThrough: total ? Math.round((sold / total) * 100) : 0,
      subscribers: subsByDrop.find((s) => s.dropId === d.id)?.value ?? 0,
    };
  });

  return {
    kpis: {
      revenue,
      paidOrders,
      avgTicket: paidOrders ? Math.round(revenue / paidOrders) : 0,
      pendingOrders: pendingRows[0]?.value ?? 0,
      published: statusCount("published"),
      reserved: statusCount("reserved"),
      sold: statusCount("sold"),
      drafts: statusCount("draft"),
      subscribers: subscriberRows[0]?.value ?? 0,
    },
    categories: categoryRows.map((r) => ({ category: r.category as ProductCategory, value: r.value })),
    recentOrders: recentOrders.map((o) => toOrder(o, [])),
    recentProducts: recentProducts.map(toProduct),
    drops,
  };
}

async function uniqueSlug(base: string) {
  const slug = slugify(base) || `prenda-${Date.now()}`;
  const existing = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1);
  return existing.length ? `${slug}-${Math.random().toString(36).slice(2, 6)}` : slug;
}

export async function createProduct(input: ProductInput) {
  const slug = await uniqueSlug(`${input.name} ${input.brand}`);
  const measurements = Object.fromEntries(
    Object.entries(input.measurements).filter(([, v]) => typeof v === "number" && !Number.isNaN(v)),
  );
  const [row] = await db
    .insert(products)
    .values({
      slug,
      name: input.name,
      brand: input.brand,
      category: input.category,
      subcategory: input.subcategory,
      size: input.size,
      measurements,
      condition: conditionFromScore(input.condition_score),
      conditionScore: input.condition_score,
      conditionNotes: input.condition_notes,
      color: input.color,
      material: input.material,
      price: input.price,
      originalPrice: input.original_price ?? null,
      images: input.images,
      model3dUrl: input.model_3d_url || null,
      arSupported: Boolean(input.model_3d_url),
      dropId: input.drop_id || null,
      status: input.status,
      featured: input.featured,
      tags: input.tags,
      aiGeneratedDescription: input.ai_generated_description,
    })
    .returning();
  return toProduct(row);
}

export async function createDrop(input: DropInput) {
  const all = await db.select({ number: drops.number }).from(drops);
  const number = Math.max(0, ...all.map((d) => d.number)) + 1;
  const id = `drop-${String(number).padStart(2, "0")}-${slugify(input.name)}`;
  const [row] = await db
    .insert(drops)
    .values({
      id,
      number,
      name: input.name,
      theme: input.theme,
      description: input.description,
      coverImage: input.cover_image,
      launchDate: new Date(input.launch_date),
      status: "upcoming",
    })
    .returning();
  return toDrop(row);
}

export async function updateDrop(id: string, patch: { status?: DropStatus; launch_date?: string }) {
  const values: Partial<typeof drops.$inferInsert> = {};
  if (patch.status) values.status = patch.status;
  if (patch.launch_date) values.launchDate = new Date(patch.launch_date);
  if (patch.status === "live" && !patch.launch_date) values.launchDate = new Date();
  const [row] = await db.update(drops).set(values).where(eq(drops.id, id)).returning();
  return row ? toDrop(row) : null;
}

export async function getUnassignedProducts() {
  const rows = await db
    .select()
    .from(products)
    .where(or(isNull(products.dropId), eq(products.status, "draft")))
    .orderBy(desc(products.createdAt))
    .limit(30);
  return rows.map(toProduct);
}

export async function assignProductsToDrop(dropId: string, productIds: string[]) {
  if (!productIds.length) return 0;
  const updated = await db
    .update(products)
    .set({ dropId, status: "published" })
    .where(inArray(products.id, productIds))
    .returning({ id: products.id });
  return updated.length;
}
