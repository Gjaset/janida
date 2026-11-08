// POST /api/track — seguimiento público: el cliente consulta su
// pedido con número + correo (solo ve SUS datos cuando ambos
// coinciden). Devuelve el pedido, líneas y eventos del timeline.
import { NextResponse } from "next/server";
import { trackSchema } from "@/lib/validation";
import { findPublicOrder } from "@/lib/orders";
import { getSettings } from "@/lib/store";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 422 });
  }
  const result = await findPublicOrder(
    parsed.data.orderNumber,
    parsed.data.email
  );
  if (!result.ok) return NextResponse.json({ ok: false }, { status: 404 });

  const settings = await getSettings();
  const { order, items, events } = result;
  return NextResponse.json({
    ok: true,
    order: {
      id: order.id,
      buyer: {
        fullName: order.buyer.fullName,
        company: order.buyer.company,
        city: order.buyer.city,
        state: order.buyer.state,
      },
      totalUSD: order.totalUSD,
      paymentTerms: order.paymentTerms,
      invoiceNumber: order.invoiceNumber,
      invoiceDate: order.invoiceDate,
      dueDate: order.dueDate,
      paymentStatus: order.paymentStatus,
      paidAt: order.paidAt ?? null,
      awb: order.awb,
      estimatedDelivery: order.estimatedDelivery,
      status: order.status,
      createdAt: order.createdAt,
    },
    items: items.map((i) => ({
      productId: i.productId,
      nameEn: i.name_en,
      nameEs: i.name_es,
      boxes: i.boxes,
      stems: i.stems,
      pricePerBoxUSD: i.pricePerBoxUSD,
      subtotalUSD: i.subtotalUSD,
    })),
    events: events.map((e) => ({
      type: e.type,
      status: e.status ?? null,
      incidentKind: e.incidentKind ?? null,
      at: e.at,
      location: e.location,
      note: e.note ?? null,
      recordedBy: e.recordedBy,
      etaShiftDays: e.etaShiftDays ?? null,
    })),
    exchangeRateCOP: settings.exchangeRateCOP,
  });
}
