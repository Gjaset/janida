"use client";
import { useState } from "react";
import { useCart, useLang, useRate } from "../../../providers";
import { format_money, usd_to_cop } from "@/lib/money";

interface DetailProduct {
  id: string;
  variety: string;
  name: string;
  desc: string;
  type: string;
  colorFamily: string;
  stemsPerBox: number;
  minOrderBoxes: number;
  pricePerBoxUSD: number;
  stockBoxes: number;
  grade: string;
  gallery: string[];
}

export function DetailClient({ product: p }: { product: DetailProduct }) {
  const { t } = useLang();
  const { rate } = useRate();
  const { add } = useCart();
  const [imgIdx, setImgIdx] = useState(0);
  const [boxes, setBoxes] = useState(p.minOrderBoxes);

  const out = p.stockBoxes < p.minOrderBoxes;
  const low = p.stockBoxes <= 20;
  const perStem = p.pricePerBoxUSD / p.stemsPerBox;
  const subtotalUSD = boxes * p.pricePerBoxUSD;

  function onImgError(e: React.SyntheticEvent<HTMLImageElement>) {
    e.currentTarget.src = "/demo-flowers/placeholder.svg";
  }

  // Las cajas se piden en múltiplos del pedido mínimo
  function step(delta: number) {
    setBoxes((b) => Math.max(p.minOrderBoxes, b + delta * p.minOrderBoxes));
  }

  return (
    <>
      <div className="detail-layout" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 34, alignItems: "start" }}>
        {/* Galería */}
        <div>
          <div className="gallery-main">
            <img src={p.gallery[imgIdx] ?? p.gallery[0]} alt={p.name} onError={onImgError} />
          </div>
          <div className="gallery-thumbs">
            {p.gallery.map((u, i) => (
              <img
                key={u + i}
                src={u}
                alt={`${p.name} ${i + 1}`}
                className={i === imgIdx ? "selected" : ""}
                onClick={() => setImgIdx(i)}
                onError={onImgError}
              />
            ))}
          </div>
        </div>

        {/* Información */}
        <div>
          <span className="badge badge-package">
            📦 {t("unit.box_of_stems", { n: p.stemsPerBox })}
          </span>
          <h1 style={{ marginTop: 10 }}>{p.name}</h1>
          <p style={{ color: "var(--ink-soft)" }}>{p.desc}</p>

          {/* Tabla Cómo se vende */}
          <ul className="specs">
            <li>
              <span>{t("detail.variety")}</span>
              <b>{p.variety}</b>
            </li>
            <li>
              <span>{t("detail.color")}</span>
              <b>{t(`color.${p.colorFamily}`)}</b>
            </li>
            <li>
              <span>{t("detail.type")}</span>
              <b>{t(p.type === "standard" ? "detail.type_standard" : "detail.type_spray")}</b>
            </li>
            <li>
              <span>{t("detail.grade")}</span>
              <b>{p.grade}</b>
            </li>
          </ul>

          <div className="panel" style={{ boxShadow: "var(--shadow-1)" }}>
            <h3 style={{ marginBottom: 10 }}>{t("detail.how_sold_t")}</h3>
            <ul className="specs" style={{ margin: 0 }}>
              <li>
                <span>{t("detail.how_sold_unit")}</span>
                <b>{t("detail.how_sold_unit_v")}</b>
              </li>
              <li>
                <span>{t("detail.how_sold_stems")}</span>
                <b>{t("unit.stems", { n: p.stemsPerBox })}</b>
              </li>
              <li>
                <span>{t("detail.how_sold_price_box")}</span>
                <b>
                  {format_money(p.pricePerBoxUSD)}
                  <small style={{ color: "var(--ink-faint)", fontWeight: 500 }}>
                    {" "}
                    ·{" "}
                    {format_money(usd_to_cop(p.pricePerBoxUSD, rate), {
                      currency: "COP",
                      decimals: 0,
                    })}
                  </small>
                </b>
              </li>
              <li>
                <span>{t("detail.how_sold_price_stem")}</span>
                <b>{format_money(perStem, { decimals: 3 })}</b>
              </li>
              <li>
                <span>{t("detail.how_sold_min")}</span>
                <b>{t("unit.box_n", { n: p.minOrderBoxes })}</b>
              </li>
              <li>
                <span>{t("detail.availability")}</span>
                <b>
                  {out ? (
                    <span className="badge badge-out">{t("catalog.out")}</span>
                  ) : low ? (
                    <span className="badge badge-low">
                      {t("catalog.avail_low", { n: p.stockBoxes })}
                    </span>
                  ) : (
                    t("catalog.avail", { n: p.stockBoxes })
                  )}
                </b>
              </li>
            </ul>

            <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 16, flexWrap: "wrap" }}>
              <div className="stepper">
                <button type="button" onClick={() => step(-1)} disabled={boxes <= p.minOrderBoxes} aria-label="−">
                  −
                </button>
                <span className="val">
                  {boxes}
                  <small>{t("cart.qty_boxes")}</small>
                </span>
                <button type="button" onClick={() => step(1)} disabled={out} aria-label="+">
                  +
                </button>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                {t("unit.eq_stems", { n: boxes, m: boxes * p.stemsPerBox })}
                <br />
                <b style={{ color: "var(--brand-strong)" }}>{format_money(subtotalUSD)}</b>
              </div>
              <button
                type="button"
                className="btn btn-accent"
                disabled={out}
                onClick={() => add(p.id, boxes)}
              >
                🛒 {t("catalog.add")}
              </button>
            </div>
            <div className="note">{t("detail.min_attention", { n: p.minOrderBoxes })}</div>
          </div>
        </div>
      </div>
    </>
  );
}
