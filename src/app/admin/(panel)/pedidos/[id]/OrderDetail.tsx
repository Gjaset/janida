"use client";
// ============================================================
// DETALLE DE PEDIDO (admin): comprador, líneas, historial y
// acciones de cambio de estado validadas contra la API.
// ============================================================
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ALLOWED_TRANSITIONS, type Order, type OrderStatus } from "@/lib/types";
import { formatUSD, formatCOP } from "@/lib/currency";
import { STATUS_LABELS } from "../OrdersAdmin";

export default function OrderDetailAdmin() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setOrder(d.order))
      .catch(() => setError("No se pudo cargar el pedido."));
  }, [id]);

  async function transition(to: OrderStatus) {
    if (!order) return;
    const isCancel = to === "cancelado";
    const note =
      isCancel
        ? prompt(
            "Motivo de la cancelación (opcional; los paquetes vuelven al inventario):",
            ""
          ) ?? undefined
        : undefined;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: to, note: note || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "No se pudo actualizar el estado.");
        return;
      }
      setOrder(data.order);
    } catch {
      setError("Error de red.");
    } finally {
      setBusy(false);
    }
  }

  if (!order && !error) return <p>Cargando pedido…</p>;
  if (error && !order) {
    return (
      <>
        <div className="form-error">{error}</div>
        <Link href="/admin/pedidos" className="btn btn-outline btn-sm">← Volver a pedidos</Link>
      </>
    );
  }
  if (!order) return null;

  const nexts = nextAllowed(order.status); // transiciones posibles (referencia UI)

  return (
    <>
      <div className="admin-h">
        <div>
          <h1 style={{ margin: 0 }}>Pedido {order.id}</h1>
          <div className="admin-opt">
            {new Date(order.createdAt).toLocaleString("es-CO")} · pago: {order.paymentRef} ({order.paymentBrand})
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="status-chip" data-status={order.status} style={{ fontSize: "0.9rem" }}>
            ● {STATUS_LABELS[order.status]}
          </span>
          <Link href="/admin/pedidos" className="btn btn-outline btn-sm">← Pedidos</Link>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="dash-grid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        {/* Líneas y totales */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <div className="dash-card">
            <h3>Líneas del pedido (paquetes de 200 tallos)</h3>
            <table className="rank-table">
              <tbody>
                {order.items.map((it) => (
                  <tr key={it.productId}>
                    <td>
                      {it.productName}
                      <div style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
                        {it.variety} · {it.colorFamily} · paquete de {it.packageSize} tallos
                      </div>
                    </td>
                    <td className="num">{it.packages} × {it.presentation}</td>
                    <td className="num" style={{ whiteSpace: "nowrap" }}>
                      {formatUSD(it.unitPriceUSD)}/paq.
                      <div style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 500 }}>
                        subtotal {formatUSD(it.subtotalUSD)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 14, textAlign: "right" }}>
              <div className="summary-row">
                <span>Total USD</span>
                <strong>{formatUSD(order.totalUSD)}</strong>
              </div>
              <div className="summary-row">
                <span>Total COP (tasa {order.exchangeRate?.toLocaleString("es-CO")} al pagar)</span>
                <strong>{formatCOP(order.totalCOP)}</strong>
              </div>
            </div>
          </div>

          {/* Acciones de estado */}
          <div className="dash-card">
            <h3>Mover estado</h3>
            <div className="status-picker">
              {order.status === "pendiente" && (
                <>
                  <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => transition("confirmado")}>
                    ✓ Confirmado
                  </button>
                  <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => transition("cancelado")}>
                    ✖ Cancelar pedido
                  </button>
                </>
              )}
              {order.status === "confirmado" && (
                <>
                  <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => transition("en_transito")}>
                    → En tránsito
                  </button>
                  <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => transition("cancelado")}>
                    ✖ Cancelar pedido
                  </button>
                </>
              )}
              {order.status === "en_transito" && (
                <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => transition("entregado")}>
                  ✓ Marcar entregado
                </button>
              )}
              {order.status === "entregado" && (
                <span style={{ color: "var(--ok)", fontWeight: 600 }}>Pedido entregado ✓ — sin transiciones pendientes</span>
              )}
              {order.status === "cancelado" && (
                <span style={{ color: "var(--danger)", fontWeight: 600 }}>Pedido cancelado — sin transiciones disponibles</span>
              )}
            </div>
            <div className="note" style={{ marginTop: 12 }}>
              Flujo válido: <strong>pendiente → confirmado → en tránsito →
              entregado</strong>. Cancelar únicamente desde pendiente o
              confirmado; al cancelar, los paquetes se devuelven al
              inventario y excluye el pedido de las métricas de ventas.
            </div>
          </div>
        </div>

        {/* Comprador + historial */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <div className="dash-card">
            <h3>Comprador</h3>
            <table className="rank-table">
              <tbody>
                <tr><td>Nombre</td><td className="num" style={{ whiteSpace: "normal" }}>{order.buyer.fullName}</td></tr>
                <tr><td>Empresa</td><td className="num" style={{ whiteSpace: "normal" }}>{order.buyer.company}</td></tr>
                <tr><td>País</td><td className="num">{order.buyer.country}</td></tr>
                <tr><td>Dirección</td><td className="num" style={{ whiteSpace: "normal" }}>
                  {order.buyer.addressLine1}
                  {order.buyer.addressLine2 ? `, ${order.buyer.addressLine2}` : ""}
                </td></tr>
                <tr><td>Ciudad / estado</td><td className="num">{order.buyer.city}, {order.buyer.state}</td></tr>
                <tr><td>ZIP</td><td className="num">{order.buyer.postalCode}</td></tr>
                <tr><td>Correo</td><td className="num" style={{ whiteSpace: "normal" }}>{order.buyer.email}</td></tr>
                <tr><td>Teléfono</td><td className="num">{order.buyer.phone}</td></tr>
                {order.buyer.notes && (
                  <tr><td>Notas</td><td className="num" style={{ whiteSpace: "normal" }}>{order.buyer.notes}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="dash-card">
            <h3>Historial</h3>
            <ul className="timeline">
              {order.history.map((h, i) => (
                <li key={`${h.status}-${i}`}>
                  <span className="status-chip" data-status={h.status === "pago_aprobado" ? "confirmado" : h.status}>
                    {h.status === "pago_aprobado" ? "Pago aprobado (simulado)" : STATUS_LABELS[h.status]}
                  </span>
                  <small>
                    {new Date(h.at).toLocaleString("es-CO")}
                    {h.note ? ` · ${h.note}` : ""}
                  </small>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

function nextAllowed(status: OrderStatus): OrderStatus[] {
  return ALLOWED_TRANSITIONS[status] ?? [];
}
