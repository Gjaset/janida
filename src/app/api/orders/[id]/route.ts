// GET /api/orders/[id] — resumen del pedido (público para el
// comprador con el enlace de confirmación). Devuelve solo los
// campos necesarios para la página de confirmación.
import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }
  return NextResponse.json({
    id: order.id,
    status: order.status,
    totalUSD: order.totalUSD,
    totalCOP: order.totalCOP,
    exchangeRate: order.exchangeRate,
    items: order.items,
    buyer: {
      fullName: order.buyer.fullName,
      company: order.buyer.company,
      city: order.buyer.city,
      state: order.buyer.state,
      country: order.buyer.country,
    },
    paymentRef: order.paymentRef,
    paymentBrand: order.paymentBrand,
    createdAt: order.createdAt,
  });
}
