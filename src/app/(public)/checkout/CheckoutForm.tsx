"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart, useLang } from "../../providers";
import { format_money } from "@/lib/money";
import type { PaymentTerms } from "@/lib/types";

export interface CheckoutProduct {
  id: string;
  name: string;
  image: string;
  stemsPerBox: number;
  minOrderBoxes: number;
  pricePerBoxUSD: number;
  stockBoxes: number;
}

// Checkout B2B: NO se piden datos de tarjeta. El cliente elige
// condiciones de pago (prepago o crédito a 30/60/90 días) y recibe
// una factura comercial. Todo se valida y calcula en el servidor.
export function CheckoutForm({
  catalog,
  rate,
}: {
  catalog: CheckoutProduct[];
  rate: number;
}) {
  const { t } = useLang();
  const router = useRouter();
  const { items, hydrated, totalBoxes, clear } = useCart();
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>("prepaid");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrs, setFieldErrs] = useState<Record<string, string[]>>({});

  const lines = hydrated
    ? items.flatMap((i) => {
        const product = catalog.find((c) => c.id === i.productId);
        return product
          ? [{ product, productId: i.productId, boxes: i.boxes }]
          : [];
      })
    : [];

  const subtotalUSD =
    Math.round(
      lines.reduce((a, l) => a + l.boxes * l.product.pricePerBoxUSD, 0) * 100
    ) / 100;
  const totalStems = lines.reduce(
    (a, l) => a + l.boxes * l.product.stemsPerBox,
    0
  );

  const termsOptions: { value: PaymentTerms; labelKey: string; descKey: string }[] = [
    { value: "prepaid", labelKey: "checkout.pay_prepaid", descKey: "checkout.pay_prepaid_d" },
    { value: "net30", labelKey: "checkout.pay_net30", descKey: "checkout.pay_net30_d" },
    { value: "net60", labelKey: "checkout.pay_net60", descKey: "checkout.pay_net60_d" },
    { value: "net90", labelKey: "checkout.pay_net90", descKey: "checkout.pay_net90_d" },
  ];

  function errMsg(key: string): string | undefined {
    return fieldErrs[key]?.[0];
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lines.length === 0) return;
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setSubmitting(true);
    setError(null);
    setFieldErrs({});

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          buyer: {
            fullName: data.fullName,
            company: data.company,
            country: data.country,
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
            email: data.email,
            phone: data.phone,
            notes: data.notes || "",
          },
          paymentTerms,
          items: lines.map((l) => ({ productId: l.productId, boxes: l.boxes })),
        }),
      });
      if (res.status === 201) {
        clear();
        const j = await res.json();
        router.push(`/orders/${j.orderNumber}`);
        return;
      }
      if (res.status === 422) {
        const j = await res.json();
        const issues = (j.issues?.fieldErrors ?? {}) as Record<string, string[]>;
        setFieldErrs(issues as Record<string, string[]>);
        setError(t("checkout.err_fields"));
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? t("checkout.err_generic"));
      }
    } catch {
      setError(t("checkout.err_generic"));
    }
    setSubmitting(false);
  }

  function buyerField(
    name: string,
    labelKey: string,
    opts: {
      type?: string;
      required?: boolean;
      placeholder?: string;
      span2?: boolean;
      defaultValue?: string;
    } = {}
  ) {
    const err = errMsg(name);
    return (
      <div className={`field${opts.span2 ? " span2" : ""}`}>
        <label htmlFor={`f-${name}`}>
          {t(labelKey)} {opts.required !== false && (
            <span className="req">{t("common.required_mark")}</span>
          )}
        </label>
        <input
          id={`f-${name}`}
          name={name}
          type={opts.type ?? "text"}
          required={opts.required !== false}
          placeholder={opts.placeholder}
          defaultValue={opts.defaultValue}
        />
        {err && <div className="err">{err}</div>}
      </div>
    );
  }

  if (hydrated && lines.length === 0) {
    return (
      <div className="empty-state">
        <div className="big">🛒</div>
        <p>{t("cart.empty")}</p>
        <a href="/catalog" className="btn btn-primary">
          {t("cart.cta")}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="checkout-layout">
        <div>
          {error && <div className="form-error">{error}</div>}
          <div className="panel">
            <h3 style={{ marginBottom: 14 }}>{t("checkout.buyer_t")}</h3>
            <div className="form-grid">
              {buyerField("fullName", "checkout.f_fullname", { placeholder: "Dana Whitfield" })}
              {buyerField("company", "checkout.f_company", { placeholder: "Garden State Floral Corp." })}
              {buyerField("country", "checkout.f_country", { defaultValue: "United States" })}
              {buyerField("email", "checkout.f_email", { type: "email", placeholder: "purchasing@yourcompany.com" })}
              {buyerField("phone", "checkout.f_phone", { placeholder: "+1 (555) 555-0100" })}
              {buyerField("addressLine1", "checkout.f_addr1", { span2: true, placeholder: "2210 Industrial Pkwy" })}
              {buyerField("addressLine2", "checkout.f_addr2", { span2: true, required: false })}
              {buyerField("city", "checkout.f_city")}
              {buyerField("state", "checkout.f_state")}
              {buyerField("postalCode", "checkout.f_postal")}
              <div className="field span2">
                <label htmlFor="f-notes">{t("checkout.f_notes")}</label>
                <textarea id="f-notes" name="notes" rows={3} maxLength={500} />
              </div>
            </div>
          </div>

          <div className="panel" style={{ marginTop: 22 }}>
            <h3 style={{ marginBottom: 14 }}>{t("checkout.pay_t")}</h3>
            <div className="grid-cards" style={{ gap: 12 }}>
              {termsOptions.map((o) => (
                <label
                  key={o.value}
                  className={`value-card pay-option${paymentTerms === o.value ? " selected" : ""}`}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="radio"
                      name="paymentTerms"
                      value={o.value}
                      checked={paymentTerms === o.value}
                      onChange={() => setPaymentTerms(o.value)}
                    />
                    <h3 style={{ margin: 0 }}>{t(o.labelKey)}</h3>
                  </div>
                  <p>{t(o.descKey)}</p>
                </label>
              ))}
            </div>
            <div className="note">{t("checkout.est_note")}</div>
          </div>
        </div>

        {/* Resumen */}
        <div className="summary-card">
          <h3>{t("checkout.summary_t")}</h3>
          <div className="mini-lines">
            {lines.map((l) => (
              <div key={l.productId} className="row">
                <span>
                  {l.product.name}
                  <br />
                  <small style={{ color: "var(--ink-faint)" }}>
                    {t("unit.eq_stems", { n: l.boxes, m: l.boxes * l.product.stemsPerBox })}
                  </small>
                </span>
                <b>{format_money(l.boxes * l.product.pricePerBoxUSD)}</b>
              </div>
            ))}
          </div>
          <div className="summary-row" style={{ marginTop: 8 }}>
            <span>{t("cart.total_boxes")}</span>
            <b>{t("unit.box_n", { n: totalBoxes })}</b>
          </div>
          <div className="summary-row">
            <span>{t("cart.total_stems")}</span>
            <b>{t("unit.stems", { n: totalStems })}</b>
          </div>
          <div className="summary-row total">
            <span>{t("track.total")}</span>
            <span className="price">
              {format_money(subtotalUSD)}
              <span className="cop">
                {format_money(
                  Math.round(subtotalUSD * rate),
                  { currency: "COP", decimals: 0 }
                )}
              </span>
            </span>
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: "100%", marginTop: 12 }}
            disabled={submitting}
          >
            {submitting ? t("common.loading") : t("checkout.submit")}
          </button>
        </div>
      </div>
    </form>
  );
}
