"use client";
// ============================================================
// CARRITO (persistente en localStorage, por paquetes de 200).
// ============================================================
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatUSD } from "@/lib/currency";
import { Price } from "../../Price";
import { useCart, useCurrency } from "../../providers";

interface CartLine extends Product {
  packages: number;
  imgSrc: string;
}

export default function CartPage() {
  const { items, setPackages: setItemPackages, remove, hydrated } = useCart();
  const { rate } = useCurrency();
  const [lines, setLines] = useState<CartLine[] | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (items.length === 0) {
      setLines([]);
      return;
    }
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        const prods: Product[] = d.products ?? [];
        const merged: CartLine[] = items
          .map((i) => {
            const p = prods.find((x) => x.id === i.productId);
            if (!p) return null;
            // Rebalancear: limitar al stock vigente
            const pkgs = Math.min(i.packages, Math.max(p.packagesAvailable, 1));
            return { ...p, packages: pkgs, imgSrc: p.galleryUrls[0] };
          })
          .filter((x): x is CartLine => x !== null);
        setLines(merged);
      })
      .catch(() => setLines([]));
  }, [hydrated, items]);

  function bump(line: CartLine, newPackages: number) {
    // La unidad de venta es el PAQUETE (200 tallos): enteros ≥ 1 y
    // máximo la disponibilidad vigente.
    const n = Math.max(1, Math.round(newPackages));
    setItemPackages(line.id, Math.min(n, line.packagesAvailable));
  }

  const subtotalUSD = (lines ?? []).reduce(
    (a, l) => a + l.priceUSD * l.packages,
    0
  );
  const totalPackages = (lines ?? []).reduce((a, l) => a + l.packages, 0);
  const totalStems = totalPackages * 200; // tamaño de paquete estándar

  const syncing = lines === null && hydrated && items.length > 0;

  return (
    <div className="container page-pad">
      <div className="page-title-row">
        <h1 style={{ margin: 0 }}>Shopping cart</h1>
        {lines !== null && lines.length > 0 && (
          <span className="muted">
            {totalPackages} package(s) · {totalStems} stems
          </span>
        )}
      </div>

      {(!hydrated || syncing) && <p className="muted">Loading cart…</p>}

      {hydrated && lines !== null && lines.length === 0 && (
        <div className="empty-state">
          <div className="big">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add carnation packages (200 stems each) from the catalog.</p>
          <Link href="/catalog" className="btn btn-primary">Browse catalog →</Link>
        </div>
      )}

      {hydrated && lines !== null && lines.length > 0 && (
        <div className="cart-layout">
          <div className="cart-card">
            {lines.map((l) => (
              <div className="cart-line" key={l.id}>
                <img src={l.imgSrc} alt={l.name} />
                <div>
                  <div className="name">{l.name}</div>
                  <div className="meta">
                    {l.type === "spray" ? "Spray / mini" : "Standard"} · {l.colorFamily} · {l.grade}
                  </div>
                  <div className="meta">
                    <span className="badge badge-package">Paquete de {l.packageSize} tallos</span>
                  </div>
                  <button className="remove-btn" onClick={() => remove(l.id)}>
                    Remove
                  </button>
                </div>
                <div />
                <div className="qty-col">
                  <div className="stepper">
                    <button
                      onClick={() => bump(l, l.packages - 1)}
                      disabled={l.packages <= 1}
                      aria-label="Quitar un paquete"
                    >−</button>
                    <span className="val">{l.packages}<small>PKG</small></span>
                    <button
                      onClick={() => bump(l, l.packages + 1)}
                      disabled={l.packages >= l.packagesAvailable}
                      aria-label="Agregar un paquete"
                    >+</button>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
                    {formatUSD(l.priceUSD)} / pkg · max {l.packagesAvailable}
                  </span>
                </div>
                <div className="line-total">
                  <Price usdUSD={l.priceUSD * l.packages} />
                  <div style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
                    {l.packages} × {formatUSD(l.priceUSD)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="summary-card">
            <h3>Order summary</h3>
            <div className="summary-row">
              <span>Packages</span>
              <strong>{totalPackages}</strong>
            </div>
            <div className="summary-row">
              <span>Total stems</span>
              <strong>{totalStems}</strong>
            </div>
            <div className="summary-row">
              <span>Subtotal</span>
              <Price usdUSD={subtotalUSD} compact />
            </div>
            <div className="summary-row">
              <span>Air freight (demo)</span>
              <span>Included</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <Price usdUSD={subtotalUSD} compact />
            </div>
            <Link
              href="/checkout"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 16 }}
            >
              Continue to buyer info →
            </Link>
            <Link
              href="/catalog"
              className="btn btn-outline"
              style={{ width: "100%", marginTop: 8 }}
            >
              ← Keep browsing
            </Link>
            <div className="note">
              Los claveles se venden <strong>únicamente en paquetes cerrados de 200
              tallos</strong>: la cantidad del carrito avanza en múltiplos de
              paquetes. La conversión a COP usa la tasa demo de{" "}
              {rate.toLocaleString("es-CO")} COP/USD.
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
