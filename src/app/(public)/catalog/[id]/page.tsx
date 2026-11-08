import Link from "next/link";
import { notFound } from "next/navigation";
import { getLangCookie, t } from "@/lib/i18n";
import { listProducts } from "@/lib/store";
import { DetailClient } from "./DetailClient";

// ------------------------------------------------------------------
// Detalle de producto. Tabla "Cómo se vende": unidad de venta (caja
// entera sellada), tallos por caja, precio por caja, precio por
// tallo (3 decimales) y pedido mínimo.
// ------------------------------------------------------------------
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lang = await getLangCookie();
  const products = await listProducts();
  const p = products.find((x) => x.id === id);
  if (!p) notFound();

  return (
    <div className="container page-pad">
      <Link href="/catalog" className="btn btn-outline btn-sm">
        {t(lang, "detail.back")}
      </Link>
      <DetailClient
        product={{
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
          gallery: p.galleryUrls,
        }}
      />
    </div>
  );
}
