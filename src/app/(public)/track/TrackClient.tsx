"use client";
import { useCallback, useEffect, useState } from "react";
import { useLang, useRate } from "../../providers";
import { format_money } from "@/lib/money";
import { TRACKING_STATUSES } from "@/lib/types";

// ------------------------------------------------------------------
// Consulta + timeline vertical del pedido:
//   · estado actual en rosa, completados en verde, pendientes en gris
//   · AWB, ETA, tallos contados frente a lo pedido
//   · incidencias (retraso / retención en aduana)
// ------------------------------------------------------------------

interface TrackEvent {
  type: "status" | "incident";
  status: string | null;
  incidentKind: string | null;
  at: string;
  location: string;
  note: string | null;
  recordedBy: string;
  etaShiftDays: number | null;
}

interface TrackResult {
  order: {
    id: string;
    buyer: { fullName: string; company: string; city: string; state: string };
    totalUSD: number;
    paymentTerms: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    paymentStatus: "pending" | "paid";
    paidAt: string | null;
    awb: string;
    estimatedDelivery: string;
    status: string;
    createdAt: string;
  };
  items: { nameEn: string; nameEs: string; boxes: number; stems: number; pricePerBoxUSD: number; subtotalUSD: number }[];
  events: TrackEvent[];
}

function fmtDate(iso: string): string {
  return iso.slice(0, 10);
}

export function TrackClient({ prefillOrder }: { prefillOrder: string }) {
  const { t, lang } = useLang();
  const [order, setOrder] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (prefillOrder) setOrder(prefillOrder);
  }, [prefillOrder]);

  const lookup = useCallback(async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNumber: order, email }),
      });
      if (res.status === 404) {
        setError(t("track.not_found"));
      } else if (res.ok) {
        const j = await res.json();
        setResult({ order: j.order, items: j.items, events: j.events });
      } else if (res.status === 422) {
        setError(t("checkout.err_fields"));
      } else {
        setError(t("contact.err"));
      }
    } catch {
      setError(t("contact.err"));
    }
    setBusy(false);
  }, [order, email, t]);

  // ----------------------------------------------------------------
  // Timeline vertical
  // ----------------------------------------------------------------
  function renderTimeline(r: TrackResult) {
    const eventsByStatus = new Map<string, TrackEvent>();
    for (const e of r.events) {
      if (e.type === "status" && e.status) eventsByStatus.set(e.status, e);
    }
    const incidents = r.events.filter((e) => e.type === "incident");
    const current = r.order.status;
    const cancelled = current === "cancelled";
    const currentIdx = TRACKING_STATUSES.indexOf(current as never);

    return (
      <div>
        <ol className="track-timeline" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {TRACKING_STATUSES.map((status, idx) => {
            const ev = eventsByStatus.get(status);
            const isCurrent = status === current;
            const done = idx < currentIdx;
            const pending = idx > currentIdx && !cancelled;
            const cls = cancelhedCls(isCurrent, done, pending);
            return (
              <li key={status} className={cls} data-state={isCurrent ? "current" : done ? "done" : "pending"}>
                <div style={{ fontWeight: 600 }}>
                  {t(`status.${status}`)}
                  {isCurrent && (
                    <span className="badge badge-package" style={{ marginLeft: 8 }}>
                      {t("track.state")}
                    </span>
                  )}
                </div>
                {ev ? (
                  <small>
                    {fmtDate(ev.at)} · {t(`loc.${ev.location}`)}
                    {ev.recordedBy ? ` · ${t("recorded_by")}: ${ev.recordedBy}` : ""}
                    {ev.note ? (
                      <>
                        {" · "}
                        {ev.note}
                      </>
                    ) : null}
                  </small>
                ) : done || isCurrent ? (
                  <small>·</small>
                ) : null}
              </li>
            );
          })}
          {cancelled && (
            <li className="cancelled" data-state="cancelled">
              <div style={{ fontWeight: 600, color: "var(--danger)" }}>
                {t("status.cancelled")}
              </div>
              {eventsByStatus.get("cancelled") && (
                <small>{fmtDate(eventsByStatus.get("cancelled")!.at)}</small>
              )}
            </li>
          )}
        </ol>

        {/* incidencias */}
        {incidents.length > 0 && (
          <div className="dash-card" style={{ marginTop: 18 }}>
            <h3>{t("track.incidents_t")}</h3>
            {incidents.map((e, i) => (
              <div key={i} className="form-error" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}>
                <b>{e.incidentKind === "delay" ? t("incident.kind_delay") : t("incident.kind_customs")}</b>
                {" · "}
                {fmtDate(e.at)} · {t(`loc.${e.location}`)}
                {e.note ? ` · ${e.note}` : ""}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function cancelhedCls(isCurrent: boolean, done: boolean, _pending: boolean): string {
    return isCurrent ? "current" : done ? "done" : "pending";
  }

  const invoiceState =
    result &&
    (result.order.paymentStatus === "paid"
      ? "status_paid"
      : result.order.dueDate < new Date().toISOString().slice(0, 10)
        ? "status_overdue"
        : "status_pending");

  return (
    <>
      <form
        className="panel"
        style={{ maxWidth: 560, margin: "0 auto" }}
        onSubmit={(e) => {
          e.preventDefault();
          void lookup();
          // keep searchParams in sync for the shareable link
          if (order) window.history.replaceState(null, "", `/track?order=${encodeURIComponent(order)}`);
        }}
      >
        <div className="form-grid">
          <div className="field">
            <label htmlFor="tk-order">{t("track.f_order")}</label>
            <input
              id="tk-order"
              value={order}
              onChange={(e) => setOrder(e.target.value.toUpperCase())}
              placeholder={t("track.f_order_ph")}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="tk-email">{t("track.f_email")}</label>
            <input
              id="tk-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("track.f_email_ph")}
              required
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? t("common.loading") : t("track.submit")}
        </button>
        {error && <div className="form-error" style={{ marginTop: 14 }}>{error}</div>}
      </form>

      {result && (
        <div style={{ maxWidth: 760, margin: "30px auto 0" }}>
          {/* Encabezado del pedido */}
          <div className="dash-card" style={{ marginBottom: 22 }}>
            <div className="grid-cards" style={{ gap: 20 }}>
              <div>
                <div className="kpi .label" style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 700, textTransform: "uppercase" }}>
                  {t("track.order_header", { num: result.order.id })}
                </div>
                <div style={{ fontSize: "1.05rem" }}>
                  {result.order.buyer.company} · {result.order.buyer.city}, {result.order.buyer.state}
                  <br />
                  <small style={{ color: "var(--ink-faint)" }}>
                    {t("track.placed")}: {fmtDate(result.order.createdAt)}
                  </small>
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 700, textTransform: "uppercase" }}>
                  {t("track.invoice")} · {t("track.terms")}
                </div>
                <div style={{ fontSize: "1.05rem" }}>
                  {result.order.invoiceNumber}
                  <span
                    className={`badge ${
                      invoiceState === "status_paid"
                        ? "badge-package"
                        : invoiceState === "status_overdue"
                          ? "badge-out"
                          : "badge-low"
                    }`}
                    style={{ marginLeft: 8 }}
                  >
                    {t(
                      invoiceState === "status_paid"
                        ? "invoice.status_paid"
                        : invoiceState === "status_overdue"
                          ? "invoice.status_overdue"
                          : "invoice.status_pending"
                    )}
                  </span>
                  <br />
                  <small style={{ color: "var(--ink-faint)" }}>
                    {result.order.paymentTerms === "prepaid"
                      ? t("confirm.terms_prepaid")
                      : t(`confirm.terms_${result.order.paymentTerms}`)}
                    {" · "}
                    {t("track.due")}: {fmtDate(result.order.dueDate)}
                    {result.order.dueDate < todayISO() &&
                      result.order.paymentStatus !== "paid" &&
                      ` · ${t("track.due")}`}
                  </small>
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 700, textTransform: "uppercase" }}>
                  {t("track.awb")}
                </div>
                <div style={{ fontSize: "1.05rem" }}>{result.order.awb}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 700, textTransform: "uppercase" }}>
                  {t("track.est_t")}
                </div>
                <div style={{ fontSize: "1.05rem" }}>{fmtDate(result.order.estimatedDelivery)}</div>
              </div>
            </div>
          </div>

          {/* Líneas: cajas y tallos */}
          <div className="dash-card" style={{ marginBottom: 22 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("cart.col_product")}</th>
                  <th>{t("cart.col_qty")}</th>
                  <th>{t("cart.total_stems")}</th>
                  <th>{t("cart.col_total")}</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((i, idx) => (
                  <tr key={idx}>
                    <td className="strong">{lang === "es" ? i.nameEs : i.nameEn}</td>
                    <td>{i.boxes}</td>
                    <td>{t("unit.stems", { n: i.stems })}</td>
                    <td>{format_money(i.subtotalUSD)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <span style={{ color: "var(--ink-soft)" }}>
                {t("unit.box_n", { n: result.items.reduce((a, i) => a + i.boxes, 0) })} ·{" "}
                {t("track.total")}: <b>{format_money(result.order.totalUSD)}</b>
              </span>
              <span
                style={{
                  color: "var(--ok)",
                  fontWeight: 600,
                }}
              >
                {countable(result) > 0 &&
                  t("track.stems_line", {
                    a: countable(result),
                    b: result.items.reduce((a, i) => a + i.stems, 0),
                  })}
              </span>
            </div>
            <div className="note">{t("track.counting_note")}</div>
          </div>

          {/* Timeline */}
          <div className="dash-card">{renderTimeline(result)}</div>
        </div>
      )}
    </>
  );
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Tallos contados: total si ya pasó la revisión en poscosecha; si no, 0 */
function countable(r: TrackResult): number {
  const total = r.items.reduce((a, i) => a + i.stems, 0);
  const reviewed =
    r.events.some(
      (e) => e.type === "status" && e.status === "post_harvest_review"
    ) ||
    TRACKING_STATUSES.indexOf(r.order.status as never) >= TRACKING_STATUSES.indexOf("post_harvest_review");
  return reviewed && r.order.status !== "cancelled" ? total : 0;
}
