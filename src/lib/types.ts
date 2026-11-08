// ============================================================
// Tipos de dominio compartidos (frontend + backend).
// Hoy viven en el almacén JSON (data/db.json); mañana pueden
// vivir en una base de datos real sin cambiar el resto del
// código: las firmas de store.ts se mantienen.
//
// Regla de venta: TODO el sitio vende CAJAS ENTERAS selladas.
// fields: stems_per_box, min_order_boxes, price_per_box (USD),
// cost_per_box_cop, stock_boxes.
// ============================================================

export type Lang = "en" | "es";

/** Tipo/variedad de clavel */
export type CarnationType = "standard" | "spray";

/** Familias de color (clave canónica para filtros).
 *  Alineadas con las fotos reales del catálogo (public/carnations):
 *  blanco, rosado, salmón, picotee, fucsia (incluye vino/borgoña)
 *  y surtido (ramos mezclados de mini clavel). */
export const COLOR_FAMILIES = [
  "white",
  "pink",
  "salmon",
  "picotee",
  "fuchsia",
  "mix",
] as const;

/** Condiciones de pago B2B (sin datos de tarjeta: facturaelectrónica) */
export type PaymentTerms = "prepaid" | "net30" | "net60" | "net90";

export const PAYMENT_TERMS_DAYS: Record<PaymentTerms, number> = {
  prepaid: 0,
  net30: 30,
  net60: 60,
  net90: 90,
};

export const PAYMENT_TERMS_LIST: PaymentTerms[] = [
  "prepaid",
  "net30",
  "net60",
  "net90",
];

export function isPaymentTerms(v: string): v is PaymentTerms {
  return (PAYMENT_TERMS_LIST as string[]).includes(v);
}

/** Estado de pago de la factura */
export type InvoiceStatus = "pending" | "paid";

/** Estado PÚBLICO del pago en seguimiento */
export function invoiceState(o: {
  paymentStatus: InvoiceStatus;
  dueDate: string;
  paymentTerms: PaymentTerms;
  awb?: string;
}): "pending" | "paid" | "overdue" {
  if (o.paymentStatus === "paid") return "paid";
  if (o.dueDate && new Date(o.dueDate) < new Date(todayISO())) return "overdue";
  return "pending";
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ------------------------------------------------------------
// TRACKING: la escalera de estados del pedido, en orden.
// ------------------------------------------------------------

export type OrderStatus =
  | "order_received" //  1. Pedido recibido
  | "payment_confirmed" // 2. Pago confirmado
  | "pickup_scheduled" //  3. Recogida en finca programada
  | "picked_up_farm" //    4. Recogido en finca aliada
  | "post_harvest_review" //5. Revisión y conteo en poscosecha
  | "export_docs_ready" // 6. Documentos de exportación listos (ICA y DIAN)
  | "delivered_airline" // 7. Entregado a la aerolínea
  | "in_transit" //        8. En tránsito
  | "arrival_us" //        9. Llegada a EE. UU. (aduana e inspección)
  | "delivered" //        10. Entregado
  | "cancelled";

/** Escalera de avance (sin el estado terminal cancelado) */
export const TRACKING_STATUSES: Exclude<OrderStatus, "cancelled">[] = [
  "order_received",
  "payment_confirmed",
  "pickup_scheduled",
  "picked_up_farm",
  "post_harvest_review",
  "export_docs_ready",
  "delivered_airline",
  "in_transit",
  "arrival_us",
  "delivered",
];

export function statusIndex(s: OrderStatus): number {
  return TRACKING_STATUSES.indexOf(s as Exclude<OrderStatus, "cancelled">);
}

/** El pedido se puede cancelar antes de entregarlo a la aerolínea */
export function canCancel(s: OrderStatus): boolean {
  const i = statusIndex(s);
  return i >= 0 && i < statusIndex("delivered_airline");
}

/** Siguiente estado en la escalera (null si está al final o cancelado) */
export function nextStatus(s: OrderStatus): OrderStatus | null {
  const i = statusIndex(s);
  if (i < 0 || i >= TRACKING_STATUSES.length - 1) return null;
  return TRACKING_STATUSES[i + 1];
}

/** Tipos de incidencia que mueven la fecha estimada de entrega */
export type IncidentKind = "delay" | "customs_hold";
export const INCIDENT_KINDS: IncidentKind[] = ["delay", "customs_hold"];

// ------------------------------------------------------------
// Productos
// ------------------------------------------------------------

export interface Product {
  id: string;
  variety: string; // nombre comercial de la variedad, ej. "Candela"
  name_en: string;
  name_es: string;
  desc_en: string;
  desc_es: string;
  type: CarnationType;
  colorFamily: string; // clave canónica: red, pink, white…
  stemsPerBox: number; // 200 (regla del negocio)
  minOrderBoxes: number; // pedido mínimo en cajas, ej. 5
  pricePerBoxUSD: number; // USD por caja (26–28 clavel; otros por confirmar)
  costPerBoxCOP: number; // costo de compra de la caja en COP (margen)
  stockBoxes: number; // disponibilidad en CAJAS
  grade: string; // ej. "Extra 55 cm"
  galleryUrls: string[]; // URLs pegadas por el admin
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// Clientes (compradores registrados; el checkout acepta clientes
// nuevos también: se registran al emitir el pedido)
// ------------------------------------------------------------

export interface Customer {
  id: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  state: string;
  postalCode: string;
  addressLine1: string;
  paymentTerms: PaymentTerms;
  tier: "large" | "small"; // grandes = crédito 60/90; pequeños = prepago
  createdAt: string;
}

// ------------------------------------------------------------
// Pedidos
// ------------------------------------------------------------

/** Línea de pedido: SIEMPRE en cajas enteras */
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  name_en: string;
  name_es: string;
  colorFamily: string;
  stemsPerBox: number;
  boxes: number; // entero ≥ minOrderBoxes
  stems: number; // boxes × stemsPerBox (calculado en servidor)
  pricePerBoxUSD: number;
  subtotalUSD: number; // boxes × pricePerBoxUSD (calculado en servidor)
  costPerBoxCOP: number; // snapshot del costo (margen en dashboard)
}

/** Datos del comprador en el pedido (snapshot del cliente o del checkout) */
export interface BuyerInfo {
  fullName: string;
  company: string;
  country: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  email: string;
  phone: string;
  notes?: string;
}

/** Evento del seguimiento (timeline vertical público) */
export interface TrackingEvent {
  id: string;
  orderId: string;
  type: "status" | "incident";
  status?: OrderStatus; // si type = "status"
  incidentKind?: IncidentKind; // si type = "incident"
  at: string; // ISO
  /** Código de ubicación traducido vía i18n (loc.*) */
  location:
    | "bogota"
    | "postharvest"
    | "allied_farm"
    | "bog_airport"
    | "us_airport"
    | "customs"
    | "transit"
    | "delivered_receiver";
  note?: string;
  recordedBy: string; // quién registró el evento
  /** Días que la incidencia movió la fecha estimada (si aplica) */
  etaShiftDays?: number;
}

export type InvoiceState = "pending" | "paid" | "overdue";

export interface Order {
  id: string; // ORD-2026-0001 (número de pedido visible)
  buyer: BuyerInfo;
  customerId?: string; // si corresponde a un cliente conocido
  totalUSD: number; // calculado en servidor (nunca confiar en cliente)
  paymentTerms: PaymentTerms;
  invoiceNumber: string; // FAC-2026-0141
  invoiceDate: string; // ISO fecha (día de emisión)
  dueDate: string; // ISO fecha de vencimiento según condiciones
  paymentStatus: InvoiceStatus; // pending | paid
  paidAt?: string; // ISO fecha de pago confirmado
  awb: string; // guía aérea generada al crear el pedido
  estimatedDelivery: string; // ISO +4 días desde pago confirmado (o incidencias)
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// Mensajes de contacto y configuración
// ------------------------------------------------------------

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  createdAt: string;
}

export interface Settings {
  /** Tasa usada para mostrar equivalencias COP */
  exchangeRateCOP: number;
  /** Costo inicial de referencia del clavel para el simulador */
  referenceCostBoxCOP: number;
  /** Umbral (cajas) para alerta de inventario bajo */
  lowStockThresholdBoxes: number;
}

// ------------------------------------------------------------
// Dashboard
// ------------------------------------------------------------

export interface DashboardQuery {
  /** "30d" | "90d" | "12m" */
  period: string;
}

export type DashboardPeriod = "30d" | "90d" | "12m";
export const DASHBOARD_PERIODS: DashboardPeriod[] = ["30d", "90d", "12m"];

export interface MonthBucket {
  key: string; // "2026-06"
  label: string; // "jun 2026"
  salesUSD: number;
}

export interface CustomerBucket {
  customerId: string;
  company: string;
  salesUSD: number;
  sharePct: number;
}

export interface AgingBucket {
  label: string; // "0–30", "31–60"…
  salesUSD: number;
  count: number;
}

export interface StatusBucket {
  status: OrderStatus;
  count: number;
}

export interface OverdueInvoice {
  orderId: string;
  orderNumber: string;
  customer: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalUSD: number;
  daysOverdue: number;
}

export interface ProblemOrder {
  orderId: string;
  orderNumber: string;
  customer: string;
  status: OrderStatus;
  issue: "incident" | "late_delivery";
  detail: string;
}

export interface DashboardMetrics {
  generatedAt: string;
  period: DashboardPeriod;
  fromISO: string;
  totals: {
    salesUSD: number;
    boxesSold: number;
    stemsSold: number;
    ordersCount: number;
    avgOrderUSD: number;
    avgPricePerStemUSD: number;
    marginPerBoxCOP: number;
    marginTotalCOP: number;
    marginPct: number;
    receivableUSD: number;
    avgCollectionDays: number;
    onTimePct: number;
    incidentPct: number;
  };
  byMonth: MonthBucket[];
  byCustomer: CustomerBucket[];
  top3SharePct: number; // alerta si > 70
  receivablesByAging: AgingBucket[];
  byStatus: StatusBucket[];
  onTimeVsLate: { onTime: number; late: number };
  overdueInvoices: OverdueInvoice[];
  problemOrders: ProblemOrder[];
}
