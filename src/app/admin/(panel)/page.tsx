import Link from "next/link";
import { computeDashboardMetrics } from "@/lib/metrics";
import { getSettings, listProducts } from "@/lib/store";
import { format_money } from "@/lib/money";
import { DashboardPeriod, DASHBOARD_PERIODS } from "@/lib/types";
import { DollarSimulator } from "./DollarSimulator";

// ------------------------------------------------------------------
// Dashboard del panel (en español) con selector de periodo
// (30 días, 90 días, 12 meses). Todas las métricas se calculan en
// el SERVIDOR desde pedidos, líneas y eventos (nunca en el cliente).
// ------------------------------------------------------------------
export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const sp = await searchParams;
  const period: DashboardPeriod = (DASHBOARD_PERIODS as string[]).includes(sp.period ?? "")
    ? (sp.period as DashboardPeriod)
    : "90d";

  const [metrics, settings, products] = await Promise.all([
    computeDashboardMetrics(period),
    getSettings(),
    listProducts(),
  ]);
  const t = metrics.totals;

  const periodLabels: Record<DashboardPeriod, string> = {
    "30d": "Últimos 30 días",
    "90d": "Últimos 90 días",
    "12m": "Últimos 12 meses",
  };

  const lowStockProducts = products.filter(
    (p) => p.stockBoxes <= (settings.lowStockThresholdBoxes ?? 20)
  );

  const maxMonth = Math.max(1, ...metrics.byMonth.map((m) => m.salesUSD));
  const maxCust = Math.max(1, ...metrics.byCustomer.map((c) => c.salesUSD));
  const maxAging = Math.max(1, ...metrics.receivablesByAging.map((a) => a.salesUSD));

  // dollar simulator defaults (clavel estándar: US$26/costo 75.000 = datos reales)
  const simDefaultPriceUSD =
    products.find((p) => p.id === "jan-candela")?.pricePerBoxUSD ?? 26;
  const simDefaultCostCOP =
    products.find((p) => p.id === "jan-candela")?.costPerBoxCOP ??
    settings.referenceCostBoxCOP;

  return (
    <>
      <div className="admin-h">
        <div>
          <h1>Dashboard</h1>
          <div className="admin-opt">
            {periodLabels[period]} · calculado a las{" "}
            {new Date(metrics.generatedAt).toLocaleString("es-CO")}
          </div>
        </div>
        <div className="status-picker">
          {DASHBOARD_PERIODS.map((p) => (
            <Link
              key={p}
              href={`/admin?period=${p}`}
              className={`btn btn-sm ${p === period ? "btn-primary" : "btn-outline"}`}
            >
              {periodLabels[p]}
            </Link>
          ))}
        </div>
      </div>

      {/* ---------------- Tarjetas ---------------- */}
      <div className="kpi-grid">
        <div className="kpi">
          <div className="label">Ventas (USD)</div>
          <div className="value">{format_money(t.salesUSD)}</div>
          <div className="sub">{periodLabels[period]}</div>
        </div>
        <div className="kpi">
          <div className="label">Cajas y tallos vendidos</div>
          <div className="value">{t.boxesSold}</div>
          <div className="sub">
            {t.stemsSold.toLocaleString("es-CO")} tallos ({format_money(t.avgPricePerStemUSD, { decimals: 3 })} por tallo)
          </div>
        </div>
        <div className="kpi">
          <div className="label">Pedidos emitidos</div>
          <div className="value">{t.ordersCount}</div>
          <div className="sub">Valor promedio {format_money(t.avgOrderUSD)}</div>
        </div>
        <div className="kpi">
          <div className="label">Margen</div>
          <div className="value">
            {format_money(t.marginPerBoxCOP, { currency: "COP", decimals: 0 })}
          </div>
          <div className="sub">
            por caja ({t.marginPct}% sobre costo) · total{" "}
            {format_money(t.marginTotalCOP, { currency: "COP", decimals: 0, })}
          </div>
        </div>
        <div className="kpi">
          <div className="label">Cartera por cobrar</div>
          <div className="value">{format_money(t.receivableUSD)}</div>
          <div className="sub">
            {metrics.overdueInvoices.length} facturas vencidas · cobro promedio{" "}
            {t.avgCollectionDays} días
          </div>
        </div>
        <div className="kpi">
          <div className="label">Entregas a tiempo</div>
          <div className="value">{t.onTimePct}%</div>
          <div className="sub">
            {metrics.onTimeVsLate.onTime} a tiempo vs {metrics.onTimeVsLate.late} tardías
          </div>
        </div>
        <div className="kpi">
          <div className="label">Pedidos con incidencia</div>
          <div className="value">{t.incidentPct}%</div>
          <div className="sub">retrasos y retenciones en aduana</div>
        </div>
      </div>

      {/* ---------------- Gráficos ---------------- */}
      <div className="dash-grid">
        <div className="dash-card">
          <h3>Ventas por mes (USD)</h3>
          <div className="bar-chart">
            {metrics.byMonth.map((m) => (
              <div key={m.key} className="bar-col" title={`${m.label}: ${format_money(m.salesUSD)}`}>
                <span className="val">
                  {m.salesUSD >= 1000 ? `${(m.salesUSD / 1000).toFixed(1)}k` : m.salesUSD.toFixed(0)}
                </span>
                <span
                  className={`bar${m.salesUSD === 0 ? " zero" : ""}`}
                  style={{ height: `${Math.max(2, (m.salesUSD / maxMonth) * 130)}px` }}
                />
                <span className="lbl">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-card">
          <h3>Ventas por cliente (USD)</h3>
          {metrics.top3SharePct > 70 && (
            <div className="form-error" style={{ marginBottom: 10 }}>
              ⚠ Concentración de riesgo: los 3 mayores clientes concentran el{" "}
              {metrics.top3SharePct}% de las ventas del periodo.
            </div>
          )}
          <div style={{ display: "grid", gap: 10 }}>
            {metrics.byCustomer.map((c) => (
              <div key={c.company}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                  <span style={{ color: "var(--ink)", fontWeight: 600 }}>{c.company}</span>
                  <span>
                    {format_money(c.salesUSD)} · {c.sharePct}%
                  </span>
                </div>
                <div style={{ height: 10, background: "var(--over, var(--surface-warm))", borderRadius: 6, marginTop: 4 }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${(c.salesUSD / maxCust) * 100}%`,
                      background: "var(--brand)",
                      borderRadius: 6,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-card">
          <h3>Cartera por antigüedad</h3>
          <div className="bar-chart" style={{ height: 140 }}>
            {metrics.receivablesByAging.map((a) => (
              <div key={a.label} className="bar-col" title={`${a.label} días: ${format_money(a.salesUSD)}`}>
                <span className="val">
                  {a.salesUSD >= 1000 ? `${(a.salesUSD / 1000).toFixed(1)}k` : a.salesUSD.toFixed(0)}
                </span>
                <span
                  className={`bar${a.salesUSD === 0 ? " zero" : ""}`}
                  style={{ height: `${Math.max(2, (a.salesUSD / maxAging) * 100)}px`, background: "var(--warn)" }}
                />
                <span className="lbl">
                  {a.label}
                  <br />
                  {a.count} fact.
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-card">
          <h3>Pedidos por estado</h3>
          <table className="rank-table">
            <tbody>
              {metrics.byStatus.length === 0 && (
                <tr>
                  <td>Sin pedidos en el periodo.</td>
                </tr>
              )}
              {metrics.byStatus.map((s) => (
                <tr key={s.status}>
                  <td>{statusEs(s.status)}</td>
                  <td className="num">{s.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dash-card">
          <h3>Entregas a tiempo vs tardías</h3>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "var(--ok)" }}>
                {metrics.onTimeVsLate.onTime}
              </div>
              <div className="admin-opt">a tiempo</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "var(--warn)" }}>
                {metrics.onTimeVsLate.late}
              </div>
              <div className="admin-opt">tardías</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", height: 14, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ width: `${t.onTimePct}%`, background: "var(--ok)" }} />
                <div style={{ width: `${100 - t.onTimePct}%`, background: "var(--warn)" }} />
              </div>
              <div className="admin-opt" style={{ marginTop: 6 }}>
                {t.onTimePct}% a tiempo (ETA vs entrega real)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Tablas ---------------- */}
      <div className="dash-grid" style={{ marginTop: 18 }}>
        <div className="dash-card">
          <h3>Facturas vencidas</h3>
          {metrics.overdueInvoices.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Factura</th>
                  <th>Total</th>
                  <th>Venció</th>
                </tr>
              </thead>
              <tbody>
                {metrics.overdueInvoices.map((f) => (
                  <tr key={f.orderId}>
                    <td>
                      <Link href={`/admin/pedidos/${f.orderNumber}`} className="strong">
                        {f.orderNumber}
                      </Link>
                    </td>
                    <td>{f.customer}</td>
                    <td>{f.invoiceNumber}</td>
                    <td>{format_money(f.totalUSD)}</td>
                    <td style={{ color: "var(--danger)" }}>
                      hace {f.daysOverdue} días
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: "var(--ok)" }}>
              ✓ Sin facturas vencidas en este momento.
            </p>
          )}
        </div>

        <div className="dash-card">
          <h3>Pedidos con retraso o incidencia</h3>
          {metrics.problemOrders.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {metrics.problemOrders.map((po) => (
                  <tr key={po.orderNumber + po.detail}>
                    <td>
                      <Link href={`/admin/pedidos/${po.orderNumber}`} className="strong">
                        {po.orderNumber}
                      </Link>
                    </td>
                    <td>{po.customer}</td>
                    <td style={{ color: "var(--warn)" }}>
                      {po.issue === "incident" ? "Incidencia" : "Entrega tardía"} · {po.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: "var(--ok)" }}>✓ Sin retrasos ni incidencias.</p>
          )}
        </div>
      </div>

      {/* ---------------- Simulador del dólar ---------------- */}
      <div className="dash-card full" style={{ marginTop: 18 }}>
        <h3>Simulador del dólar</h3>
        <DollarSimulator
          initialRate={settings.exchangeRateCOP}
          defaultPriceUSD={simDefaultPriceUSD}
          defaultCostCOP={simDefaultCostCOP}
        />
      </div>

      {/* inventario bajo */}
      {lowStockProducts.length > 0 && (
        <div className="dash-card" style={{ marginTop: 18 }}>
          <h3>Inventario bajo (≤ {settings.lowStockThresholdBoxes} cajas)</h3>
          <table className="data-table">
            <tbody>
              {lowStockProducts.map((p) => (
                <tr key={p.id}>
                  <td className="strong">{p.name_es}</td>
                  <td style={{ color: p.stockBoxes === 0 ? "var(--danger)" : "var(--warn)" }}>
                    {p.stockBoxes} cajas
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// Etiquetas de estados en español para la tabla del dashboard
function statusEs(status: string): string {
  const map: Record<string, string> = {
    order_received: "Pedido recibido",
    payment_confirmed: "Pago confirmado",
    pickup_scheduled: "Recogida en finca programada",
    picked_up_farm: "Recogido en finca aliada",
    post_harvest_review: "Revisión y conteo en poscosecha",
    export_docs_ready: "Documentos de exportación listos (ICA y DIAN)",
    delivered_airline: "Entregado a la aerolínea",
    in_transit: "En tránsito",
    arrival_us: "Llegada a EE. UU. (aduana e inspección)",
    delivered: "Entregado",
    cancelled: "Cancelado",
  };
  return map[status] ?? status;
}
