// ============================================================
// Tipos de dominio compartidos (frontend + backend).
// Estos tipos representan la "contrata" de datos que hoy vive
// en el almacén mock (data/db.json) y que mañana podría vivir
// en una base de datos real (PostgreSQL, MongoDB, etc.).
// ============================================================

/** Moneda base de almacenamiento (ver DECISIONES.md) */
export type CurrencyCode = "USD" | "COP";

/** Tipo/variedad de clavel */
export type CarnationType = "standard" | "spray";

/**
 * Producto del catálogo.
 * IMPORTANTE: todas las ventas se realizan ÚNICAMENTE en paquetes de
 * `packageSize` tallos (por defecto 200). El campo `priceUSD` es el
 * precio POR PAQUETE, no por tallo.
 */
export interface Product {
  id: string;
  name: string; // nombre comercial, ej: "Tempo Red"
  variety: string; // variedad botánica/comercial, ej: "Dianthus caryophyllus · Tempo"
  type: CarnationType; // "standard" (clavel de flor grande) | "spray" (mini clavel)
  colorFamily: string; // familia de color para filtros: Rojo, Blanco, Rosa...
  presentation: string; // presentación: "Paquete de 200 tallos"
  packageSize: number; // tallos por paquete (siempre 200 en este catálogo)
  priceUSD: number; // precio por paquete (USD 17–20 según variedad)
  packagesAvailable: number; // disponibilidad EN PAQUETES
  grade: string; // grado/calidad de tallo, ej: "Extra 55 cm"
  description: string;
  /** Galería de URLs externas; el admin las pega manualmente desde el panel */
  galleryUrls: string[];
  active: boolean; // visible/invisible en el catálogo público
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** Marca del método de pago simulado */
export type CardBrand = "Visa" | "Mastercard" | "American Express";

/** Estado de un pedido (flujo gestionado desde el panel admin) */
export type OrderStatus =
  | "pendiente" // recién pagado (simulado), esperando confirmación
  | "confirmado" // confirmado por el equipo JANIDA
  | "en_transito" // en la logística aérea hacia EE. UU.
  | "entregado" // recibido por el comprador
  | "cancelado"; // cancelado (desde estados permitidos)

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  "pendiente",
  "confirmado",
  "en_transito",
  "entregado",
];

/**
 * Transiciones permitidas del flujo de estados:
 *   pendiente   → confirmada | cancelada
 *   confirmado  → en_transito | cancelado
 *   en_transito → entregado
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pendiente: ["confirmado", "cancelado"],
  confirmado: ["en_transito", "cancelado"],
  en_transito: ["entregado"],
  entregado: [],
  cancelado: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Línea de pedido: SIEMPRE en número de paquetes (enteros) */
export interface OrderItem {
  productId: string;
  productName: string;
  variety: string;
  colorFamily: string;
  presentation: string;
  packageSize: number;
  packages: number; // entero ≥ 1 — unidades mínimas de venta
  unitPriceUSD: number; // precio por paquete
  subtotalUSD: number; // packages * unitPriceUSD
}

/** Datos del comprador mayorista (EE. UU.) */
export interface BuyerInfo {
  fullName: string;
  company: string;
  country: string; // default "Estados Unidos"
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string; // estado/provincia
  postalCode: string; // ZIP si es EE. UU.
  email: string;
  phone: string;
  notes?: string; // notas de pedido (opcional)
}

/** Registro de cambio de estado (trazabilidad del pedido) */
export interface OrderEvent {
  status: OrderStatus | "pago_aprobado";
  at: string; // ISO
  note?: string;
}

export interface Order {
  id: string; // ORD-2026-0001
  buyer: BuyerInfo;
  items: OrderItem[];
  subtotalUSD: number;
  shippingUSD: 0;
  totalUSD: number;
  /** COP registrado al momento del pago (tasa del día del pedido) */
  totalCOP: number;
  exchangeRate: number; // tasa usada para totalCOP
  status: OrderStatus;
  history: OrderEvent[];
  paymentRef: string; // referencia del pago SIMULADO
  paymentBrand: string; // "MockPay Visa ···· 4242"
  createdAt: string;
  updatedAt: string;
}

/** Intento/estado de pago SIMULADO (tipo PaymentIntent de Stripe) */
export type PaymentIntentStatus = "requires_payment" | "succeeded" | "failed" | "expired";

export interface PaymentIntent {
  pid: string; // pi_demo_xxxxx
  status: PaymentIntentStatus;
  amountUSD: number;
  exchangeRate: number;
  totalCOP: number;
  items: OrderItem[]; // snapshot de carrito al crear el intent
  buyer: BuyerInfo; // snapshot de datos del comprador
  failureReason?: string; // "card_declined" | "insufficient_funds" | "expired_card" | "invalid"
  createdAt: string;
  updatedAt: string;
  orderId?: string; // id del pedido si el pago fue exitoso
}

/** Mensaje del formulario de contacto (demo) */
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

// ============================================================
// Métricas del dashboard (calculadas en el servidor)
// ============================================================
export interface MonthBucket {
  month: string; // "2026-06"
  label: string; // "jun 2026"
  orders: number;
  salesUSD: number;
  salesCOP: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  packagesSold: number;
  revenueUSD: number;
}

export interface LowStockItem {
  productId: string;
  name: string;
  packagesAvailable: number;
  threshold: number;
}

export interface DashboardMetrics {
  generatedAt: string;
  totals: {
    salesUSD: number;
    salesCOP: number;
    ordersCount: number;
    packagesSold: number;
    avgOrderUSD: number;
    pendingCount: number; // pedidos pendientes por confirmar
  };
  byMonth: MonthBucket[]; // últimos 6 meses (incluye meses sin ventas)
  topProducts: TopProduct[]; // más vendidos, por paquetes
  lowStock: LowStockItem[]; // productos con bajo inventario (paquetes)
  byStatus: Record<OrderStatus, number>;
  activeProducts: number;
}
