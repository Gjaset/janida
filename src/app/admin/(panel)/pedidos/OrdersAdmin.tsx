"use client";
// ============================================================
// GESTIÓN DE PEDIDOS (admin): flujo pendiente → confirmado →
// en tránsito → entregado, con cancelación desde pendiente o
// confirmado (transiciones validadas server-side).
// ============================================================
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Order, OrderStatus } from "@/lib/types";
import { formatCOP, formatUSD } from "@/lib/currency";

export const STATUS_LABELS: Record<OrderStatus | string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_transito: "En tránsito",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "todos">("todos");

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setOrders([]));
  }, []);

  const shown = useMemo(
    () =>
      (orders ?? []).filter(
        (o) => statusFilter === "todos" || o.status === statusFilter
      ),
    [orders, statusFilter]
  );

  return (
    <>
      <div className="admin-h">
        <div>
          <h1 style={{ margin: 0 }}>Pedidos</h1>
          <div className="admin-opt">
            Pagos simulados con MockPay · haz clic en el detalle para mover el estado
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "todos")}
          style={{ padding: "9px 12px", border: "1px solid var(--line-strong)", borderRadius: 9, fontSize: "0.9rem" }}
        >
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="confirmado">Confirmado</option>
          <option value="en_transito">En tránsito</option>
          <option value="entregado">Entregado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {orders === null && <p>Cargando pedidos…</p>}

      {orders !== null &&
        (orders.length === 0 ? (
          <div className="empty-state">
            <div className="big">📦</div>
            <h2>Aún no hay pedidos</h2>
            <p>Realiza un pedido demo desde el catálogo público para probar el flujo.</p>
            <Link href="/catalog" className="btn btn-outline">Ir al catálogo →</Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Fecha</th>
                <th>Comprador</th>
                <th>Paquetes</th>
                <th>Total</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <tr key={o.id}>
                  <td className="strong">
                    {o.id}
                    <div style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>{o.paymentRef}</div>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {new Date(o.createdAt).toLocaleDateString("es-CO")}
                    <div style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>
                      {new Date(o.createdAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>
                  <td>
                    {o.buyer.company}
                    <div style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
                      {o.buyer.fullName} · {o.buyer.city}, {o.buyer.state}
                    </div>
                  </td>
                  <td className="strong">{o.items.reduce((a, i) => a + i.packages, 0)}</td>
                  <td className="strong" style={{ whiteSpace: "nowrap" }}>
                    {formatUSD(o.totalUSD)}
                    <div style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>
                      ≈ {formatCOP(o.totalCOP)}
                    </div>
                  </td>
                  <td><span className="status-chip" data-status={o.status}>● {STATUS_LABELS[o.status]}</span></td>
                  <td style={{ textAlign: "right" }}>
                    <Link className="btn btn-outline btn-sm" href={`/admin/pedidos/${o.id}`}>
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--ink-faint)" }}>Ningún pedido en este estado.</td></tr>
              )}
            </tbody>
          </table>
        ))}
    </>
  );
}
