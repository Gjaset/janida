// POST /api/checkout/session
// Crea la sesión/snapshot de pago (tipo PaymentIntent) con los
// datos del comprador y el carrito. NO procesa el pago: eso pasa
// en /api/payments/authorize desde la página del gateway simulado.
import { NextResponse } from "next/server";
import { checkoutSchema, buyerSchema } from "@/lib/validation";
import { snapshotCart, createPaymentIntent } from "@/lib/payments";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos del pedido inválidos.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const snap = await snapshotCart(parsed.data.items);
  if (!snap.ok) {
    return NextResponse.json({ error: snap.error }, { status: 409 });
  }

  const intent = await createPaymentIntent(
    parsed.data.buyer as import("@/lib/types").BuyerInfo,
    snap.items,
    snap.totalUSD
  );
  return NextResponse.json({ pid: intent.pid, totalUSD: intent.amountUSD });
}
