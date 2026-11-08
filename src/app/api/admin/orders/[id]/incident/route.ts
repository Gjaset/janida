// POST /api/admin/orders/[id]/incident — registra una incidencia
// (delay | customs_hold). Mueve automáticamente la fecha estimada
// de entrega (delay +3 días, retención en aduana +4 días).
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { incidentSchema } from "@/lib/validation";
import { addIncident } from "@/lib/orders";

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
  const parsed = incidentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Incidencia inválida" }, { status: 422 });
  }
  const result = await addIncident(
    id,
    parsed.data.kind,
    "Equipo Janida",
    parsed.data.note
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json({ ok: true, orderId: id, message: result.message });
}
