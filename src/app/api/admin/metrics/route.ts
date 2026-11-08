// GET /api/admin/metrics?period=30d|90d|12m — métricas del panel.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { computeDashboardMetrics } from "@/lib/metrics";

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const period =
    new URL(req.url).searchParams.get("period") ?? "90d";
  const metrics = await computeDashboardMetrics(period);
  return NextResponse.json(metrics);
}
