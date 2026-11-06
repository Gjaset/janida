// GET /api/products — catálogo público (solo productos activos).
// Filtros simples en servidor; el catálogo también refina en
// cliente para búsqueda instantánea.
import { NextResponse } from "next/server";
import { listProducts } from "@/lib/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const color = searchParams.get("color");
  const products = await listProducts();
  const filtered = products.filter((p) => {
    if (type && p.type !== type) return false;
    if (color && p.colorFamily !== color) return false;
    return true;
  });
  return NextResponse.json({ products: filtered });
}
