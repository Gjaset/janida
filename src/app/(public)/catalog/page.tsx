"use client";
// ============================================================
// CATÁLOGO DE CLAVELES (público, en inglés).
// - Venta ÚNICAMENTE en paquetes cerrados de 200 tallos.
// - Filtros: variedad/tipo, familia de color, rango de precio,
//   disponibilidad; búsqueda por texto; orden.
// - Galería de imágenes con fallback si una URL externa falla.
// ============================================================
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatUSD } from "@/lib/currency";
import { Price } from "../../Price";
import { Modal, ModalHead } from "../../Modal";
import { useCart } from "../../providers";

const FALLBACK_IMG = "/demo-flowers/placeholder.svg";

function GalleryImg({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={(e) => {
        const el = e.target as HTMLImageElement;
        if (el.src !== `${window.location.origin}${FALLBACK_IMG}`) {
          el.src = FALLBACK_IMG;
        }
      }}
    />
  );
}

export default function CatalogPage() {
  const { add, items } = useCart();

  const [products, setProducts] = useState<Product[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Filtros
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | "standard" | "spray">("all");
  const [color, setColor] = useState<string | "all">("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState<"featured" | "priceAsc" | "priceDesc" | "stockDesc">("featured");

  // Modal de detalle
  const [detail, setDetail] = useState<Product | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [detailQty, setDetailQty] = useState(1);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => setLoadError(true));
  }, []);

  const colors = useMemo(() => {
    const set = new Set((products ?? []).map((p) => p.colorFamily));
    return [...set].sort();
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...(products ?? [])];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        [p.name, p.variety, p.colorFamily, p.description].join(" ").toLowerCase().includes(q)
      );
    }
    if (type !== "all") list = list.filter((p) => p.type === type);
    if (color !== "all") list = list.filter((p) => p.colorFamily === color);
    const min = parseFloat(priceMin);
    const max = parseFloat(priceMax);
    if (!Number.isNaN(min)) list = list.filter((p) => p.priceUSD >= min);
    if (!Number.isNaN(max)) list = list.filter((p) => p.priceUSD <= max);
    if (onlyAvailable) list = list.filter((p) => p.packagesAvailable > 0);
    switch (sort) {
      case "priceAsc": list.sort((a, b) => a.priceUSD - b.priceUSD); break;
      case "priceDesc": list.sort((a, b) => b.priceUSD - a.priceUSD); break;
      case "stockDesc": list.sort((a, b) => b.packagesAvailable - a.packagesAvailable); break;
      default: break; // featured = orden del catálogo
    }
    return list;
  }, [products, search, type, color, priceMin, priceMax, onlyAvailable, sort]);

  function openDetail(p: Product) {
    setDetail(p);
    setGalleryIdx(0);
    setDetailQty(1);
  }

  function qtyInCart(productId: string): number {
    return items.find((i) => i.productId === productId)?.packages ?? 0;
  }

  if (loadError) {
    return (
      <div className="container page-pad">
        <div className="form-error">
          The catalog could not be loaded. Please refresh the page.
        </div>
        <Link href="/" className="btn btn-outline">← Back to home</Link>
      </div>
    );
  }

  return (
    <div className="container catalog-layout">
      {/* ---------------- Filtros ---------------- */}
      <aside className="filters">
        <h4>Search</h4>
        <input
          type="text"
          placeholder="Variety, color, name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search products"
        />

        <h4>Type</h4>
        {[
          ["all", "All types"],
          ["standard", "Standard (large bloom)"],
          ["spray", "Spray / mini carnation"],
        ].map(([val, label]) => (
          <label key={val}>
            <input
              type="radio"
              name="type"
              checked={type === val}
              onChange={() => setType(val as typeof type)}
            />
            {label}
          </label>
        ))}

        <h4>Color</h4>
        <div className="chip-row">
          <button
            className={`chip ${color === "all" ? "selected" : ""}`}
            onClick={() => setColor("all")}
          >
            All
          </button>
          {colors.map((c) => (
            <button
              key={c}
              className={`chip ${color === c ? "selected" : ""}`}
              onClick={() => setColor(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <h4>Price per package (USD)</h4>
        <div className="price-range">
          <input
            type="number"
            step="0.5"
            min="1"
            placeholder="17"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            aria-label="Minimum price"
          />
          <span>–</span>
          <input
            type="number"
            step="0.5"
            min="1"
            placeholder="20"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            aria-label="Maximum price"
          />
        </div>

        <h4>Availability</h4>
        <label>
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
          />
          Only in-stock varieties
        </label>
      </aside>

      {/* ---------------- Listado ---------------- */}
      <section>
        <div className="catalog-topbar">
          <strong>{products ? filtered.length : "…"} varieties</strong>
          <span className="muted">
            Sold exclusively in sealed packages of 200 stems (USD 17–20 each)
          </span>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort catalog">
            <option value="featured">Sort: Featured</option>
            <option value="priceAsc">Price: Low → High</option>
            <option value="priceDesc">Price: High → Low</option>
            <option value="stockDesc">Best availability</option>
          </select>
        </div>

        <div className="product-grid">
          {products === null &&
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="product-card"
                style={{ minHeight: 380, opacity: 0.5 }}
                aria-hidden
              />
            ))}

          {products !== null && filtered.length === 0 && (
            <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
              <div className="big">🌱</div>
              <p>No varieties match your filters. Try widening the price range or clearing the search.</p>
            </div>
          )}

          {(products ?? filtered).length > 0 &&
            filtered.map((p) => {
              const out = p.packagesAvailable <= 0;
              const low = !out && p.packagesAvailable <= 80; // umbral demo
              return (
                <article key={p.id} className="product-card">
                  <div
                    className="ph"
                    onClick={() => openDetail(p)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && openDetail(p)}
                  >
                    <GalleryImg src={p.galleryUrls[0]} alt={`${p.name} — clavel ${p.colorFamily}`} />
                  </div>
                  <div className="body">
                    <div className="name">{p.name}</div>
                    <div className="meta">
                      <span>{p.type === "spray" ? "Spray / mini" : "Standard"}</span>
                      <span>·</span>
                      <span>{p.colorFamily}</span>
                      <span>·</span>
                      <span>{p.grade}</span>
                    </div>
                    <div className="meta">
                      <span className="badge badge-package">
                        Paquete de {p.packageSize} tallos
                      </span>
                      {low && <span className="badge badge-low">Low stock</span>}
                      {out && <span className="badge badge-out">Out of stock</span>}
                    </div>
                    <div className="avail">
                      Available: <strong>{p.packagesAvailable}</strong> packages
                      {(p.packagesAvailable) * p.packageSize > 0 && (
                        <span style={{ color: "var(--ink-faint)" }}>
                          {" "}({p.packagesAvailable * p.packageSize} stems)
                        </span>
                      )}
                    </div>
                    <div className="foot">
                      <Price usdUSD={p.priceUSD} compact />
                      {out ? (
                        <button className="btn btn-outline btn-sm" disabled>
                          Agotado
                        </button>
                      ) : (
                        <button
                          className="btn btn-accent btn-sm"
                          onClick={() => add(p.id, 1)}
                          title={`Add 1 package (200 stems) — ${formatUSD(p.priceUSD)}`}
                        >
                          + Add package
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      </section>

      {/* ---------------- Modal detalle ---------------- */}
      <Modal open={detail !== null} onClose={() => setDetail(null)}>
        {detail && (
          <>
            <ModalHead
              title={detail.name}
              sub={`${detail.type === "spray" ? "Spray / mini carnation" : "Standard carnation"} · ${detail.variety} · ${detail.colorFamily}`}
              onClose={() => setDetail(null)}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 250px", gap: 22 }}>
              <div>
                <div className="gallery-main">
                  <GalleryImg
                    src={detail.galleryUrls[galleryIdx] ?? detail.galleryUrls[0]}
                    alt={`${detail.name} foto ${galleryIdx + 1}`}
                  />
                </div>
                <div className="gallery-thumbs">
                  {detail.galleryUrls.map((u, i) => (
                    <img
                      key={`${u}-${i}`}
                      src={u}
                      alt={`${detail.name} miniatura ${i + 1}`}
                      className={i === galleryIdx ? "selected" : ""}
                      onClick={() => setGalleryIdx(i)}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMG;
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <ul className="specs">
                  <li><span>Presentation</span><b>{detail.presentation}</b></li>
                  <li><span>Stems per package</span><b>{detail.packageSize}</b></li>
                  <li><span>Stem grade</span><b>{detail.grade}</b></li>
                  <li><span>Available</span><b>{detail.packagesAvailable} packages</b></li>
                </ul>
                <p style={{ fontSize: "0.9rem", color: "var(--ink-soft)" }}>{detail.description}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "16px 0" }}>
                  <Price usdUSD={detail.priceUSD} />
                  <div className="stepper">
                    <button
                      onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                      disabled={detailQty <= 1}
                      aria-label="Quitar un paquete"
                    >−</button>
                    <span className="val">
                      {detailQty}
                      <small>PKG</small>
                    </span>
                    <button
                      onClick={() =>
                        setDetailQty((q) => Math.min(detail.packagesAvailable, q + 1))
                      }
                      disabled={detailQty >= detail.packagesAvailable}
                      aria-label="Agregar un paquete"
                    >+</button>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  disabled={detail.packagesAvailable <= 0}
                  onClick={() => {
                    add(detail.id, detailQty);
                    setDetail(null);
                  }}
                >
                  Add {detailQty} package{detailQty > 1 ? "s" : ""} to cart
                </button>
                {qtyInCart(detail.id) > 0 && (
                  <p style={{ fontSize: "0.8rem", color: "var(--ink-faint)", textAlign: "center", marginTop: 8 }}>
                    {qtyInCart(detail.id)} package(s) already in cart
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
