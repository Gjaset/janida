"use client";
// Precio dual: USD (base) + COP (conversión automática con la tasa
// configurada en EXCHANGE_RATE_COP, recibida vía /api/meta).
import { formatCOP, formatUSD } from "@/lib/currency";
import { useCurrency } from "./providers";

export function Price({
  usdUSD,
  compact = false,
  showCop = true,
}: {
  usdUSD: number;
  compact?: boolean;
  showCop?: boolean;
}) {
  const { rate } = useCurrency();
  return (
    <span className="price">
      {formatUSD(usdUSD)}
      {showCop && (
        <span className="cop">
          ≈ {formatCOP(usdUSD * rate)}
          {compact ? "" : " · tasa demo"}
        </span>
      )}
    </span>
  );
}
