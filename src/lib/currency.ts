// ============================================================
// Utilidades de formato de moneda. Compartidas entre servidor y
// cliente (no importa nada server-only).
// ============================================================
import type { CurrencyCode } from "./types";

/**
 * Formatea un monto USD para mostrarse al comprador.
 * 18.5 → "USD 18.50"
 */
export function formatUSD(amountUSD: number): string {
  const n = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountUSD);
  // Sufijo claro con el código de divisa (para un comprador global)
  return `${n} USD`.replace("$", "$ ");
}

/** Formatea un monto COP para mostrarse a compradores colombianos */
export function formatCOP(amountCOP: number): string {
  const n = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amountCOP));
  return `${n} COP`;
}

/** Convierte USD → COP usando una tasa dada (1 USD = rate COP) */
export function usdToCOP(amountUSD: number, rate: number): number {
  return Math.round(amountUSD * rate);
}

export function currencyCode(code: string): CurrencyCode {
  return code === "COP" ? "COP" : "USD";
}
