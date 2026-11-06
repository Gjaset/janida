"use client";
import { useState } from "react";

// Aviso visible de sitio demo (eliminable por el visitante).
export function DemoBanner() {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="demo-banner">
      Sitio web de demostración: datos de ejemplo y pago simulado (MockPay).
      No se procesan pedidos ni cobros reales.
      <button onClick={() => setHidden(true)} aria-label="Ocultar aviso">
        Ocultar
      </button>
    </div>
  );
}
