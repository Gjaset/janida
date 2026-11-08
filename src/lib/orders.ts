// ============================================================
// Pedidos: emisión (checkout B2B con factura), flujo de la
// escalera de tracking, incidencias que mueven la ETA, pago
// confirmado y cancelación con devolución de inventario.
//
// Reglas de servidor:
// - Totales, tallos y vencimientos SIEMPRE se calculan aquí.
// - La venta es por cajas enteras; se respeta min_order_boxes.
// - El evento de pago confirmado recalcula la ETA (4 días desde
//   el pago) y las incidencias la corren hacia adelante.
// ============================================================
import crypto from "node:crypto";
import { readDb, updateDb } from "./store";
import type {
  BuyerInfo,
  IncidentKind,
  InvoiceStatus,
  Order,
  OrderItem,
  OrderStatus,
  PaymentTerms,
  Product,
  TrackingEvent,
} from "./types";
import {
  INCIDENT_KINDS,
  PAYMENT_TERMS_DAYS,
  TRACKING_STATUSES,
  canCancel,
  nextStatus,
  statusIndex,
} from "./types";
import type { CheckoutInput } from "./validation";

// ---------------------- utilidades ----------------------
export type CreateOrderResult =
  | { ok: true; order: Order; items: OrderItem[] }
  | { ok: false; error: string; code?: string };

export type ActionOk = { ok: true; order: Order; message?: string };
export type ActionErr = { ok: false; error: string };
export type ActionResult = ActionOk | ActionErr;

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function addDaysDateOnly(iso: string, days: number): string {
  return addDaysISO(iso, days).slice(0, 10);
}

function newUid(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
}

function nextNumber(seq: number, prefix: string): string {
  const year = new Date().getFullYear();
  return `${prefix}${year}-${String(seq + 1).padStart(4, "0")}`;
}

/** Guía aérea (AWB) ficticia con prefijo IATA 014-XXXXXXXX */
function genAWB(): string {
  return `014-${String(crypto.randomInt(0, 1_000_000_00)).padStart(8, "0")}`;
}

/** Ubicación por defecto del evento según el estado alcanzado */
const STATUS_LOCATION: Record<
  Exclude<OrderStatus, "cancelled">,
  TrackingEvent["location"]
> = {
  order_received: "bogota",
  payment_confirmed: "bogota",
  pickup_scheduled: "allied_farm",
  picked_up_farm: "allied_farm",
  post_harvest_review: "postharvest",
  export_docs_ready: "bogota",
  delivered_airline: "bog_airport",
  in_transit: "transit",
  arrival_us: "customs",
  delivered: "delivered_receiver",
};

/** Días de corrimiento de la ETA por tipo de incidencia */
const INCIDENT_SHIFT_DAYS: Record<IncidentKind, number> = {
  delay: 3,
  customs_hold: 4,
};

/**
 * Reescribe order.estimatedDelivery:
 *   base = paidAt (pago confirmado) o invoiceDate
 *   + 4 días (2 de recogida y preparación + 2 de vuelo y entrega)
 *   + corrimientos acumulados por incidencias.
 */
function recomputeETA(order: Order, events: TrackingEvent[]): void {
  const base = order.paidAt ?? order.invoiceDate;
  const shifts = events
    .filter((e) => e.type === "incident" && e.etaShiftDays)
    .reduce((a, e) => a + (e.etaShiftDays ?? 0), 0);
  order.estimatedDelivery = addDaysISO(base, 4 + shifts);
}

// ---------------------- creación ----------------------
/**
 * Emite el pedido desde el checkout. Valida contra los productos
 * reales (activo, disponibilidad, pedido mínimo), calcula todos
 * los totales en el servidor, genera número de pedido, factura,
 * AWB y fecha estimada, y registra el primer evento.
 */
export async function createOrder(
  input: CheckoutInput
): Promise<CreateOrderResult> {
  const nowISO = new Date().toISOString();
  const today = nowISO.slice(0, 10);

  let created: Order | null = null;
  let createdItems: OrderItem[] = [];
  let failure: { error: string; code?: string } | null = null;

  await updateDb((db) => {
    // Resuelve y valida cada línea contra los productos reales
    const lines: OrderItem[] = [];
    for (const raw of input.items) {
      const p = db.products.find((x) => x.id === raw.productId && x.active);
      if (!p) {
        failure = { error: "Producto no disponible.", code: "product" };
        return;
      }
      if (!Number.isInteger(raw.boxes) || raw.boxes < p.minOrderBoxes) {
        failure = {
          error: `Pedido mínimo de ${p.name_en}: ${p.minOrderBoxes} cajas.`,
          code: "min_order",
        };
        return;
      }
      if (raw.boxes > p.stockBoxes) {
        failure = {
          error: `Disponibilidad insuficiente de ${p.name_en} (${p.stockBoxes} cajas).`,
          code: "stock",
        };
        return;
      }
      const boxes = Math.floor(raw.boxes);
      lines.push({
        id: newUid(),
        orderId: "", // se asigna abajo
        productId: p.id,
        name_en: p.name_en,
        name_es: p.name_es,
        colorFamily: p.colorFamily,
        stemsPerBox: p.stemsPerBox,
        boxes,
        stems: boxes * p.stemsPerBox,
        pricePerBoxUSD: p.pricePerBoxUSD,
        subtotalUSD: Math.round(boxes * p.pricePerBoxUSD * 100) / 100,
        costPerBoxCOP: p.costPerBoxCOP,
      });
    }

    const id = nextNumber(db.counters.orderSeq ?? 0, "ORD-");
    db.counters.orderSeq = (db.counters.orderSeq ?? 0) + 1;

    // Factura: se emite el mismo día; vence según condiciones
    const terms = input.paymentTerms as PaymentTerms;
    const invoiceNumber = nextNumber(db.counters.invoiceSeq ?? 0, "FAC-");
    db.counters.invoiceSeq = (db.counters.invoiceSeq ?? 0) + 1;
    const dueDate = addDaysDateOnly(today, PAYMENT_TERMS_DAYS[terms]);

    const buyer: BuyerInfo = { ...input.buyer };

    const order: Order = {
      id,
      buyer,
      totalUSD: Math.round(lines.reduce((a, l) => a + l.subtotalUSD, 0) * 100) / 100,
      paymentTerms: terms,
      invoiceNumber,
      invoiceDate: today,
      dueDate,
      paymentStatus: "pending" as InvoiceStatus,
      awb: genAWB(),
      estimatedDelivery: addDaysISO(today, 4),
      status: "order_received",
      createdAt: nowISO,
      updatedAt: nowISO,
    };

    // Primer evento del tracking
    const event: TrackingEvent = {
      id: newUid(),
      orderId: id,
      type: "status",
      status: "order_received",
      at: nowISO,
      location: STATUS_LOCATION.order_received,
      recordedBy: "Programación Janida",
      note: buyer.notes ? `Notas: ${buyer.notes}` : undefined,
    };

    for (const line of lines) line.orderId = id;
    db.order_items.push(...lines);
    db.tracking_events.push(event);
    db.orders.push(order);

    created = order;
    createdItems = lines;
  });

  // TS no rastrea la asignación dentro del callback de updateDb:
  // se ensancha manualmente al tipo declarado.
  const f = failure as { error: string; code?: string } | null;
  if (f) return { ok: false, error: f.error, code: f.code };
  if (!created) return { ok: false, error: "No se pudo emitir el pedido." };
  return { ok: true, order: created, items: createdItems };
}

// ---------------------- acciones admin ----------------------
/** Avanza el pedido al siguiente estado de la escalera de tracking. */
export async function advanceOrder(
  orderId: string,
  recordedBy: string,
  note?: string
): Promise<ActionResult> {
  const nowISO = new Date().toISOString();
  let result: ActionResult | null = null;

  await updateDb((db) => {
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) {
      result = { ok: false, error: "Pedido no encontrado." };
      return;
    }
    const to = nextStatus(order.status);
    if (!to) {
      result = {
        ok: false,
        error:
          order.status === "cancelled"
            ? "El pedido está cancelado."
            : "El pedido ya está entregado.",
      };
      return;
    }
    applyStatus(order, to, nowISO, recordedBy, note, db);

    // Al llegar a revisión y conteo, el conteo ya se registró:
    // los tallos contados quedan visibles (order_items.stems).
    result = { ok: true, order };
  });

  return result ?? { ok: false, error: "No se pudo actualizar el pedido." };
}

/** Marca la factura pagada (confirma el pago) y recalcula la ETA. */
export async function markOrderPaid(
  orderId: string,
  recordedBy: string,
  note?: string
): Promise<ActionResult> {
  const nowISO = new Date().toISOString();
  let result: ActionResult | null = null;

  await updateDb((db) => {
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) {
      result = { ok: false, error: "Pedido no encontrado." };
      return;
    }
    if (order.paymentStatus === "paid") {
      // Idempotente: marcar dos veces no crea eventos duplicados
      result = { ok: true, order, message: "already_paid" };
      return;
    }
    order.paymentStatus = "paid";
    order.paidAt = nowISO.slice(0, 10);
    order.updatedAt = nowISO;

    const events = db.tracking_events.filter((e) => e.orderId === orderId);
    recomputeETA(order, events);

    const hasPaymentEvent = events.some(
      (e) => e.type === "status" && e.status === "payment_confirmed"
    );
    // Pago confirmado: no duplicar el evento si ya existe. Si el
    // pedido aún está en "order_received" se aplica el estado; si
    // ya avanzó más allá, se registra el evento sin retroceder.
    if (!hasPaymentEvent) {
      if (order.status === "order_received") {
        applyStatus(order, "payment_confirmed", nowISO, recordedBy, note, db);
      } else {
        db.tracking_events.push({
          id: newUid(),
          orderId: order.id,
          type: "status",
          status: "payment_confirmed",
          at: nowISO,
          location: STATUS_LOCATION.payment_confirmed,
          recordedBy,
          note,
        });
      }
    }
    result = { ok: true, order };
  });

  return result ?? { ok: false, error: "No se pudo actualizar el pedido." };
}

/** Cancela un pedido (solo antes de entregarlo a la aerolínea). */
export async function cancelOrder(
  orderId: string,
  recordedBy: string,
  note?: string
): Promise<ActionResult> {
  const nowISO = new Date().toISOString();
  let result: ActionResult | null = null;

  await updateDb((db) => {
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) {
      result = { ok: false, error: "Pedido no encontrado." };
      return;
    }
    if (order.status === "cancelled") {
      result = { ok: false, error: "El pedido ya está cancelado." };
      return;
    }
    if (!canCancel(order.status)) {
      result = {
        ok: false,
        error: "No se puede cancelar: la flor ya fue entregada a la aerolínea.",
      };
      return;
    }
    // Devuelve las cajas al inventario
    for (const item of db.order_items.filter((i) => i.orderId === orderId)) {
      const p = db.products.find((x) => x.id === item.productId);
      if (p) p.stockBoxes += item.boxes;
    }
    applyStatus(order, "cancelled", nowISO, recordedBy, note, db);
    result = { ok: true, order };
  });

  return result ?? { ok: false, error: "No se pudo actualizar el pedido." };
}

/** Registra una incidencia (retraso / retención en aduana) y mueve la ETA. */
export async function addIncident(
  orderId: string,
  kind: IncidentKind,
  recordedBy: string,
  note?: string
): Promise<ActionResult> {
  const nowISO = new Date().toISOString();
  let result: ActionResult | null = null;

  await updateDb((db) => {
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) {
      result = { ok: false, error: "Pedido no encontrado." };
      return;
    }
    if (order.status === "cancelled") {
      result = { ok: false, error: "El pedido está cancelado." };
      return;
    }
    const shift = INCIDENT_SHIFT_DAYS[kind];
    const prevETA = order.estimatedDelivery.slice(0, 10);
    order.updatedAt = nowISO;

    // IMPORTANTE: push directo al almacén — filter() devuelve una
    // copia y los eventos de la copia no se persistirían.
    db.tracking_events.push({
      id: newUid(),
      orderId: order.id,
      type: "incident",
      incidentKind: kind,
      at: nowISO,
      location: kind === "customs_hold" ? "customs" : "transit",
      recordedBy,
      etaShiftDays: shift,
      note,
    });
    const events = db.tracking_events.filter((e) => e.orderId === orderId);
    recomputeETA(order, events);
    result = {
      ok: true,
      order,
      message: `${prevETA}→${order.estimatedDelivery.slice(0, 10)}`,
    };
  });

  return result ?? { ok: false, error: "No se pudo registrar la incidencia." };
}

// ---------------------- interno ----------------------
/** Aplica un estado (avance o cancelación) escribiendo el evento. */
function applyStatus(
  order: Order,
  to: OrderStatus,
  atISO: string,
  recordedBy: string,
  note: string | undefined,
  db: {
    tracking_events: TrackingEvent[];
  }
): void {
  order.status = to;
  order.updatedAt = atISO;
  const index = statusIndex(to as OrderStatus);
  const location =
    to === "cancelled"
      ? "bogota"
      : STATUS_LOCATION[TRACKING_STATUSES[index] as Exclude<OrderStatus, "cancelled">];
  db.tracking_events.push({
    id: newUid(),
    orderId: order.id,
    type: "status",
    status: to,
    at: atISO,
    location,
    recordedBy,
    note,
  });
}

// ---------------------- lectura pública ----------------------
/**
 * Búsqueda de seguimiento por número y correo: el cliente solo
 * ve su pedido cuando número y correo coinciden exactamente.
 */
export async function findPublicOrder(
  orderNumber: string,
  email: string
):
 Promise<
    | { ok: true; order: Order; items: OrderItem[]; events: TrackingEvent[] }
    | { ok: false }
  > {
  const db = await readDb();
  const order = db.orders.find(
    (o) =>
      o.id === orderNumber.trim().toUpperCase() &&
      o.buyer.email.trim().toLowerCase() === email.trim().toLowerCase()
  );
  if (!order) return { ok: false };
  const items = db.order_items.filter((i) => i.orderId === order.id);
  const events = db.tracking_events
    .filter((e) => e.orderId === order.id)
    .sort((a, b) => a.at.localeCompare(b.at));
  return { ok: true, order, items, events };
}

export { INCIDENT_KINDS };
