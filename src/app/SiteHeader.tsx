"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./providers";

export function SiteHeader() {
  const { totalPackages, hydrated } = useCart();
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/catalog", label: "Catalog" },
    { href: "/#about", label: "About us" },
    { href: "/#contact", label: "Contact" },
  ];

  return (
    <header className="site-header">
      <div className="container inner">
        <Link href="/" className="logo">
          <span className="flower">✿</span>
          <span>
            JANIDA SAS
            <small>Colombian Carnations · Wholesale Export</small>
          </span>
        </Link>
        <nav className="main-nav">
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
            <span>🛒 Cart</span>
            <span className="count" suppressHydrationWarning>
              {hydrated ? totalPackages : "·"}
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
