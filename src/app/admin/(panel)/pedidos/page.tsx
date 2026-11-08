import Link from "next/link";
import { listOrders, readDb } from "@/lib/store";
import { format_money } from "@/lib/money";
import { statusEs } from "../dashboard-helpers";

// ------------------------------------------------------------------
// Lista de pedidos (admin, en español). Métricas y estados siempre
// calculados desde el sistema; el estado del tracking es el último
// de la escalera registrado en tracking_events.
// ------------------------------------------------------------------
export default async function AdminOrdersPage() {
  const [orders, db] = await Promise.all([listOrders(), readDb()]);
  const itemsByOrder = new Map<string, { boxes: number; stems: number }>();
  for (const it of db.order_items) {
    const cur = itemsByOrder.get(it.orderId) ?? { boxes: 0, stems: 0 };
    itemsByOrder.set(it.orderId, {
      boxes: cur.boxes + it.boxes,
      stems: cur.stems + it.stems,
    });
  }

  const sorted = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const today = new Date().toISOString().slice(0, 10);

  function invoiceChip(o: (typeof sorted)[number]) {
    if (o.paymentStatus === "paid") {
      return <span className="badge badge-package">Pagada</span>;
    }
    if (o.dueDate < today) {
      return <span className="badge badge-out">Vencida ({o.dueDate})</span>;
    }
    return <span className="badge badge-low">Por pagar</span>;
  }

  return (
    <>
      <div className="admin-h">
        <div>
          <h1>Pedidos</h1>
          <div className="admin-opt">
            {sorted.length} pedidos · venta por cajas enteras de 200 tallos
          </div>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Emitido</th>
            <th>Cajas</th>
            <th>Tallos</th>
            <th>Cond. pago</th>
            <th>Factura</th>
            <th>Estado</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((o) => {
            const agg = itemsByOrder.get(o.id) ?? { boxes: 0, stems: 0 };
            const terms =
              o.paymentTerms === "prepaid"
                ? "Prepago"
                : `Crédito ${o.paymentTerms.replace("net", "")} días`;
            return (
              <tr key={o.id}>
                <td>
                  <Link href={`/admin/pedidos/${o.id}`} className="strong">
                    {o.id}
                  </Link>
                </td>
                <td>{o.buyer.company}</td>
                <td>{o.invoiceDate}</td>
                <td>{agg.boxes}</td>
                <td>{agg.stems.toLocaleString("es-CO")}</td>
                <td>{terms}</td>
                <td>{invoiceChip(o)}</td>
                <td>
                  <span className="status-chip" data-status={o.status}>
                    {statusEs(o.status)}
                  </span>
                </td>
                <td className="strong">{format_money(o.totalUSD)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
