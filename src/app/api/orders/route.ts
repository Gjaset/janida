// POST /api/orders — emite un pedido del checkout B2B.
// Valida comprador + términos de pago + líneas (cajas enteras),
// calcula TODO en el servidor (totales, tallos, factura, vencimiento,
// AWB, ETA 4 días) y crea el primer evento de tracking.
// No se piden datos de tarjeta: el pago se maneja por factura.
import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validation";
import { createOrder } from "@/lib/orders";

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
      { error: "Datos inválidos", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }
  const result = await createOrder(parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: 409 }
    );
  }
  return NextResponse.json(
    {
      ok: true,
      orderNumber: result.order.id,
      invoiceNumber: result.order.invoiceNumber,
      dueDate: result.order.dueDate,
      totalUSD: result.order.totalUSD,
      estimatedDelivery: result.order.estimatedDelivery,
      awb: result.order.awb,
    },
    { status: 201 }
  );
}
