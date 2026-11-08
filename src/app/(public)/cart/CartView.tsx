"use client";
import Link from "next/link";
import { useState } from "react";
import { useCart, useLang, useRate } from "../../providers";
import { format_money, usd_to_cop } from "@/lib/money";

export interface CartProduct {
  id: string;
  name: string;
  grade: string;
  image: string;
  stemsPerBox: number;
  minOrderBoxes: number;
  pricePerBoxUSD: number;
  stockBoxes: number;
}

// Carrito en CAJAS enteras: cada línea muestra "n cajas = m tallos",
// el mínimo por producto y advertencias de stock.
export function CartView({ catalog }: { catalog: CartProduct[] }) {
  const { t } = useLang();
  const { rate } = useRate();
  const { items, hydrated, totalBoxes, setBoxes, remove } = useCart();
  const [warnings, setWarnings] = useState<string[]>([]);

  const lines = hydrated
    ? items
        .map((i) => ({ ...i, product: catalog.find((c) => c.id === i.productId) }))
        .filter((l): l is { productId: string; boxes: number; product: CartProduct } => !!l.product)
    : [];

  const subtotal = Math.round(
    lines.reduce((a, l) => a + l.boxes * l.product.pricePerBoxUSD, 0) * 100
  ) / 100;
  const totalStems = lines.reduce((a, l) => a + l.boxes * l.product.stemsPerBox, 0);

  function onImgError(e: React.SyntheticEvent<HTMLImageElement>) {
    e.currentTarget.src = "/demo-flowers/placeholder.svg";
  }

  function validate() {
    const errs: string[] = [];
    for (const l of lines) {
      if (l.boxes < l.product.minOrderBoxes)
        errs.push(t("cart.min_warn", { name: l.product.name, n: l.product.minOrderBoxes }));
      if (l.boxes > l.product.stockBoxes)
        errs.push(t("cart.stock_warn", { name: l.product.name, n: l.product.stockBoxes }));
    }
    setWarnings(errs);
    return errs.length === 0;
  }

  if (hydrated && lines.length === 0) {
    return (
      <div className="empty-state">
        <div className="big">🛒</div>
        <p>{t("cart.empty")}</p>
        <Link href="/catalog" className="btn btn-primary">
          {t("cart.cta")}
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-layout">
      <div className="cart-card">
        {lines.map((l) => {
          const lowWarn = l.boxes < l.product.minOrderBoxes;
          return (
            <div key={l.productId} className="cart-line">
              <img src={l.product.image} alt={l.product.name} onError={onImgError} />
              <div>
                <div className="name">{l.product.name}</div>
                <div className="meta">
                  {l.product.grade} · {t("unit.box_of_stems", { n: l.product.stemsPerBox })} ·{" "}
                  {format_money(l.product.pricePerBoxUSD)} {t("unit.per_box")}
                  <br />
                  <small>{format_money(usd_to_cop(l.product.pricePerBoxUSD, rate), { currency: "COP", decimals: 0 })}</small>
                </div>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => remove(l.productId)}
                >
                  {t("cart.remove")}
                </button>
              </div>
              <div className="qty-col">
                <div className="stepper">
                  <button
                    type="button"
                    aria-label="−"
                    onClick={() => setBoxes(l.productId, Math.max(1, l.boxes - 1))}
                  >
                    −
                  </button>
                  <span className="val">
                    {l.boxes}
                    <small>{t("cart.qty_boxes")}</small>
                  </span>
                  <button
                    type="button"
                    aria-label="+"
                    onClick={() => setBoxes(l.productId, l.boxes + 1)}
                  >
                    +
                  </button>
                </div>
                <small style={{ color: lowWarn ? "var(--warn)" : "var(--ink-faint)" }}>
                  {t("unit.eq_stems", { n: l.boxes, m: l.boxes * l.product.stemsPerBox })}
                </small>
              </div>
              <div className="line-total">
                <b>{format_money(l.boxes * l.product.pricePerBoxUSD)}</b>
              </div>
            </div>
          );
        })}
      </div>

      <div className="summary-card">
        <h3>{t("cart.summary_t")}</h3>
        <div className="summary-row">
          <span>{t("cart.total_boxes")}</span>
          <b>{t("unit.box_n", { n: totalBoxes })}</b>
        </div>
        <div className="summary-row">
          <span>{t("cart.total_stems")}</span>
          <b>{t("unit.stems", { n: totalStems })}</b>
        </div>
        <div className="summary-row">
          <span>{t("cart.subtotal")}</span>
          <span className="price">
            {format_money(subtotal)}
            <span className="cop">
              {format_money(usd_to_cop(subtotal, rate), { currency: "COP", decimals: 0 })}
            </span>
          </span>
        </div>
        <div className="note">{t("cart.ship_note")}</div>
        {warnings.length > 0 && (
          <div className="form-error" style={{ marginTop: 12 }}>
            {warnings.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>
        )}
        <button
          type="button"
          className="btn btn-primary btn-lg"
          style={{ marginTop: 14, width: "100%" }}
          onClick={() => {
            if (validate()) location.href = "/checkout";
          }}
        >
          {t("cart.to_checkout")} →
        </button>
      </div>
    </div>
  );
}
