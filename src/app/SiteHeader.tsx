"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart, useLang, useRate } from "./providers";
import { format_money, usd_to_cop } from "@/lib/money";
import type { Lang } from "@/lib/i18n";

// Site header — nav + cart + language toggle. All visible text
// comes from the injected dictionary (scripts/i18n.py); the
// toggle hits /api/lang/[to] which sets the cookie server-side,
// so the WHOLE site re-renders in the other language.
//
// Móvil (≤ 640 px): el nav se convierte en menú hamburguesa
// (botón .menu-btn); el panel desplegable se controla con el
// estado `menuOpen` y se cierra al navegar o con Escape.
export function SiteHeader() {
  const { totalBoxes, hydrated } = useCart();
  const { t, lang } = useLang();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Cierra el panel al cambiar de ruta (enlace tocado).
  useEffect(() => setMenuOpen(false), [pathname]);

  // Escape cierra el panel.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const target: Lang = lang === "en" ? "es" : "en";
  const navItems = [
    { href: "/", label: t("nav.home") },
    { href: "/catalog", label: t("nav.catalog") },
    { href: "/track", label: t("nav.track") },
    { href: "/#contact", label: t("nav.contact") },
  ];

  return (
    <header className="site-header">
      <div className="container inner">
        <Link href="/" className="logo">
          <span className="flower">✿</span>
          <span>
            {t("common.brand")}
            <small>{t("common.tagline")}</small>
          </span>
        </Link>

        <button
          type="button"
          className={`menu-btn${menuOpen ? " open" : ""}`}
          aria-label={t("nav.menu.aria")}
          aria-expanded={menuOpen}
          aria-controls="main-nav-panel"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>

        <nav
          id="main-nav-panel"
          className={`main-nav${menuOpen ? " open" : ""}`}
          aria-label={t("nav.menu.aria")}
          onClick={(e) => {
            // El toggle de idioma es un <a>; los enlaces navegan — cerrar el panel.
            if ((e.target as HTMLElement).closest("a")) setMenuOpen(false);
          }}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "active" : undefined}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/cart" className="cart-link">
            <span>🛒 {t("nav.cart")}</span>
            <span className="count" suppressHydrationWarning>
              {hydrated ? totalBoxes : "·"}
            </span>
          </Link>
          <a
            href={`/api/lang/${target}?next=${encodeURIComponent(pathname + "")}`}
            className="lang-toggle"
            aria-label={t("common.lang.aria")}
            hrefLang={target}
          >
            {t("common.lang.toggle_target")}
          </a>
        </nav>
      </div>
    </header>
  );
}
