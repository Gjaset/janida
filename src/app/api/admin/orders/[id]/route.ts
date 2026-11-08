// POST /api/admin/orders/[id] — acciones del panel sobre un pedido:
//   { action: "advance" }    avanza al siguiente estado de la escalera
//   { action: "mark_paid" }  confirma el pago / factura pagada
//   { action: "cancel" }     cancela (solo antes de entregar a aerolínea)
// Todas registran eventos en el tracking.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { advanceSchema } from "@/lib/validation";
import { advanceOrder, cancelOrder, markOrderPaid } from "@/lib/orders";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = advanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Acción inválida" }, { status: 422 });
  }

  const by = "Equipo Janida";
  const { action, note } = parsed.data;
  const result =
    action === "advance"
      ? await advanceOrder(id, by, note)
      : action === "mark_paid"
        ? await markOrderPaid(id, by, note)
        : await cancelOrder(id, by, note);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json({ ok: true, orderId: id, message: result.message });
}
