// ============================================================
// Métricas del dashboard del admin, calculadas desde los datos
// del sistema (pedidos + productos del almacén).
//
// Convención de negocio (documentada en README):
// - "Ventas" = suma de totales de pedidos pagados NO cancelados.
// - Ventas COP = total USD × tasa del pedido (registrada al pagar).
// - Bajo inventario = productos activos con paquetes disponibles
//   ≤ LOW_STOCK_THRESHOLD_PACKAGES.
// - Ventas por periodo = últimos 6 meses naturales (incluye
//   meses sin ventas para leer la tendencia).
// ============================================================
import { EXCHANGE_RATE_COP, LOW_STOCK_THRESHOLD_PACKAGES } from "./config";
import { readDb } from "./store";
import type {
  DashboardMetrics,
  LowStockItem,
  MonthBucket,
  Order,
  OrderStatus,
  TopProduct,
} from "./types";

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function isCountedForSales(o: Order): boolean {
  return o.status !== "cancelado";
}

function monthKey(iso: string): string {
  return iso.slice(0, 7); // YYYY-MM
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `${MESES_CORTOS[Number(m) - 1]} ${y}`;
}

function lastSixMonthKeys(now = new Date()): string[] {
  const keys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export async function computeDashboardMetrics(): Promise<DashboardMetrics> {
  const db = await readDb();
  const orders = db.orders;
  const paid = orders.filter(isCountedForSales);

  // Totales
  const salesUSD = paid.reduce((a, o) => a + o.totalUSD, 0);
  const salesCOP = paid.reduce((a, o) => a + o.totalCOP, 0) ||
    Math.round(salesUSD * EXCHANGE_RATE_COP);
  const packagesSold = paid.reduce(
    (a, o) => a + o.items.reduce((b, i) => b + i.packages, 0),
    0
  );

  // Ventas por periodo (últimos 6 meses naturales)
  const monthKeys = lastSixMonthKeys();
  const byMonth: MonthBucket[] = monthKeys.map((key) => {
    const monthOrders = paid.filter((o) => monthKey(o.createdAt) === key);
    const mSales = monthOrders.reduce((a, o) => a + o.totalUSD, 0);
    return {
      month: key,
      label: monthLabel(key),
      orders: monthOrders.length,
      salesUSD: Math.round(mSales * 100) / 100,
      salesCOP: Math.round(mSales * EXCHANGE_RATE_COP),
    };
  });

  // Productos más vendidos (por paquetes) entre pagos no cancelados
  const map = new Map<string, TopProduct>();
  for (const o of paid) {
    for (const item of o.items) {
      const e = map.get(item.productId) ?? {
        productId: item.productId,
        name: item.productName,
        packagesSold: 0,
        revenueUSD: 0,
      };
      e.packagesSold += item.packages;
      e.revenueUSD = Math.round((e.revenueUSD + item.subtotalUSD) * 100) / 100;
      map.set(item.productId, e);
    }
  }
  const topProducts = [...map.values()]
    .sort((a, b) => b.packagesSold - a.packagesSold)
    .slice(0, 5);

  // Bajo inventario (paquetes)
  const lowStock: LowStockItem[] = db.products
    .filter((p) => p.active && p.packagesAvailable <= LOW_STOCK_THRESHOLD_PACKAGES)
    .sort((a, b) => a.packagesAvailable - b.packagesAvailable)
    .map((p) => ({
      productId: p.id,
      name: p.name,
      packagesAvailable: p.packagesAvailable,
      threshold: LOW_STOCK_THRESHOLD_PACKAGES,
    }));

  // Conteo por estado
  const byStatus = { pendiente: 0, confirmado: 0, en_transito: 0, entregado: 0, cancelado: 0 } as Record<OrderStatus, number>;
  for (const o of orders) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      salesUSD: Math.round(salesUSD * 100) / 100,
      salesCOP: Math.round(salesCOP),
      ordersCount: paid.length,
      packagesSold,
      avgOrderUSD: paid.length ? Math.round((salesUSD / paid.length) * 100) / 100 : 0,
      pendingCount: byStatus["pendiente"] ?? 0,
    },
    byMonth,
    topProducts,
    lowStock,
    byStatus,
    activeProducts: db.products.filter((p) => p.active).length,
  };
}
