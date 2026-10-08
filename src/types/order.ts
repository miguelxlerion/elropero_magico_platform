import type { ProductCondition } from "./product";

export type PaymentMethod = "pse" | "nequi" | "daviplata" | "card" | "cod";

export type OrderStatus =
  | "pending"
  | "paid"
  | "cod_confirmed"
  | "failed"
  | "expired"
  | "shipped"
  | "delivered"
  | "cancelled";

export type ShippingZone = "bogota" | "nacional";

export type DocumentType = "CC" | "CE" | "NIT" | "PP";

export type CustomerInfo = {
  fullName: string;
  email: string;
  phone: string;
  documentType: DocumentType;
  documentNumber: string;
};

export type ShippingInfo = {
  city: string;
  department: string;
  address: string;
  neighborhood: string;
  notes: string;
  zone: ShippingZone;
  eta: string;
};

export type OrderItem = {
  product_id: string | null;
  slug: string;
  name: string;
  brand: string;
  size: string;
  price: number;
  image: string;
};

export type Order = {
  id: string;
  reference: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  customer: CustomerInfo;
  shipping: ShippingInfo;
  items: OrderItem[];
  subtotal: number;
  shipping_cost: number;
  cod_fee: number;
  total: number;
  wompi_transaction_id: string | null;
  created_at: string;
};

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  size: string;
  price: number;
  original_price?: number;
  image: string;
  condition: ProductCondition;
  condition_score: number;
  drop_id: string;
  added_at: number;
};
