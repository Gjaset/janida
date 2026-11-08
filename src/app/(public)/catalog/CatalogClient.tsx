"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart, useLang, useRate } from "../../providers";
import { format_money, usd_to_cop } from "@/lib/money";

// Forma pública del producto (serializable, ya resuelta por idioma
// desde el servidor). La venta es por CAJAS ENTERAS.
export interface PublicProduct {
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
  image: string;
}

const COLORS = ["white", "pink", "salmon", "picotee", "fuchsia", "mix"];

export function CatalogClient({ products }: { products: PublicProduct[] }) {
  const { t } = useLang();
  const { rate } = useRate();
  const { add } = useCart();
  const [query, setQuery] = useState("");
  const [colorSel, setColorSel] = useState<string | null>(null);
  const [typeSel, setTypeSel] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [avail, setAvail] = useState<"all" | "in" | "out">("all");
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const list = useMemo(() => {
    return products.filter((p) => {
      const q = query.trim().toLowerCase();
      if (
        q &&
        !`${p.name} ${p.variety} ${p.desc} ${p.colorFamily}`.toLowerCase().includes(q)
      )
        return false;
      if (colorSel && p.colorFamily !== colorSel) return false;
      if (typeSel && p.type !== typeSel) return false;
      const min = minPrice === "" ? 0 : Number(minPrice);
      const max = maxPrice === "" ? Infinity : Number(maxPrice);
      if (p.pricePerBoxUSD < min || p.pricePerBoxUSD > max) return false;
      if (avail === "in" && p.stockBoxes < p.minOrderBoxes) return false;
      if (avail === "out" && p.stockBoxes >= p.minOrderBoxes) return false;
      return true;
    });
  }, [products, query, colorSel, typeSel, minPrice, maxPrice, avail]);

  const colorsPresent = useMemo(() => {
    const set = new Set(products.map((p) => p.colorFamily));
    return COLORS.filter((c) => set.has(c));
  }, [products]);

  function addToCart(p: PublicProduct) {
    add(p.id, p.minOrderBoxes);
    setJustAdded(p.id);
    setTimeout(() => setJustAdded(null), 1200);
  }

  function onImgError(e: React.SyntheticEvent<HTMLImageElement>) {
    e.currentTarget.src = "/demo-flowers/placeholder.svg";
  }

  return (
    <div className="catalog-layout">
      <aside className="filters" aria-label={t("catalog.f_variety")}>
        <div className="field" style={{ marginBottom: 4 }}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("catalog.search_ph")}
            aria-label={t("catalog.search_ph")}
          />
        </div>

        <h4>{t("catalog.f_color")}</h4>
        <div className="chip-row">
          {colorsPresent.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip${colorSel === c ? " selected" : ""}`}
              onClick={() => setColorSel(colorSel === c ? null : c)}
            >
              {t(`color.${c}`)}
            </button>
          ))}
        </div>

        <h4>{t("detail.type")}</h4>
        <div className="chip-row">
          {["standard", "spray"].map((ty) => (
            <button
              key={ty}
              type="button"
              className={`chip${typeSel === ty ? " selected" : ""}`}
              onClick={() => setTypeSel(typeSel === ty ? null : ty)}
            >
              {t(ty === "standard" ? "detail.type_standard" : "detail.type_spray")}
            </button>
          ))}
        </div>

        <h4>{t("catalog.f_price")}</h4>
        <div className="price-range">
          <input
            type="number"
            min={0}
            step="0.5"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder={t("catalog.any_price")}
            aria-label="USD min"
          />
          <span>—</span>
          <input
            type="number"
            min={0}
            step="0.5"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder={t("catalog.any_price")}
            aria-label="USD max"
          />
        </div>
        <div className="note" style={{ marginTop: 8 }}>
          {format_money(26, { decimals: 0 })} {t("unit.per_box")}
        </div>

        <h4>{t("catalog.f_avail")}</h4>
        {(
          [
            ["all", "catalog.f_all"],
            ["in", "catalog.f_in_stock"],
            ["out", "catalog.f_out"],
          ] as const
        ).map(([val, key]) => (
          <label key={val}>
            <input
              type="radio"
              name="avail"
              checked={avail === val}
              onChange={() => setAvail(val)}
            />
            {t(key)}
          </label>
        ))}

        <button
          type="button"
          className="btn btn-outline btn-sm"
          style={{ marginTop: 14 }}
          onClick={() => {
            setQuery("");
            setColorSel(null);
            setTypeSel(null);
            setMinPrice("");
            setMaxPrice("");
            setAvail("all");
          }}
        >
          {t("catalog.f_clear")}
        </button>
      </aside>

      <div>
        <div className="catalog-topbar">
          <span className="muted">
            {t(
              list.length === 1 ? "catalog.results_1" : "catalog.results",
              { n: list.length }
            )}
          </span>
        </div>

        {list.length === 0 ? (
          <div className="empty-state">
            <div className="big">🌸</div>
            {t("catalog.empty")}
          </div>
        ) : (
          <div className="product-grid">
            {list.map((p) => {
              const out = p.stockBoxes < p.minOrderBoxes;
              const low = p.stockBoxes <= 20;
              const perStem = p.pricePerBoxUSD / p.stemsPerBox;
              return (
                <article key={p.id} className="product-card">
                  <Link href={`/catalog/${p.id}`} className="ph" aria-label={p.name}>
                    <img src={p.image} alt={p.name} onError={onImgError} loading="lazy" />
                  </Link>
                  <div className="body">
                    <div>
                      <span className="badge badge-package">
                        📦 {t("unit.box_of_stems", { n: p.stemsPerBox })}
                      </span>
                    </div>
                    <div className="name">
                      <Link href={`/catalog/${p.id}`}>{p.name}</Link>
                    </div>
                    <div className="meta">
                      <span>{p.grade}</span>
                      <span>·</span>
                      <span>
                        {t(p.type === "standard" ? "detail.type_standard" : "detail.type_spray")}
                      </span>
                      <span>·</span>
                      <span>{t("unit.min_order", { n: p.minOrderBoxes })}</span>
                    </div>
                    <div className="avail">
                      {out ? (
                        <span className="badge badge-out">{t("catalog.out")}</span>
                      ) : low ? (
                        <span className="badge badge-low">
                          {t("catalog.avail_low", { n: p.stockBoxes })}
                        </span>
                      ) : (
                        t("catalog.avail", { n: p.stockBoxes })
                      )}
                    </div>
                    <div className="foot">
                      <div className="price">
                        {format_money(p.pricePerBoxUSD)}{" "}
                        <small style={{ fontWeight: 500, fontSize: "0.7em" }}>
                          {t("unit.per_box")}
                        </small>
                        <span className="cop">
                          {format_money(
                            usd_to_cop(p.pricePerBoxUSD, rate),
                            { currency: "COP", decimals: 0 }
                          )}{" "}
                          {t("catalog.per_box_cop")}
                          {" · "}
                          {format_money(perStem, { decimals: 3 })} {t("unit.per_stem")}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={out}
                        onClick={() => addToCart(p)}
                      >
                        {justAdded === p.id ? t("catalog.added") : t("catalog.add")}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
