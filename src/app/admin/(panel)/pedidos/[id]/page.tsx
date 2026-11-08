import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, itemsOfOrder, eventsOfOrder } from "@/lib/store";
import { format_money } from "@/lib/money";
import { statusEs } from "../../dashboard-helpers";
import { OrderActions } from "./OrderActions";

// Detalle del pedido en el panel: cabecera (factura, condiciones,
// AWB, ETA), líneas en cajas/tallos, acciones sobre la escalera de
// tracking e incidencias, y timeline completo con eventos.
export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(decodeURIComponent(id));
  if (!order) notFound();
  const [items, events] = await Promise.all([
    itemsOfOrder(order.id),
    eventsOfOrder(order.id),
  ]);

  const totalBoxes = items.reduce((a, i) => a + i.boxes, 0);
  const totalStems = items.reduce((a, i) => a + i.stems, 0);
  const reviewDone = events.some(
    (e) => e.type === "status" && e.status === "post_harvest_review"
  );
  const incidents = events.filter((e) => e.type === "incident");

  const terms =
    order.paymentTerms === "prepaid" ? "Prepago" : `Crédito ${order.paymentTerms.replace("net", "")} días`;

  return (
    <>
      <div className="admin-h">
        <div>
          <div className="admin-opt">
            <Link href="/admin/pedidos">← Pedidos</Link>
          </div>
          <h1>
            {order.id} · {order.buyer.company}
          </h1>
          <div className="admin-opt">
            {statusEs(order.status)} · emitido {order.invoiceDate}
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-card">
          <h3>Producto / factura</h3>
          <table className="rank-table">
            <tbody>
              <tr>
                <td>Factura</td>
                <td className="num">{order.invoiceNumber}</td>
              </tr>
              <tr>
                <td>Condiciones de pago</td>
                <td className="num">{terms}</td>
              </tr>
              <tr>
                <td>Estado de factura</td>
                <td className="num">
                  {order.paymentStatus === "paid"
                    ? `Pagada (${order.paidAt})`
                    : `Por pagar · vence ${order.dueDate}`}
                </td>
              </tr>
              <tr>
                <td>Guía aérea (AWB)</td>
                <td className="num">{order.awb}</td>
              </tr>
              <tr>
                <td>Entrega estimada</td>
                <td className="num">{order.estimatedDelivery.slice(0, 10)}</td>
              </tr>
              <tr>
                <td>Cajas · tallos</td>
                <td className="num">
                  {totalBoxes} cajas · {totalStems.toLocaleString("es-CO")} tallos
                </td>
              </tr>
              <tr>
                <td>Conteo verificado</td>
                <td className="num">
                  {reviewDone ? `${totalStems.toLocaleString("es-CO")} de ${totalStems.toLocaleString("es-CO")}` : "pendiente"}
                </td>
              </tr>
              <tr>
                <td>Total</td>
                <td className="num">{format_money(order.totalUSD)}</td>
              </tr>
            </tbody>
          </table>
          {incidents.length > 0 && (
            <div className="form-error" style={{ background: "var(--warn-soft)", color: "var(--warn)", marginTop: 12 }}>
              <b>Incidencias:</b>{" "}
              {incidents
                .map((e) =>
                  e.incidentKind === "delay"
                    ? "retraso"
                    : "retención en aduana"
                )
                .join(", ")}
            </div>
          )}
        </div>

        <div className="dash-card">
          <OrderActions
            orderId={order.id}
            status={order.status}
            paymentStatus={order.paymentStatus}
          />
          <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "16px 0" }} />
          <h3>Comprador</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--ink-soft)" }}>
            {order.buyer.fullName}
            <br />
            {order.buyer.company}
            <br />
            {order.buyer.addressLine1}
            {order.buyer.addressLine2 ? `, ${order.buyer.addressLine2}` : ""}
            <br />
            {order.buyer.city}, {order.buyer.state} {order.buyer.postalCode},{" "}
            {order.buyer.country}
            <br />
            {order.buyer.email} · {order.buyer.phone}
            {order.buyer.notes ? (
              <>
                <br />
                <i>Notas: {order.buyer.notes}</i>
              </>
            ) : null}
          </p>
        </div>
      </div>

      {/* líneas */}
      <div className="dash-card" style={{ marginTop: 18 }}>
        <h3>Líneas del pedido</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Variedad (EN)</th>
              <th>Variedad (ES)</th>
              <th>Cajas</th>
              <th>Tallos</th>
              <th>Precio por caja</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td className="strong">{i.name_en}</td>
                <td>{i.name_es}</td>
                <td>{i.boxes}</td>
                <td>{i.stems.toLocaleString("es-CO")}</td>
                <td>{format_money(i.pricePerBoxUSD)}</td>
                <td>{format_money(i.subtotalUSD)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* timeline */}
      <div className="dash-card" style={{ marginTop: 18 }}>
        <h3>Línea de tiempo</h3>
        <ul className="timeline">
          {events.map((e) => (
            <li key={e.id}>
              {e.type === "incident" ? (
                <>
                  <b style={{ color: "var(--warn)" }}>
                    Incidencia:{" "}
                    {e.incidentKind === "delay" ? "retraso" : "retención en aduana"}
                    {e.etaShiftDays ? ` (+${e.etaShiftDays} días a la ETA)` : ""}
                  </b>
                </>
              ) : (
                <b>{statusEs(e.status ?? "")}</b>
              )}
              <br />
              <small>
                {new Date(e.at).toLocaleString("es-CO")} · {e.location} ·{" "}
                {e.recordedBy}
                {e.note ? <> · {e.note}</> : null}
              </small>
            </li>
          ))}
          {events.length === 0 && <li>Sin eventos registrados.</li>}
        </ul>
      </div>
    </>
  );
}
