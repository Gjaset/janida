// PUT/DELETE /api/admin/products/[id]
// PUT: edición completa (bilingüe, cajas, precio USD por caja,
// costo COP por caja, disponibilidad en cajas y galería de URLs).
// DELETE: elimina el producto.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { productAdminSchema } from "@/lib/validation";
import { updateDb } from "@/lib/store";

export async function PUT(
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
  const parsed = productAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos del producto inválidos.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  let found = false;
  await updateDb((db) => {
    const p = db.products.find((x) => x.id === id);
    if (!p) return;
    found = true;
    p.name_en = parsed.data.name_en;
    p.name_es = parsed.data.name_es;
    p.desc_en = parsed.data.desc_en;
    p.desc_es = parsed.data.desc_es;
    p.variety = parsed.data.variety;
    p.type = parsed.data.type;
    p.colorFamily = parsed.data.colorFamily;
    p.stemsPerBox = parsed.data.stemsPerBox;
    p.minOrderBoxes = parsed.data.minOrderBoxes;
    p.pricePerBoxUSD = parsed.data.pricePerBoxUSD;
    p.costPerBoxCOP = parsed.data.costPerBoxCOP;
    p.stockBoxes = parsed.data.stockBoxes;
    p.grade = parsed.data.grade;
    p.galleryUrls = parsed.data.galleryUrls;
    p.active = parsed.data.active;
    p.updatedAt = new Date().toISOString();
  });
  if (!found) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { id } = await params;

  let found = false;
  await updateDb((db) => {
    const idx = db.products.findIndex((x) => x.id === id);
    if (idx >= 0) {
      db.products.splice(idx, 1);
      found = true;
    }
  });
  if (!found) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
