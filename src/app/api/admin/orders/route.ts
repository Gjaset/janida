// GET /api/admin/orders — lista de pedidos (protegido), ordenada
// de más reciente a más antigua.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { listOrders } from "@/lib/store";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;
  const orders = await listOrders();
  const sorted = [...orders].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  return NextResponse.json({ orders: sorted });
}
