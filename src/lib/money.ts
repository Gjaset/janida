// ============================================================
// DINERO — ÚNICA función de formato para todo el sitio.
//
// Regla del proyecto: en páginas y componentes NUNCA se escribe
// el signo "$" a mano ni se arma la cifra manualmente; todo pasa
// por format_money(valor, opciones). Esto evita errores tipo
// "USD $$26.00" y unifica símbolo, separadores y decimales.
// ============================================================

export type SupportedCurrency = "USD" | "COP";

export interface MoneyOptions {
  /** Decimales a mostrar (por defecto 2; precio por tallo usa 3) */
  decimals?: number;
  /** Divisa resultante (por defecto USD, la moneda base de la app) */
  currency?: SupportedCurrency;
}

/**
 * format_money — formatea un monto con su código de divisa.
 *   format_money(26)                      -> "USD 26.00"
 *   format_money(26.5, {decimals:3})      -> "USD 26.500"  (precio por tallo)
 *   format_money(100000, {currency:"COP"})-> "COP 100.000"
 */
export function format_money(
  value: number,
  options: MoneyOptions = {}
): string {
  const currency = options.currency ?? "USD";
  const decimals = Math.max(0, Math.min(4, options.decimals ?? 2));
  const safe = Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safe);
}

/** Conviende USD → COP (redondeo a peso). 1 USD = rate COP. */
export function usd_to_cop(amountUSD: number, rateCOP: number): number {
  return Math.round(amountUSD * rateCOP);
}
