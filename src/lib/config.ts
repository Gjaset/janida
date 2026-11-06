// ============================================================
// Configuración central del servidor (variables de entorno).
// Todos los valores tienen un fallback de DEMO documentado para
// que el proyecto funcione sin archivo .env; en producción se
// deben fijar explícitamente (ver .env.example).
// ============================================================
import path from "node:path";

/** Lee una variable de entorno con valor por defecto */
function env(name: string, fallback: string): string {
  const v = process.env[name];
  return v && v.length > 0 ? v : fallback;
}

// ---------------- DIVISA ----------------
/** Moneda base de almacenamiento (no cambiar sin revisar seeds) */
export const CURRENCY_BASE = env("CURRENCY_BASE", "USD") as "USD";
/** Tasa de cambio usada: 1 USD = EXCHANGE_RATE_COP COP (demo) */
export const EXCHANGE_RATE_COP = Number(
  env("EXCHANGE_RATE_COP", "4200")
);

// ---------------- ADMIN ----------------
/** Correo de inicio de sesión del administrador */
export const ADMIN_EMAIL = env("ADMIN_EMAIL", "admin@janida.co");
/** Hash (scrypt) del password del administrador.
 * Formato: scrypt$n=16384$r=8$p=1$<salt>$<hash>
 * Hash de demo correspondiente al password "admin123".
 * Genera uno nuevo con: npm run hash:password -- "TuClaveNueva"
 */
export const ADMIN_PASSWORD_HASH = env(
  "ADMIN_PASSWORD_HASH",
  "scrypt$n=16384$r=8$p=1$d5b346cda8ca973f$5cfad84d11aa0c565b3cc21a1fb7732f672a0736270067d632b664606c72d17ecb88c32849ae038533f757a2355d8d96799d082fac850fe9ff5b500eee74b70a"
);
/** Semilla para firmar cookies de sesión (HMAC-SHA256) */
export const ADMIN_SESSION_SECRET = env(
  "ADMIN_SESSION_SECRET",
  "demo-super-secreto-cambiar-en-produccion-7f1a2b"
);

// ---------------- PAGO SIMULADO ----------------
/** Proveedor de pago del checkout: "mock" (demo) — luego "stripe" */
export const PAYMENT_PROVIDER = env("PAYMENT_PROVIDER", "mock");
/** Clave pública mock (útil si luego se muestra en el frontend) */
export const PAYMENT_MOCK_PUBLIC_KEY = env(
  "PAYMENT_MOCK_PUBLIC_KEY",
  "pk_demo_janida_sas"
);
/** Clave secreta mock (no se usada en el navegador, solo servidor) */
export const PAYMENT_MOCK_SECRET_KEY = env(
  "PAYMENT_MOCK_SECRET_KEY",
  "sk_demo_janida_sas"
);

// ---------------- CATÁLOGO / INVENTARIO ----------------
/** Tallos por paquete: única unidad de venta */
export const PACKAGE_SIZE = Number(env("NEXT_PUBLIC_PACKAGE_SIZE", "200"));
/** Stock mínimo (paquetes) para alertar bajo inventario en el admin */
export const LOW_STOCK_THRESHOLD_PACKAGES = Number(
  env("LOW_STOCK_THRESHOLD_PACKAGES", "80")
);

// ---------------- IDENTIDAD ----------------
export const BRAND_NAME = env("NEXT_PUBLIC_BRAND_NAME", "JANIDA SAS");

// ---------------- ALMACÉN DE DATOS ----------------
/**
 * Directorio del "almacén" de datos. HOY: data/db.json (demo, sin base
 * de datos). MAÑANA: esta ruta desaparece y `store.ts` se reimplementa
 * sobre una BD real — el resto de la app no necesita cambios.
 */
export const DATA_DIR = path.join(process.cwd(), "data");
