// POST /api/contact — formulario de contacto (demo; se guarda en
// el almacén mock y podría notificarse por correo en producción).
import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validation";
import { updateDb } from "@/lib/store";
import crypto from "node:crypto";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }
  await updateDb((db) => {
    db.contacts.push({
      id: crypto.randomUUID(),
      ...parsed.data,
      createdAt: new Date().toISOString(),
    });
  });
  return NextResponse.json({ ok: true });
}
