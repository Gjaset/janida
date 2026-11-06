// GET/PATCH /api/admin/orders/[id]
// PATCH aplica el flujo de estados:
//   pendiente → confirmado | cancelado
//   confirmado → en_transito | cancelado
//   en_transito → entregado
// (cancelar solo desde pendiente o confirmado; ver docs).
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { statusSchema } from "@/lib/validation";
import { applyStatusTransition, getOrder } from "@/lib/orders";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ order });
}

export async function PATCH(
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
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Estado inválido.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }
  const result = await applyStatusTransition(id, parsed.data.status, parsed.data.note);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json({ ok: true, order: result.order });
}
