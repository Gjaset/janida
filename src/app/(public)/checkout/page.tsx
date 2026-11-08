import { getLangCookie, t } from "@/lib/i18n";
import { listProducts, getSettings } from "@/lib/store";
import { CheckoutForm, type CheckoutProduct } from "./CheckoutForm";

export default async function CheckoutPage() {
  const lang = await getLangCookie();
  const [products, settings] = await Promise.all([listProducts(), getSettings()]);

  const catalog: CheckoutProduct[] = products.map((p) => ({
    id: p.id,
    name: lang === "es" ? p.name_es : p.name_en,
    image: p.galleryUrls[0] ?? "/demo-flowers/placeholder.svg",
    stemsPerBox: p.stemsPerBox,
    minOrderBoxes: p.minOrderBoxes,
    pricePerBoxUSD: p.pricePerBoxUSD,
    stockBoxes: p.stockBoxes,
  }));

  return (
    <div className="container page-pad">
      <div className="page-title-row">
        <h1>{t(lang, "checkout.title")}</h1>
      </div>
      <p className="lead" style={{ color: "var(--ink-soft)", maxWidth: "68ch", marginBottom: 24 }}>
        {t(lang, "checkout.lead")}
      </p>
      <CheckoutForm catalog={catalog} rate={settings.exchangeRateCOP} />
    </div>
  );
}
