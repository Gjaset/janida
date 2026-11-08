import Link from "next/link";
import { getLangCookie, t } from "@/lib/i18n";

// Footer — datos de contacto de Janida (marcadores de ejemplo
// documentados en el README). Textos desde el diccionario i18n.
export async function SiteFooter() {
  const lang = await getLangCookie();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container inner">
        <div>
          <div className="brandline">{t(lang, "common.brand")} ✿</div>
          <p style={{ fontSize: "0.9rem", color: "#aebfb3", maxWidth: "38ch" }}>
            {t(lang, "footer.about")}
          </p>
        </div>
        <div>
          <h4>{t(lang, "footer.links_t")}</h4>
          <p style={{ lineHeight: 2, margin: 0, fontSize: "0.92rem" }}>
            <Link href="/">{t(lang, "nav.home")}</Link>
            <br />
            <Link href="/catalog">{t(lang, "nav.catalog")}</Link>
            <br />
            <Link href="/track">{t(lang, "nav.track")}</Link>
            <br />
            <Link href="/cart">{t(lang, "nav.cart")}</Link>
            <br />
            <Link href="/admin/login">{t(lang, "footer.admin_link")}</Link>
          </p>
        </div>
        <div>
          <h4>{t(lang, "footer.contact_t")}</h4>
          <p style={{ lineHeight: 1.9, margin: 0, fontSize: "0.92rem" }}>
            {t(lang, "footer.contact_addr")}
            <br />
            {t(lang, "footer.contact_email")}
            <br />
            {t(lang, "footer.contact_phone_us")}
          </p>
        </div>
      </div>
      <div className="container legal">
        <span>
          © {year} {t(lang, "common.brand")} · {t(lang, "footer.legal1")}
        </span>
        <span>{t(lang, "footer.legal2")}</span>
      </div>
    </footer>
  );
}
