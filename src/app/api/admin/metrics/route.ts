// GET /api/admin/metrics — métricas del dashboard (protegido).
// Calculadas SIEMPRE por el servidor a partir de los pedidos y
// productos del almacén; el frontend solo dibuja los números.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { computeDashboardMetrics } from "@/lib/metrics";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;
  const metrics = await computeDashboardMetrics();
  return NextResponse.json(metrics);
}
