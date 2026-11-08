// ============================================================
// MÉTRICAS DEL DASHBOARD (panel admin, calculadas del sistema).
//
// Definiciones (calculadas desde pedidos, líneas y eventos):
// - Ventas en USD = suma de totales de pedidos NO cancelados
//   emitidos dentro del periodo (30/90/365 días).
// - Cajas y tallos = de las líneas de pedido (order_items).
// - Precio promedio por tallo = ventas / tallos.
// - Margen = (precio por caja USD × tasa − costo por caja COP),
//   ponderado por cajas vendidas.
// - Cartera por cobrar = facturas pagables pendientes (no
//   canceladas, paymentStatus = pending), mounts actuales.
// - Días promedio de cobro = días entre emisión y pago (pagadas).
// - % entregas a tiempo = evento "entregado" ≤ fecha estimada.
// - % pedidos con incidencia = pedidos con evento de incidencia.
// ============================================================
import { readDb } from "./store";
import type {
  AgingBucket,
  DashboardMetrics,
  DashboardPeriod,
  MonthBucket,
  Order,
  OrderItem,
  ProblemOrder,
  TrackingEvent,
} from "./types";
import { DASHBOARD_PERIODS, statusIndex } from "./types";
import { EXCHANGE_RATE_COP } from "./config";

const MS_DAY = 86_400_000;

function periodDays(period: DashboardPeriod): number {
  return period === "30d" ? 30 : period === "90d" ? 90 : 365;
}

function dayStart(iso: string): number {
  return new Date(iso.slice(0, 10) + "T00:00:00Z").getTime();
}

function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((dayStart(toISO) - dayStart(fromISO)) / MS_DAY);
}

const MES_CORTO = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `${MES_CORTO[Number(m) - 1]} ${y}`;
}

function monthKeysBack(now: Date, count: number): string[] {
  const keys: string[] = [];
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  for (let i = 0; i < count; i++) {
    keys.unshift(d.toISOString().slice(0, 7));
    d.setUTCMonth(d.getUTCMonth() - 1);
  }
  return keys;
}

export async function computeDashboardMetrics(
  period: DashboardPeriod | string
): Promise<DashboardMetrics> {
  const p: DashboardPeriod = (DASHBOARD_PERIODS as string[]).includes(period)
    ? (period as DashboardPeriod)
    : "90d";
  const now = new Date();
  const nowISO = now.toISOString();
  const today = nowISO.slice(0, 10);
  const fromISO = new Date(dayStart(today) - (periodDays(p) - 1) * MS_DAY)
    .toISOString()
    .slice(0, 10);

  const db = await readDb();
  const rate = db.settings?.exchangeRateCOP ?? EXCHANGE_RATE_COP;

  const orders: Order[] = db.orders;
  const items: OrderItem[] = db.order_items;
  const events: TrackingEvent[] = db.tracking_events;

  const inWindow = (o: Order) =>
    o.status !== "cancelled" && o.invoiceDate >= fromISO;

  const windowOrders = orders.filter(inWindow);
  const orderIds = new Set(windowOrders.map((o) => o.id));
  const windowItems = items.filter((i) => orderIds.has(i.orderId));

  // ---------------- tarjetas ----------------
  const salesUSD =
    Math.round(windowOrders.reduce((a, o) => a + o.totalUSD, 0) * 100) / 100;
  const boxesSold = windowItems.reduce((a, i) => a + i.boxes, 0);
  const stemsSold = windowItems.reduce((a, i) => a + i.stems, 0);
  const ordersCount = windowOrders.length;
  const avgOrderUSD = ordersCount ? salesUSD / ordersCount : 0;
  const avgPricePerStemUSD = stemsSold ? salesUSD / stemsSold : 0;

  const marginOverBoxesTotalCOP = windowItems.reduce(
    (a, i) => a + i.boxes * (i.pricePerBoxUSD * rate - i.costPerBoxCOP),
    0
  );
  const marginPerBoxCOP = boxesSold
    ? marginOverBoxesTotalCOP / boxesSold
    : 0;
  const marginPct =
    boxesSold
      ? marginPerBoxCOP / (windowItems.reduce((a, i) => a + i.costPerBoxCOP * i.boxes, 0) / boxesSold || 1)
      : 0;

  // Cartera: todas las facturas pendientes no canceladas
  const pendingInvoices = orders.filter(
    (o) => o.status !== "cancelled" && o.paymentStatus === "pending"
  );
  const receivableUSD =
    Math.round(pendingInvoices.reduce((a, o) => a + o.totalUSD, 0) * 100) / 100;

  const paidOrders = orders.filter(
    (o) => o.status !== "cancelled" && o.paymentStatus === "paid" && o.paidAt
  );
  const avgCollectionDays = paidOrders.length
    ? Math.round(
        (paidOrders.reduce((a, o) => a + daysBetween(o.invoiceDate, o.paidAt!), 0) /
          paidOrders.length) *
          10
      ) / 10
    : 0;

  // Entregas a tiempo: evento entregado ≤ ETA
  let onTime = 0;
  let late = 0;
  for (const o of orders) {
    if (o.status !== "delivered") continue;
    const ev = events
      .filter((e) => e.orderId === o.id && e.type === "status" && e.status === "delivered")
      .sort((a, b) => b.at.localeCompare(a.at))[0];
    if (!ev) continue;
    if (ev.at.slice(0, 10) <= o.estimatedDelivery.slice(0, 10)) onTime++;
    else late++;
  }
  const onTimePct = onTime + late ? Math.round((onTime / (onTime + late)) * 100) : 0;

  // Pedidos con incidencia (en la ventana)
  const incidentOrderIds = new Set(
    events.filter((e) => e.type === "incident").map((e) => e.orderId)
  );
  const incidentPct = ordersCount
    ? Math.round(
        ([...incidentOrderIds].filter((id) => orderIds.has(id)).length /
          ordersCount) *
          100
      )
    : 0;

  // ---------------- gráficos ----------------
  const months = monthKeysBack(now, p === "30d" ? 2 : p === "90d" ? 4 : 12);
  const byMonth: MonthBucket[] = months.map((key) => {
    const os = windowOrders.filter((o) => monthKey(o.invoiceDate) === key);
    return {
      key,
      label: monthLabel(key),
      salesUSD: Math.round(os.reduce((a, o) => a + o.totalUSD, 0) * 100) / 100,
    };
  });

  const byCustomerRaw = new Map<string, number>();
  for (const o of windowOrders) {
    byCustomerRaw.set(o.buyer.company, (byCustomerRaw.get(o.buyer.company) ?? 0) + o.totalUSD);
  }
  const byCustomerRows = [...byCustomerRaw.entries()]
    .map(([company, v]) => ({ company, salesUSD: Math.round(v * 100) / 100 }))
    .sort((a, b) => b.salesUSD - a.salesUSD)
    .slice(0, 8);
  const byCustomer = byCustomerRows.map((r) => ({
    customerId: r.company,
    company: r.company,
    salesUSD: r.salesUSD,
    sharePct: salesUSD ? Math.round((r.salesUSD / salesUSD) * 1000) / 10 : 0,
  }));
  const top3 = byCustomer.slice(0, 3);
  const top3SharePct = salesUSD
    ? Math.round((top3.reduce((a, c) => a + c.salesUSD, 0) / salesUSD) * 1000) / 10
    : 0;

  // Cartera por antigüedad (días desde la emisión de la factura)
  const aging: AgingBucket[] = [
    { label: "0–30", salesUSD: 0, count: 0 },
    { label: "31–60", salesUSD: 0, count: 0 },
    { label: "61–90", salesUSD: 0, count: 0 },
    { label: "90+", salesUSD: 0, count: 0 },
  ];
  for (const o of pendingInvoices) {
    const age = Math.max(0, daysBetween(o.invoiceDate, today));
    const idx = age <= 30 ? 0 : age <= 60 ? 1 : age <= 90 ? 2 : 3;
    aging[idx].salesUSD += o.totalUSD;
    aging[idx].count++;
  }
  aging.forEach((b) => (b.salesUSD = Math.round(b.salesUSD * 100) / 100));

  const byStatusMap = new Map<string, number>();
  for (const o of windowOrders) {
    byStatusMap.set(o.status, (byStatusMap.get(o.status) ?? 0) + 1);
  }
  const byStatus = [...byStatusMap.entries()]
    .sort((a, b) => statusIndex(a[0] as never) - statusIndex(b[0] as never))
    .map(([status, count]) => ({ status: status as Order["status"], count }));

  // ---------------- tablas ----------------
  const overdueInvoices = pendingInvoices
    .filter((o) => o.dueDate < today)
    .map((o) => ({
      orderId: o.id,
      orderNumber: o.id,
      customer: o.buyer.company,
      invoiceNumber: o.invoiceNumber,
      invoiceDate: o.invoiceDate,
      dueDate: o.dueDate,
      totalUSD: o.totalUSD,
      daysOverdue: daysBetween(o.dueDate, today),
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
    .slice(0, 10);

  const problemOrders: ProblemOrder[] = [];
  for (const o of windowOrders.concat(orders.filter((x) => x.status === "delivered" && x.invoiceDate >= fromISO))) {
    const seen = new Set(problemOrders.map((p) => p.orderId));
    if (seen.has(o.id)) continue;
    const incident = events.find(
      (e) => e.orderId === o.id && e.type === "incident"
    );
    const deliveredEv = events.find(
      (e) => e.orderId === o.id && e.type === "status" && e.status === "delivered"
    );
    if (deliveredEv && deliveredEv.at.slice(0, 10) > o.estimatedDelivery.slice(0, 10)) {
      if (!incident) {
        problemOrders.push({
          orderId: o.id,
          orderNumber: o.id,
          customer: o.buyer.company,
          status: o.status,
          issue: "late_delivery",
          detail: `entregado ${deliveredEv.at.slice(0, 10)} · ETA ${o.estimatedDelivery.slice(0, 10)}`,
        });
      } else {
        problemOrders.push({
          orderId: o.id,
          orderNumber: o.id,
          customer: o.buyer.company,
          status: o.status,
          issue: "incident",
          detail: `entrega tardía + incidencia`,
        });
      }
    } else if (incident) {
      problemOrders.push({
        orderId: o.id,
        orderNumber: o.id,
        customer: o.buyer.company,
        status: o.status,
        issue: "incident",
        detail: `incidencia (${incident.incidentKind ?? "—"}) · ETA ${o.estimatedDelivery.slice(0, 10)}`,
      });
    }
  }
  problemOrders.sort((a, b) => a.orderNumber.localeCompare(b.orderNumber));

  return {
    generatedAt: nowISO,
    period: p,
    fromISO,
    totals: {
      salesUSD,
      boxesSold,
      stemsSold,
      ordersCount,
      avgOrderUSD: Math.round(avgOrderUSD * 100) / 100,
      avgPricePerStemUSD: Math.round(avgPricePerStemUSD * 1000) / 1000,
      marginPerBoxCOP: Math.round(marginPerBoxCOP),
      marginTotalCOP: Math.round(marginOverBoxesTotalCOP),
      marginPct: Math.round(marginPct * 10) / 10,
      receivableUSD,
      avgCollectionDays,
      onTimePct,
      incidentPct,
    },
    byMonth,
    byCustomer,
    top3SharePct,
    receivablesByAging: aging,
    byStatus,
    onTimeVsLate: { onTime, late },
    overdueInvoices,
    problemOrders: problemOrders.slice(0, 10),
  };
}
