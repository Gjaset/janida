// POST /api/auth/login — inicio de sesión del ÚNICO administrador.
// Credenciales validadas contra ADMIN_EMAIL + hash scrypt.
// Al aprobar deja cookie HttpOnly firmada (12 h).
import { NextResponse } from "next/server";
import { verifyAdminCredentials } from "@/lib/auth";
import { SESSION_COOKIE, createSessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  if (!email || !password) {
    return NextResponse.json(
      { error: "Correo y contraseña son obligatorios." },
      { status: 422 }
    );
  }

  if (!verifyAdminCredentials(email, password)) {
    // Mensaje deliberadamente genérico (no filtra cuál campo falla)
    return NextResponse.json(
      { error: "Credenciales inválidas." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: SESSION_COOKIE,
    value: createSessionToken(email),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return res;
}
