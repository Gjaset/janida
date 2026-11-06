// ============================================================
// Pedidos: creación ligada al pago simulado y transiciones de
// estado (pendiente → confirmado → en tránsito → entregado;
// cancelado permitido desde pendiente y confirmado).
// ============================================================
import crypto from "node:crypto";
import { readDb, updateDb } from "./store";
import type { Order, OrderItem, OrderStatus, PaymentIntent } from "./types";
import { canTransition } from "./types";

export type CreateOrderResult =
  | { ok: true; order: Order }
  | { ok: false; error: string };

function nextOrderId(seq: number): string {
  const year = new Date().getFullYear();
  return `ORD-${year}-${String(seq + 1).padStart(4, "0")}`;
}

function genRef(): string {
  return `mo_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

/**
 * Crea el pedido a partir de un intento de pago SIMULADO aprobado.
 * Transaccional: descuenta la disponibilidad (paquetes) y marca el
 * intento como exitoso en la misma escritura.
 */
export async function createOrderFromPayment(
  intent: PaymentIntent,
  paymentBrand: string
): Promise<CreateOrderResult> {
  const now = new Date().toISOString();
  let created: Order | null = null;

  await updateDb((db) => {
    const idx = db.payments.findIndex((p) => p.pid === intent.pid);
    const local = idx >= 0 ? db.payments[idx] : intent;
    if (local.status !== "requires_payment") {
      return; // no re-procesar (idempotencia)
    }

    // Descuento de inventario (paquetes)
    for (const item of local.items) {
      const p = db.products.find((x) => x.id === item.productId);
      if (p) p.packagesAvailable = Math.max(0, p.packagesAvailable - item.packages);
    }

    const id = nextOrderId(db.counters.orderSeq ?? 0);
    db.counters.orderSeq = (db.counters.orderSeq ?? 0) + 1;

    const order: Order = {
      id,
      buyer: { ...local.buyer },
      items: JSON.parse(JSON.stringify(local.items)) as OrderItem[],
      subtotalUSD: local.amountUSD,
      shippingUSD: 0, // demo: flete y hortalización incluidos
      totalUSD: local.amountUSD,
      totalCOP: local.totalCOP,
      exchangeRate: local.exchangeRate,
      status: "pendiente",
      history: [
        { status: "pago_aprobado", at: now, note: `Pago simulado ${paymentBrand}` },
        { status: "pendiente", at: now },
      ],
      paymentRef: genRef(),
      paymentBrand,
      createdAt: now,
      updatedAt: now,
    };
    db.orders.push(order);

    // Cierra el intento
    local.status = "succeeded";
    local.orderId = id;
    local.updatedAt = now;
    created = order;
  });

  if (!created) return { ok: false, error: "El pago ya fue procesado." };
  return { ok: true, order: created };
}

export type TransitionResult =
  | { ok: true; order: Order }
  | { ok: false; error: string };

/**
 * Aplica una transición de estado válida al flujo del pedido.
 * Si se cancela, devuelve los paquetes al inventario (demo).
 */
export async function applyStatusTransition(
  orderId: string,
  to: OrderStatus,
  note?: string
): Promise<TransitionResult> {
  const now = new Date().toISOString();
  let result: TransitionResult | null = null;

  await updateDb((db) => {
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) {
      result = { ok: false, error: "Pedido no encontrado." };
      return;
    }
    if (order.status === to) {
      result = { ok: false, error: `El pedido ya está "${to}".` };
      return;
    }
    if (!canTransition(order.status, to)) {
      result = {
        ok: false,
        error: `Transición inválida: no se puede pasar de "${order.status}" a "${to}".`,
      };
      return;
    }
    const from = order.status;
    order.status = to;
    order.updatedAt = now;
    order.history.push({ status: to, at: now, note });

    // Al cancelar, devuelve los paquetes al inventario (demo)
    if (to === "cancelado" && (from === "pendiente" || from === "confirmado")) {
      for (const item of order.items) {
        const p = db.products.find((x) => x.id === item.productId);
        if (p) p.packagesAvailable += item.packages;
      }
    }
    result = { ok: true, order };
  });

  return result ?? { ok: false, error: "No se pudo actualizar el pedido." };
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const db = await readDb();
  return db.orders.find((o) => o.id === id);
}
