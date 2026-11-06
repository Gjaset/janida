// GET /api/payments/[pid] — resumen del intento de pago simulado
// para pintar la hoja del gateway MockPay (equivalente a consultar
// un PaymentIntent en Stripe).
import { NextResponse } from "next/server";
import { readDb } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pid: string }> }
) {
  const { pid } = await params;
  const db = await readDb();
  const intent = db.payments.find((p) => p.pid === pid);
  if (!intent) {
    return NextResponse.json({ error: "Sesión de pago no encontrada." }, { status: 404 });
  }
  return NextResponse.json({
    pid: intent.pid,
    status: intent.status,
    amountUSD: intent.amountUSD,
    totalCOP: intent.totalCOP,
    packages: intent.items.reduce((a, i) => a + i.packages, 0),
    lines: intent.items.length,
    buyerName: intent.buyer.fullName,
    orderId: intent.orderId,
  });
}
