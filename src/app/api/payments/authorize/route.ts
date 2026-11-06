// POST /api/payments/authorize — PASO DE PAGO SIMULADO.
// Simula un gateway tipo Stripe (MockPay) contra el intento creado
// en /api/checkout/session. NO hay cobros reales; solo tarjetas de
// prueba (ver tarjeta de ayuda en la UI y docs/STRIPE-INTEGRATION.md).
import { NextResponse } from "next/server";
import { cardSchema } from "@/lib/validation";
import { authorizePayment } from "@/lib/payments";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const card = cardSchema.safeParse(body);
  if (!card.success) {
    return NextResponse.json(
      { status: "failed", reason: "invalid", message: "Datos de tarjeta inválidos." },
      { status: 422 }
    );
  }
  const { pid } = new URL(req.url).searchParams
    ? { pid: String(new URL(req.url).searchParams.get("pid") ?? "") }
    : { pid: "" };
  if (!pid) {
    return NextResponse.json(
      { status: "failed", reason: "not_found", message: "Falta el id de sesión de pago." },
      { status: 400 }
    );
  }
  const result = await authorizePayment(pid, card.data);
  return NextResponse.json(result);
}
