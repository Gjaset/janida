"use client";
import { useMemo, useState } from "react";
import { format_money } from "@/lib/money";

// ------------------------------------------------------------------
// Simulador del dólar (JavaScript en el cliente):
//   margen por caja en COP = precio USD × COP/USD − costo caja COP
//   y cuánto cambia si el dólar baja 100 pesos.
// ------------------------------------------------------------------
export function DollarSimulator({
  initialRate,
  defaultPriceUSD,
  defaultCostCOP,
}: {
  initialRate: number;
  defaultPriceUSD: number;
  defaultCostCOP: number;
}) {
  const [rate, setRate] = useState(initialRate);
  const [priceUSD, setPriceUSD] = useState(defaultPriceUSD);
  const [costCOP, setCostCOP] = useState(defaultCostCOP);

  const calc = useMemo(() => {
    const margin = priceUSD * rate - costCOP;
    const marginPct = costCOP > 0 ? (margin / costCOP) * 100 : 0;
    const drop = priceUSD * (rate - 100) - costCOP;
    return {
      margin,
      marginPct,
      costCOP,
      dropDelta: drop - margin,
      drop,
    };
  }, [priceUSD, rate, costCOP]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 26, alignItems: "start" }}>
      <div>
        <div className="field">
          <label htmlFor="sim-rate">COP por USD (tasa)</label>
          <input
            id="sim-rate"
            type="number"
            min={100}
            step={10}
            value={rate}
            onChange={(e) => setRate(Math.max(0, Number(e.target.value)))}
          />
          <div className="admin-opt" style={{ marginTop: 4 }}>
            Tasa actual del sistema: {initialRate.toLocaleString("es-CO")}
          </div>
        </div>
        <div className="field">
          <label htmlFor="sim-price">Precio por caja (USD)</label>
          <input
            id="sim-price"
            type="number"
            min={1}
            step="0.5"
            value={priceUSD}
            onChange={(e) => setPriceUSD(Math.max(0, Number(e.target.value)))}
          />
        </div>
        <div className="field">
          <label htmlFor="sim-cost">Costo de la caja (COP)</label>
          <input
            id="sim-cost"
            type="number"
            min={0}
            step={1000}
            value={costCOP}
            onChange={(e) => setCostCOP(Math.max(0, Number(e.target.value)))}
          />
          <div className="admin-opt" style={{ marginTop: 4 }}>
            Costo inicial del clavel: 75.000 COP
          </div>
        </div>
      </div>

      <div className="grid-cards" style={{ gap: 14 }}>
        <div className="value-card">
          <h3>Margen por caja</h3>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", color: "var(--brand-strong)" }}>
            {format_money(calc.margin, { currency: "COP", decimals: 0 })}
          </div>
          <p>
            {calc.marginPct.toFixed(1)}% sobre el costo de la caja
          </p>
        </div>
        <div className="value-card">
          <h3>Si el dólar baja 100 pesos</h3>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.6rem",
              color: calc.dropDelta >= 0 ? "var(--ok)" : "var(--danger)",
            }}
          >
            {calc.dropDelta >= 0 ? "+" : ""}
            {format_money(calc.dropDelta, { currency: "COP", decimals: 0 })}
          </div>
          <p>
            El margen quedaría en{" "}
            <b>{format_money(calc.drop, { currency: "COP", decimals: 0 })}</b> por caja (
            {calc.costCOP > 0 ? ((calc.drop / calc.costCOP) * 100).toFixed(1) : "0"}%).
          </p>
        </div>
      </div>
    </div>
  );
}
