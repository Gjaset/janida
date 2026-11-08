"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { canCancel } from "@/lib/types";

// Acciones del admin sobre la escalera de tracking del pedido:
//  · Avanzar al siguiente estado (ascensor de la escalera)
//  · Confirmar pago (marca la factura pagada y calcula la ETA)
//  · Cancelar (solo permitido antes de entregar a la aerolínea)
//  · Registrar incidencia (retraso / retención en aduana),
//    que mueve automáticamente la fecha estimada de entrega.
export function OrderActions({
  orderId,
  status,
  paymentStatus,
}: {
  orderId: string;
  status: string;
  paymentStatus: "pending" | "paid";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"advance" | "paid" | "cancel" | "incident" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [incidentNote, setIncidentNote] = useState("");

  async function post(url: string, body: unknown, kind: NonNullable<typeof busy>) {
    setBusy(kind);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage(j.message ? String(j.message) : "Listo.");
        router.refresh();
      } else {
        setError(j.error ?? "No se pudo aplicar la acción.");
      }
    } catch {
      setError("Error de red.");
    }
    setBusy(null);
  }

  const finished = status === "delivered";
  const cancelled = status === "cancelled";

  return (
    <>
      <h3 style={{ marginBottom: 10 }}>Acciones</h3>
      <div style={{ display: "grid", gap: 8 }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!!busy || finished || cancelled}
          onClick={() => post(`/api/admin/orders/${orderId}`, { action: "advance" }, "advance")}
        >
          ⇢ Avanzar al siguiente estado
        </button>
        <button
          type="button"
          className="btn btn-outline"
          disabled={!!busy || paymentStatus === "paid" || cancelled}
          onClick={() => post(`/api/admin/orders/${orderId}`, { action: "mark_paid" }, "paid")}
        >
          ✔ Confirmar pago de la factura
        </button>
        <button
          type="button"
          className="btn btn-danger btn-sm"
          disabled={!!busy || cancelled || !canCancel(status as never)}
          onClick={() => {
            if (window.confirm(`¿Cancelar ${orderId}? Las cajas vuelven al inventario.`))
              post(`/api/admin/orders/${orderId}`, { action: "cancel" }, "cancel");
          }}
        >
          ✕ Cancelar pedido
        </button>
      </div>

      {!cancelled && (
        <div style={{ marginTop: 14 }}>
          <h3 style={{ marginBottom: 6 }}>Registrar incidencia</h3>
          <div className="field">
            <input
              value={incidentNote}
              onChange={(e) => setIncidentNote(e.target.value)}
              placeholder="Nota (opcional, p. ej. “vuelo saturado por temporada”)"
              maxLength={300}
            />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-sm"
              style={{ background: "var(--warn-soft)", color: "var(--warn)", border: "1px solid #ecd5ab" }}
              disabled={!!busy}
              onClick={() =>
                post(
                  `/api/admin/orders/${orderId}/incident`,
                  { kind: "delay", note: incidentNote || undefined },
                  "incident"
                )
              }
            >
              ⏱ Retraso (+3 días)
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{ background: "var(--warn-soft)", color: "var(--warn)", border: "1px solid #ecd5ab" }}
              disabled={!!busy}
              onClick={() =>
                post(
                  `/api/admin/orders/${orderId}/incident`,
                  { kind: "customs_hold", note: incidentNote || undefined },
                  "incident"
                )
              }
            >
              🛃 Retención en aduana (+4 días)
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className="form-ok" style={{ marginTop: 12 }}>
          {message}
        </div>
      )}
      {error && (
        <div className="form-error" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}
    </>
  );
}
