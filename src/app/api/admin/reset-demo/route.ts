// POST /api/admin/reset-demo — restaura los datos de demostración
// a estado inicial (borra pedidos/pagos y restaura catálogo).
// Protegido por sesión de admin.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { resetToSeed } from "@/lib/store";

export async function POST() {
  const guard = await requireAdmin();
  if (guard) return guard;
  await resetToSeed();
  return NextResponse.json({ ok: true });
}
