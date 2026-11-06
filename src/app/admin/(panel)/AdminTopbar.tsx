"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/pedidos", label: "Pedidos" },
];

export function AdminTopbar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="admin-topbar">
      <div className="brand">✿ JANIDA SAS · Panel</div>
      <nav className="tabs">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={
              t.href === "/admin" ? (pathname === "/admin" ? "active" : "") : pathname.startsWith(t.href) ? "active" : ""
            }
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="spacer">
        <span title={email}>{email}</span>
        <button className="logout" onClick={logout}>Cerrar sesión</button>
      </div>
    </header>
  );
}
