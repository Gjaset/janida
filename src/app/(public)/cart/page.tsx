import { getLangCookie, t } from "@/lib/i18n";
import { listProducts } from "@/lib/store";
import { CartView, type CartProduct } from "./CartView";

export default async function CartPage() {
  const lang = await getLangCookie();
  const products = await listProducts();

  const catalog: CartProduct[] = products.map((p) => ({
    id: p.id,
    name: lang === "es" ? p.name_es : p.name_en,
    grade: p.grade,
    image: p.galleryUrls[0] ?? "/demo-flowers/placeholder.svg",
    stemsPerBox: p.stemsPerBox,
    minOrderBoxes: p.minOrderBoxes,
    pricePerBoxUSD: p.pricePerBoxUSD,
    stockBoxes: p.stockBoxes,
  }));

  return (
    <div className="container page-pad">
      <div className="page-title-row">
        <h1>{t(lang, "cart.title")}</h1>
        <span className="muted">{t(lang, "unit.box_of_stems", { n: 200 })}</span>
      </div>
      <CartView catalog={catalog} />
    </div>
  );
}
