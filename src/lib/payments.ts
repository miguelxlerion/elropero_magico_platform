import type { OrderStatus, PaymentMethod } from "@/types/order";

export type PaymentOption = {
  id: PaymentMethod;
  label: string;
  description: string;
  detail: string;
  mark: string;
  markClass: string;
};

export const PAYMENT_METHODS: PaymentOption[] = [
  {
    id: "pse",
    label: "PSE",
    description: "Débito desde tu cuenta de ahorros o corriente",
    detail: "Todos los bancos de Colombia",
    mark: "PSE",
    markClass: "bg-[#0a4a8c] text-white",
  },
  {
    id: "nequi",
    label: "Nequi",
    description: "Aprueba el pago con una notificación en tu app",
    detail: "Confirmación inmediata",
    mark: "N",
    markClass: "bg-[#200020] text-[#ff4f9a]",
  },
  {
    id: "daviplata",
    label: "Daviplata",
    description: "Paga desde tu celular con tu clave Daviplata",
    detail: "Confirmación inmediata",
    mark: "D",
    markClass: "bg-[#e1251b] text-white",
  },
  {
    id: "card",
    label: "Tarjeta crédito o débito",
    description: "Visa, Mastercard, American Express y Diners",
    detail: "Difiere hasta 36 cuotas con crédito",
    mark: "••••",
    markClass: "bg-tinta text-hueso",
  },
  {
    id: "cod",
    label: "Pago contra entrega",
    description: "Pagas en efectivo al recibir tu pedido",
    detail: "Recargo por manejo de efectivo",
    mark: "$",
    markClass: "bg-salvia-600 text-white",
  },
];

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pse: "PSE",
  nequi: "Nequi",
  daviplata: "Daviplata",
  card: "Tarjeta",
  cod: "Contra entrega",
};

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; description: string; tone: string }> = {
  pending: {
    label: "Esperando pago",
    description: "Tus prendas están reservadas mientras completas el pago.",
    tone: "bg-amber-50 text-amber-900",
  },
  paid: { label: "Pago aprobado", description: "¡Listo! Estamos preparando tu pedido.", tone: "bg-salvia-100 text-salvia-700" },
  cod_confirmed: {
    label: "Pedido confirmado",
    description: "Pagarás en efectivo al recibir. Te contactaremos por WhatsApp.",
    tone: "bg-salvia-100 text-salvia-700",
  },
  failed: {
    label: "Pago rechazado",
    description: "El pago no se completó. Las prendas volvieron al catálogo.",
    tone: "bg-orange-50 text-terracota",
  },
  expired: {
    label: "Reserva vencida",
    description: "El tiempo de reserva terminó y las prendas se liberaron.",
    tone: "bg-beige-100 text-tinta-700",
  },
  shipped: { label: "En camino", description: "Tu pedido va en camino.", tone: "bg-salvia-100 text-salvia-700" },
  delivered: { label: "Entregado", description: "Disfruta tus piezas con historia.", tone: "bg-salvia-100 text-salvia-700" },
  cancelled: { label: "Cancelado", description: "El pedido fue cancelado.", tone: "bg-beige-100 text-tinta-700" },
};
