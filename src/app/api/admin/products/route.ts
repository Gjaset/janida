// GET/POST /api/admin/products — CRUD de productos (protegido).
import { NextResponse } from "next/server";
import { requireAdmin, productSlugId } from "@/lib/admin-api";
import { productAdminSchema } from "@/lib/validation";
import { listProducts, updateDb } from "@/lib/store";
import type { Product } from "@/lib/types";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;
  const products = await listProducts({ includeInactive: true });
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = productAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos del producto inválidos.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }
  const now = new Date().toISOString();
  const newProduct: Product = {
    id: "temp",
    ...parsed.data,
    createdAt: now,
    updatedAt: now,
  };
  let idFinal = "temp";
  await updateDb((db) => {
    const taken = new Set(db.products.map((p) => p.id));
    idFinal = productSlugId(parsed.data.name, taken);
    const product: Product = { ...newProduct, id: idFinal };
    db.products.push(product);
  });
  return NextResponse.json({ ok: true, id: idFinal });
}
