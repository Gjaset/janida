// ============================================================
// PASARELA DE PAGO SIMULADA (MockPay)
// ------------------------------------------------------------
// ⚠️  SIMULACIÓN: no existen cargos ni procesamiento real de
// tarjetas. Solo se aceptan números de prueba (tipo Stripe):
//
//   ✔ Aprobadas:
//     4242 4242 4242 4242   Visa
//     5555 5555 5555 4444   Mastercard
//     3782 822463 10005     American Express
//
//   ✖ Rechazadas:
//     4000 0000 0000 0002   tarjeta declinada
//     4000 0000 0000 9995   fondos insuficientes
//     4000 0000 0000 0069   tarjeta expirada
//
// El estado del intento vive en el almacén (data/db.json), igual
// que un PaymentIntent de Stripe. La migración a Stripe real solo
// implica cambiar este módulo (ver docs/STRIPE-INTEGRATION.md).
// ============================================================
import crypto from "node:crypto";
import {
  createOrderFromPayment,
  type CreateOrderResult,
} from "./orders";
import { EXCHANGE_RATE_COP } from "./config";
import { readDb, updateDb } from "./store";
import type {
  BuyerInfo,
  CardBrand,
  OrderItem,
  PaymentIntent,
} from "./types";
import type { CardInput } from "./validation";

export type MockCardOutcome =
  | { ok: true; brand: CardBrand; last4: string }
  | { ok: false; reason: "card_declined" | "insufficient_funds" | "expired_card" };

/** Tarjetas de prueba del gateway mock (registro Stripe-like) */
const TEST_CARDS: Record<string, MockCardOutcome> = {
  "4242424242424242": { ok: true, brand: "Visa", last4: "4242" },
  "5555555555554444": { ok: true, brand: "Mastercard", last4: "4444" },
  "378282246310005": { ok: true, brand: "American Express", last4: "0005" },
  "4000000000000002": { ok: false, reason: "card_declined" },
  "4000000000009995": { ok: false, reason: "insufficient_funds" },
  "4000000000000069": { ok: false, reason: "expired_card" },
};

function authorize(card: CardInput): MockCardOutcome {
  const outcome = TEST_CARDS[card.cardNumber];
  if (!outcome) return { ok: false, reason: "card_declined" };
  if (outcome.ok) {
    // "Expiración" simulada: si el usuario teclea un año muy lejano
    // (> 2040) el gateway mock lo marca cortesmente como inválido.
    if (Number(card.expYear) > 2040) {
      return { ok: false, reason: "expired_card" };
    }
    return outcome;
  }
  return outcome;
}

function payLabel(c: MockCardOutcome & { ok: true }): string {
  return `MockPay ${c.brand} ···· ${c.last4}`;
}

function genPid(): string {
  return `pi_demo_${crypto.randomBytes(8).toString("hex")}`;
}

/** Snapshot de carrito validado contra el almacén (precios reales) */
export async function snapshotCart(
  rawItems: { productId: string; packages: number }[]
): Promise<
  { ok: true; items: OrderItem[]; totalUSD: number } | { ok: false; error: string }
> {
  const db = await readDb();
  const items: OrderItem[] = [];
  for (const raw of rawItems) {
    const p = db.products.find((x) => x.id === raw.productId);
    if (!p || !p.active) return { ok: false, error: `Producto no disponible: ${raw.productId}` };
    if (raw.packages < 1 || raw.packages > p.packagesAvailable) {
      return {
        ok: false,
        error: `Stock disponible de "${p.name}" (${p.packagesAvailable} paquetes) menor a lo solicitado (${raw.packages})`,
      };
    }
    items.push({
      productId: p.id,
      productName: p.name,
      variety: p.variety,
      colorFamily: p.colorFamily,
      presentation: p.presentation,
      packageSize: p.packageSize,
      packages: raw.packages,
      unitPriceUSD: p.priceUSD,
      subtotalUSD: Math.round(raw.packages * p.priceUSD * 100) / 100,
    });
  }
  const totalUSD = items.reduce((a, i) => a + i.subtotalUSD, 0);
  return { ok: true, items, totalUSD: Math.round(totalUSD * 100) / 100 };
}

/** Crea el intento de pago (aún sin procesar) */
export async function createPaymentIntent(
  buyer: BuyerInfo,
  items: OrderItem[],
  totalUSD: number
): Promise<PaymentIntent> {
  const rate = EXCHANGE_RATE_COP;
  const pid = genPid();
  const now = new Date().toISOString();
  const intent: PaymentIntent = {
    pid,
    status: "requires_payment",
    amountUSD: totalUSD,
    exchangeRate: rate,
    totalCOP: Math.round(totalUSD * rate),
    items,
    buyer,
    createdAt: now,
    updatedAt: now,
  };
  await updateDb((db) => {
    db.payments.push(intent);
  });
  return intent;
}

export type AuthorizeResult =
  | { status: "succeeded"; redirectUrl: string; orderId: string; paymentRef: string }
  | { status: "failed"; reason: string; message: string };

/**
 * Procesa (simula) el pago y, si es exitoso, crea el pedido.
 * NOTA: la demora de 900 ms simula la latencia del gateway real.
 */
export async function authorizePayment(
  pid: string,
  card: CardInput
): Promise<AuthorizeResult> {
  await new Promise((r) => setTimeout(r, 900)); // latencia simulada

  const db = await readDb();
  const intent = db.payments.find((p) => p.pid === pid);
  if (!intent) return { status: "failed", reason: "not_found", message: "Sesión de pago no encontrada." };
  if (intent.status !== "requires_payment") {
    return {
      status: "failed",
      reason: "already_used",
      message: "Este intento de pago ya fue procesado.",
    };
  }

  const outcome = authorize(card);
  if (!outcome.ok) {
    // El intento permanece "requires_payment" para permitir reintento
    // con otra tarjeta (comportamiento tipo Stripe).
    await updateDb((db2) => {
      const int = db2.payments.find((p) => p.pid === pid);
      if (int) {
        int.failureReason = outcome.reason;
        int.updatedAt = new Date().toISOString();
      }
    });
    return {
      status: "failed",
      reason: outcome.reason,
      message: FAILURE_MESSAGES[outcome.reason],
    };
  }

  // Sistema de re-validación: stock al momento de pagar
  const snap = await snapshotCart(
    intent.items.map((i) => ({ productId: i.productId, packages: i.packages }))
  );
  if (!snap.ok) {
    await updateDb((db2) => {
      const int = db2.payments.find((p) => p.pid === pid);
      if (int) {
        int.failureReason = "insufficient_stock";
        int.updatedAt = new Date().toISOString();
      }
    });
    return { status: "failed", reason: "insufficient_stock", message: snap.error };
  }

  const created: CreateOrderResult = await createOrderFromPayment(
    intent,
    payLabel(outcome)
  );
  if (!created.ok) {
    return { status: "failed", reason: "order_error", message: created.error };
  }
  return {
    status: "succeeded",
    redirectUrl: `/orders/${created.order.id}`,
    orderId: created.order.id,
    paymentRef: created.order.paymentRef,
  };
}

export const FAILURE_MESSAGES: Record<string, string> = {
  card_declined: "Pago rechazado por el banco emisor (tarjeta declinada).",
  insufficient_funds: "Fondos insuficientes en la tarjeta.",
  expired_card: "La tarjeta está expirada.",
  insufficient_stock:
    "Los paquetes disponibles cambiaron mientras pagabas. Ajusta tu carrito e intenta de nuevo.",
  not_found: "Sesión de pago no encontrada.",
  already_used: "Este pago ya fue procesado.",
  invalid: "Datos de tarjeta inválidos. Usa los números de prueba.",
  order_error: "No se pudo registrar el pedido.",
};
