import { dictLang, getLangCookie } from "@/lib/i18n";
import { LangProvider } from "../providers";
import { SiteHeader } from "../SiteHeader";
import { SiteFooter } from "../SiteFooter";

// Wrap the whole PUBLIC subtree with the active language.
// The dictionary is built by scripts/i18n.py (en/es); the server
// reads the cookie and injects the active dictionary here for
// EVERY page, so the entire site renders in one language only.
export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLangCookie();
  const dict = dictLang(lang);
  return (
    <LangProvider lang={lang} dict={dict}>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </LangProvider>
  );
}
