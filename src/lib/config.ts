// ============================================================
// Configuración central del servidor (variables de entorno).
// Todos los valores tienen un fallback documentado para que el
// proyecto funcione sin archivo .env; en producción se deben
// fijar explícitamente (ver .env.example).
// ============================================================
import path from "node:path";

/** Lee una variable de entorno con valor por defecto */
function env(name: string, fallback: string): string {
  const v = process.env[name];
  return v && v.length > 0 ? v : fallback;
}

// ---------------- DIVISA ----------------
/** Tasa de cambio usada para mostrar equivalencias: 1 USD = rate COP */
export const EXCHANGE_RATE_COP = Number(env("EXCHANGE_RATE_COP", "4200"));

// ---------------- ADMIN ----------------
/** Correo de inicio de sesión del administrador */
export const ADMIN_EMAIL = env("ADMIN_EMAIL", "admin@janida.co");
/** Hash (scrypt) del password del administrador.
 * Formato: scrypt$n=16384$r=8$p=1$<salt>$<hash>.
 * NOTA: en .env los "$" deben escaparse como "\$" porque Next.js
 * los expande al leer variables.
 * Genera uno nuevo con: npm run hash:password -- "TuClaveNueva"
 */
export const ADMIN_PASSWORD_HASH = env(
  "ADMIN_PASSWORD_HASH",
  "scrypt$n=16384$r=8$p=1$d5b346cda8ca973f$5cfad84d11aa0c565b3cc21a1fb7732f672a0736270067d632b664606c72d17ecb88c32849ae038533f757a2355d8d96799d082fac850fe9ff5b500eee74b70a"
);
/** Semilla para firmar cookies de sesión (HMAC-SHA256) */
export const ADMIN_SESSION_SECRET = env(
  "ADMIN_SESSION_SECRET",
  "cambiar-en-produccion-7f1a2b3c"
);

// ---------------- CATÁLOGO / INVENTARIO ----------------
/** Umbral (cajas) para alertar inventario bajo en el panel admin */
export const LOW_STOCK_THRESHOLD_BOXES = Number(
  env("LOW_STOCK_THRESHOLD_BOXES", "20")
);

// ---------------- IDENTIDAD ----------------
export const BRAND_NAME = env("NEXT_PUBLIC_BRAND_NAME", "JANIDA SAS");

// ---------------- ALMACÉN DE DATOS ----------------
/**
 * Directorio del almacén de datos.
 * - Local / producción con VM (npm start): `data/` con db.json.
 * - Vercel / serverless: el filesystem de despliegue es de SOLO
 *   LECTURA, así que se trabaja sobre una copia en /tmp (datos
 *   efímeros por instancia; se re-siembra del JSON incluido en
 *   el bundle — ver `outputFileTracingIncludes` en next.config).
 *   Para persistencia real en Vercel, reimplementar store.ts
 *   sobre una BD (Neon, Postgres, etc.).
 * Override manual: variable DATA_DIR.
 */
export const DATA_DIR =
  process.env.DATA_DIR ||
  (process.env.VERCEL === "1"
    ? "/tmp/janida-data"
    : path.join(process.cwd(), "data"));
