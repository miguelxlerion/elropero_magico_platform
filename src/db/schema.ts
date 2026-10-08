import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  ProductCategory,
  ProductCondition,
  ProductMeasurements,
  ProductStatus,
} from "../types/product";
import type { DropStatus } from "../types/drop";
import type { CustomerInfo, OrderStatus, PaymentMethod, ShippingInfo } from "../types/order";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<"customer" | "admin">().notNull().default("customer"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const drops = pgTable("drops", {
  id: text("id").primaryKey(),
  number: integer("number").notNull(),
  name: text("name").notNull(),
  theme: text("theme").notNull(),
  description: text("description").notNull().default(""),
  coverImage: text("cover_image").notNull().default(""),
  launchDate: timestamp("launch_date", { withTimezone: true }).notNull(),
  status: text("status").$type<DropStatus>().notNull().default("upcoming"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    brand: text("brand").notNull(),
    category: text("category").$type<ProductCategory>().notNull(),
    subcategory: text("subcategory").notNull(),
    size: text("size").notNull(),
    measurements: jsonb("measurements").$type<ProductMeasurements>().notNull().default({}),
    condition: text("condition").$type<ProductCondition>().notNull(),
    conditionScore: integer("condition_score").notNull(),
    conditionNotes: text("condition_notes").notNull().default(""),
    color: text("color").notNull().default(""),
    material: text("material").notNull().default(""),
    price: integer("price").notNull(),
    originalPrice: integer("original_price"),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    model3dUrl: text("model_3d_url"),
    arSupported: boolean("ar_supported").notNull().default(false),
    dropId: text("drop_id").references(() => drops.id, { onDelete: "set null" }),
    status: text("status").$type<ProductStatus>().notNull().default("draft"),
    featured: boolean("featured").notNull().default(false),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    aiGeneratedDescription: text("ai_generated_description").notNull().default(""),
    aiMetadata: jsonb("ai_metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("products_drop_idx").on(t.dropId), index("products_status_idx").on(t.status)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull().unique(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    status: text("status").$type<OrderStatus>().notNull().default("pending"),
    paymentMethod: text("payment_method").$type<PaymentMethod>().notNull(),
    customer: jsonb("customer").$type<CustomerInfo>().notNull(),
    shipping: jsonb("shipping").$type<ShippingInfo>().notNull(),
    subtotal: integer("subtotal").notNull(),
    shippingCost: integer("shipping_cost").notNull(),
    codFee: integer("cod_fee").notNull().default(0),
    total: integer("total").notNull(),
    wompiTransactionId: text("wompi_transaction_id"),
    paymentStatusDetail: text("payment_status_detail"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("orders_status_idx").on(t.status)],
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  size: text("size").notNull(),
  price: integer("price").notNull(),
  image: text("image").notNull().default(""),
});

export const subscribers = pgTable(
  "subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    channel: text("channel").$type<"email" | "whatsapp">().notNull(),
    contact: text("contact").notNull(),
    dropId: text("drop_id").notNull().default("general"),
    source: text("source").notNull().default("newsletter"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("subscribers_contact_drop_idx").on(t.contact, t.dropId)],
);

export const aiProcessingLogs = pgTable("ai_processing_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  visionModel: text("vision_model"),
  visionTokens: integer("vision_tokens"),
  llmModel: text("llm_model"),
  llmTokensIn: integer("llm_tokens_in"),
  llmTokensOut: integer("llm_tokens_out"),
  processingTimeMs: integer("processing_time_ms"),
  costUsd: text("cost_usd"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
