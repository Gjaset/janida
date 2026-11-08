import Link from "next/link";
import { notFound } from "next/navigation";
import { getLangCookie, t } from "@/lib/i18n";
import { getOrder, itemsOfOrder } from "@/lib/store";
import { format_money } from "@/lib/money";
import { nextStatus } from "@/lib/types";

// Página de confirmación tras emitir el pedido: número de pedido,
// factura emitida con vencimiento según condiciones, resumen en
// cajas y tallos, y próximo estado del tracking.
export default async function OrderConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lang = await getLangCookie();
  const order = await getOrder(decodeURIComponent(id));
  if (!order) notFound();
  const items = await itemsOfOrder(order.id);

  const termsLabel = t(lang, `confirm.terms_${order.paymentTerms}`);
  const moderateStems = items.reduce((a, i) => a + i.stems, 0);
  const totalBoxes = items.reduce((a, i) => a + i.boxes, 0);
  const next = nextStatus(order.status);

  return (
    <div className="container page-pad order-confirm">
      <div className="ok-banner">
        <div className="icon">✿</div>
        <div>
          <b>{t(lang, "confirm.thanks")}</b>
          <p style={{ margin: "4px 0 0" }}>{t(lang, "confirm.lead")}</p>
        </div>
      </div>

      <div className="dash-card" style={{ marginBottom: 22 }}>
        <div className="grid-cards" style={{ gap: 24 }}>
          <div>
            <div style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--ink-faint)", fontWeight: 700 }}>
              {t(lang, "confirm.order")}
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.7rem", color: "var(--brand-strong)" }}>
              {order.id}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--ink-faint)", fontWeight: 700 }}>
              {t(lang, "confirm.invoice")}
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", color: "var(--brand-strong)" }}>
              {order.invoiceNumber}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--ink-faint)", fontWeight: 700 }}>
              {t(lang, "confirm.terms")}
            </div>
            <div style={{ fontSize: "1.1rem", color: "var(--ink)" }}>
              {termsLabel}
              <br />
              <small style={{ color: "var(--ink-faint)" }}>
                {t(lang, "confirm.due_date")}: {order.dueDate}
              </small>
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--ink-faint)", fontWeight: 700 }}>
              {t(lang, "track.est_t")}
            </div>
            <div style={{ fontSize: "1.1rem", color: "var(--ink)" }}>
              {order.estimatedDelivery.slice(0, 10)}
              <br />
              <small style={{ color: "var(--ink-faint)" }}>AWB {order.awb}</small>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t(lang, "cart.col_product")}</th>
              <th>{t(lang, "cart.col_qty")}</th>
              <th>{t(lang, "confirm.stems_col")}</th>
              <th>{t(lang, "detail.how_sold_price_box")}</th>
              <th>{t(lang, "cart.col_total")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td className="strong">{lang === "es" ? i.name_es : i.name_en}</td>
                <td>{i.boxes}</td>
                <td>{i.stems}</td>
                <td>{format_money(i.pricePerBoxUSD)}</td>
                <td>{format_money(i.subtotalUSD)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <span style={{ color: "var(--ink-soft)" }}>
            {t(lang, "unit.box_n", { n: totalBoxes })} · {t(lang, "unit.stems", { n: moderateStems })}
          </span>
          <b style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", color: "var(--brand-strong)" }}>
            {format_money(order.totalUSD)}
          </b>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 22 }}>
        <h3>{t(lang, "confirm.next_t")}</h3>
        <ol style={{ color: "var(--ink-soft)", margin: 0, paddingLeft: 20 }}>
          <li>{t(lang, "confirm.next_1")}</li>
          <li>{t(lang, "confirm.next_2")}</li>
          <li>{t(lang, "confirm.next_3")}</li>
        </ol>
        <p style={{ color: "var(--ink-faint)", fontSize: "0.85rem" }}>
          {t(lang, "confirm.tip")}
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href={`/track?order=${order.id}`} className="btn btn-accent">
            {t(lang, "confirm.track_cta")} →
          </Link>
          {next && (
            <span className="status-chip" style={{ alignSelf: "center" }}>
              {t(lang, "track.state")}: {t(lang, `status.${order.status}`)} →{" "}
              {t(lang, `status.${next}`)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
