// ============================================================
// Autenticación del ÚNICO administrador.
// ------------------------------------------------------------
// - Credenciales: variables de entorno (ADMIN_EMAIL +
//   ADMIN_PASSWORD_HASH con scrypt). Nada se compara en claro.
// - Sesión: cookie HttpOnly firmada con HMAC-SHA256
//   (ADMIN_SESSION_SECRET). Sin estado en el servidor.
// ============================================================
import crypto from "node:crypto";
import { cookies } from "next/headers";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD_HASH,
  ADMIN_SESSION_SECRET,
} from "./config";
import { verifyPassword } from "./password";

export const SESSION_COOKIE = "janida_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

interface SessionPayload {
  sub: string; // correo del admin
  exp: number; // expiración (ms)
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(payload)
    .digest("base64url");
}

/** Crea un token de sesión firmado (payload.payload-firma) */
export function createSessionToken(email: string): string {
  const payload: SessionPayload = {
    sub: email.toLowerCase(),
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

/** Verifica firma y expiración del token */
export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(encoded);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf-8")
    ) as SessionPayload;
    if (!payload?.sub || typeof payload.exp !== "number") return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Lee la sesión del admin desde las cookies de la petición */
export async function getAdminSession(): Promise<{ email: string } | null> {
  const store = await cookies();
  const payload = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  return payload ? { email: payload.sub } : null;
}

/** Verifica credenciales contra la config (correo + hash scrypt) */
export function verifyAdminCredentials(
  email: string,
  password: string
): boolean {
  const okEmail =
    email.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase();
  const okPassword = verifyPassword(password, ADMIN_PASSWORD_HASH);
  return okEmail && okPassword;
}
