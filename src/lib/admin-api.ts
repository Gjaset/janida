// Helper para proteger rutas API del admin.
// Uso: const guard = await requireAdmin(); if (guard) return guard;
import { NextResponse } from "next/server";
import { getAdminSession } from "./auth";

export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: "No autorizado. Inicia sesión en /admin/login." },
      { status: 401 }
    );
  }
  return null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

/** id legible y único para producto nuevo: p-<slug> */
export function productSlugId(name: string, taken: Set<string>): string {
  const base = slugify(name) || "producto";
  let id = `p-${base}`;
  let n = 2;
  while (taken.has(id)) id = `p-${base}-${n++}`;
  return id;
}
