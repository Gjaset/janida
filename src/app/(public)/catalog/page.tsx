import type { Metadata } from "next";
import { getLangCookie, t } from "@/lib/i18n";
import { listProducts } from "@/lib/store";
import { CatalogClient, type PublicProduct } from "./CatalogClient";

export const metadata: Metadata = { title: "Catalog" };

// ------------------------------------------------------------------
// Catálogo público: venta ÚNICAMENTE por cajas enteras selladas de
// 200 tallos. Los filtros (variedad, color, rango de precio por
// caja, disponibilidad) y la búsqueda corren en el cliente.
// ------------------------------------------------------------------
export default async function CatalogPage() {
  const lang = await getLangCookie();
  const products = await listProducts();

  const public_products: PublicProduct[] = products.map((p) => ({
    id: p.id,
    variety: p.variety,
    name: lang === "es" ? p.name_es : p.name_en,
    desc: lang === "es" ? p.desc_es : p.desc_en,
    type: p.type,
    colorFamily: p.colorFamily,
    stemsPerBox: p.stemsPerBox,
    minOrderBoxes: p.minOrderBoxes,
    pricePerBoxUSD: p.pricePerBoxUSD,
    stockBoxes: p.stockBoxes,
    grade: p.grade,
    image: p.galleryUrls[0] ?? "/demo-flowers/placeholder.svg",
  }));

  const intro = (
    <p className="lead" style={{ color: "inherit" }}>
      {t(lang, "catalog.lead")}
    </p>
  );

  return (
    <div className="container page-pad">
      <div className="section-head" style={{ maxWidth: "unset" }}>
        <h1 style={{ marginBottom: 8 }}>{t(lang, "catalog.title")}</h1>
        {intro}
      </div>
      <CatalogClient products={public_products} />
    </div>
  );
}
