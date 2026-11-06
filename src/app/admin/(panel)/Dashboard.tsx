"use client";
// ============================================================
// DASHBOARD ADMIN — métricas calculadas por el servidor
// (GET /api/admin/metrics) a partir de pedidos y productos.
// ============================================================
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { DashboardMetrics } from "@/lib/types";
import { formatCOP, formatUSD } from "@/lib/currency";

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_transito: "En tránsito",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState(false);
  const [reseting, setReseting] = useState(false);

  const load = useCallback(() => {
    fetch("/api/admin/metrics")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setMetrics)
      .catch(() => setError(true));
  }, []);

  useEffect(load, [load]);

  async function resetDemo() {
    if (!confirm("¿Restaurar los datos de demostración? Se borran pedidos, pagos y se regresa el catálogo a la semilla.")) return;
    setReseting(true);
    await fetch("/api/admin/reset-demo", { method: "POST" });
    load();
    setReseting(false);
  }

  if (error) {
    return <div className="form-error">No se pudieron cargar las métricas. Refresca la página.</div>;
  }
  if (!metrics) return <p>Cargando métricas…</p>;

  const maxSales = Math.max(...metrics.byMonth.map((m) => m.salesUSD), 1);

  return (
    <>
      <div className="admin-h">
        <div>
          <h1 style={{ margin: 0 }}>Dashboard de métricas</h1>
          <div className="admin-opt">
            Calculado en vivo desde los datos del sistema · actualizado{" "}
            {new Date(metrics.generatedAt).toLocaleString()}
          </div>
        </div>
        <button className="btn btn-danger btn-sm" onClick={resetDemo} disabled={reseting}>
          {reseting ? "Restaurando…" : "⟲ Restaurar datos demo"}
        </button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi">
          <div className="label">Ventas totales</div>
          <div className="value">{formatUSD(metrics.totals.salesUSD)}</div>
          <div className="sub">≈ {formatCOP(metrics.totals.salesCOP)} (tasas de cada pedido)</div>
        </div>
        <div className="kpi">
          <div className="label">Pedidos pagados</div>
          <div className="value">{metrics.totals.ordersCount}</div>
          <div className="sub">{metrics.totals.pendingCount} pendiente(s) por confirmar</div>
        </div>
        <div className="kpi">
          <div className="label">Paquetes vendidos</div>
          <div className="value">{metrics.totals.packagesSold.toLocaleString("es-CO")}</div>
          <div className="sub">= {(metrics.totals.packagesSold * 200).toLocaleString("es-CO")} tallos</div>
        </div>
        <div className="kpi">
          <div className="label">Ticket promedio</div>
          <div className="value">{formatUSD(metrics.totals.avgOrderUSD)}</div>
          <div className="sub">por pedido (sin cancelados)</div>
        </div>
        <div className="kpi">
          <div className="label">Productos activos</div>
          <div className="value">{metrics.activeProducts}</div>
          <div className="sub"><Link href="/admin/productos">gestionar catálogo →</Link></div>
        </div>
      </div>

      {/* Ventas por periodo + estados */}
      <div className="dash-grid">
        <div className="dash-card">
          <h3>Ventas por periodo (últimos 6 meses)</h3>
          <div className="bar-chart">
            {metrics.byMonth.map((m) => (
              <div className="bar-col" key={m.month} title={`${m.label}: ${formatUSD(m.salesUSD)} · ${m.orders} pedidos`}>
                <span className="val">{m.salesUSD > 0 ? `${Math.round(m.salesUSD)}` : ""}</span>
                <div
                  className={`bar ${m.salesUSD === 0 ? "zero" : ""}`}
                  style={{ height: `${Math.max(2, (m.salesUSD / maxSales) * 120)}px` }}
                />
                <span className="lbl">{m.label}<br />{m.orders} ped.</span>
              </div>
            ))}
          </div>
          <div className="note" style={{ marginTop: 12 }}>
            Ventas en USD; los pedidos cancelados se excluyen. Meses sin
            pedidos se muestran en gris para lectura de tendencia.
          </div>
        </div>

        <div className="dash-card">
          <h3>Pedidos por estado</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(metrics.byStatus).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="status-chip" data-status={k}>● {STATUS_LABELS[k]}</span>
                <strong>{v}</strong>
                {k === "pendiente" && v > 0 && (
                  <Link href="/admin/pedidos" style={{ marginLeft: "auto", fontSize: "0.82rem" }}>
                    revisar →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="dash-card">
          <h3>Productos más vendidos (paquetes)</h3>
          {metrics.topProducts.length === 0 ? (
            <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>Aún no hay ventas en la demo. Crea pedidos desde el catálogo.</p>
          ) : (
            <table className="rank-table">
              <tbody>
                {metrics.topProducts.map((p, i) => (
                  <tr key={p.productId}>
                    <td>{i + 1}. {p.name}</td>
                    <td className="num">{p.packagesSold} paq.</td>
                    <td className="num">{formatUSD(p.revenueUSD)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="dash-card">
          <h3>Bajo inventario (paquetes)</h3>
          {metrics.lowStock.length === 0 ? (
            <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>Ningún producto activo por debajo del umbral.</p>
          ) : (
            <table className="rank-table">
              <tbody>
                {metrics.lowStock.map((p) => (
                  <tr key={p.productId}>
                    <td>{p.name}</td>
                    <td className="num">
                      <span className="badge badge-low">{p.packagesAvailable} paq.</span>
                    </td>
                    <td className="num" style={{ color: "var(--ink-faint)", whiteSpace: "nowrap" }}>
                      umbral {p.threshold}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
