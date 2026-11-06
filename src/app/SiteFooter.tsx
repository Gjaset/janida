import Link from "next/link";

// Footer del sitio público. Datos de contacto demo (configurables
// por variables de entorno NEXT_PUBLIC_*).
const CONTACTO_DEMO = {
  email: "ventas@janida.co",
  phoneWholesale: "+57 320 555 0199",
  phoneUS: "+1 (305) 555-0199",
  address: "Savanna de Bogotá, Cundinamarca · Colombia",
};

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container inner">
        <div>
          <div className="brandline">JANIDA SAS ✿</div>
          <p style={{ fontSize: "0.9rem", color: "#aebfb3", maxWidth: "38ch" }}>
            Exportadora de claveles desde la Sabana de Bogotá hacia el
            mercado mayorista de Estados Unidos. Frescura, trazabilidad y
            cumplimiento en cada envío aéreo.
          </p>
        </div>
        <div>
          <h4>Site</h4>
          <p style={{ lineHeight: 2, margin: 0, fontSize: "0.92rem" }}>
            <Link href="/">Home</Link>
            <br />
            <Link href="/catalog">Catalog</Link>
            <br />
            <Link href="/cart">Cart</Link>
            <br />
            <Link href="/admin/login">Staff · Admin panel</Link>
          </p>
        </div>
        <div>
          <h4>Contact (demo data)</h4>
          <p style={{ lineHeight: 1.9, margin: 0, fontSize: "0.92rem" }}>
            {CONTACTO_DEMO.address}
            <br />
            {CONTACTO_DEMO.email}
            <br />
            {CONTACTO_DEMO.phoneWholesale} · Colombia
            <br />
            {CONTACTO_DEMO.phoneUS} · U.S. office
          </p>
        </div>
      </div>
      <div className="container legal">
        <span>
          © {new Date().getFullYear()} JANIDA SAS · NIT
          (demostración) 900.000.000-0
        </span>
        <span>
          Sitio demostrativo — datos de ejemplo y pagos simulados con MockPay.
        </span>
      </div>
    </footer>
  );
}
