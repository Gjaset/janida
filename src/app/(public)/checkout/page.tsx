"use client";
// ============================================================
// CHECKOUT — datos del comprador mayorista (envío EE. UU.) y
// creación de la sesión de pago simulada (MockPay).
// ============================================================
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { Price } from "../../Price";
import { useCart, useCurrency } from "../../providers";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
  "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia",
  "Washington", "West Virginia", "Wisconsin", "Wyoming",
];

interface FormState {
  fullName: string; company: string; country: string;
  addressLine1: string; addressLine2: string; city: string;
  state: string; postalCode: string; email: string; phone: string; notes: string;
}

const EMPTY: FormState = {
  fullName: "", company: "", country: "Estados Unidos",
  addressLine1: "", addressLine2: "", city: "", state: "",
  postalCode: "", email: "", phone: "", notes: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, hydrated, totalPackages, clear } = useCart();
  const { rate } = useCurrency();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [lines, setLines] = useState<Array<{ id: string; name: string; packages: number; priceUSD: number }>>([]);
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Snapshot visible del carrito (para resumen)
  useEffect(() => {
    if (!hydrated) return;
    if (items.length === 0) { setLines([]); return; }
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        const prods: Product[] = d.products ?? [];
        setLines(
          items
            .map((i) => {
              const p = prods.find((x) => x.id === i.productId);
              return p ? { id: p.id, name: p.name, packages: i.packages, priceUSD: p.priceUSD } : null;
            })
            .filter((x): x is NonNullable<typeof x> => x !== null)
        );
      })
      .catch(() => setLines([]));
  }, [hydrated, items]);

  const subtotalUSD = useMemo(
    () => lines.reduce((a, l) => a + l.packages * l.priceUSD, 0),
    [lines]
  );

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (form.fullName.trim().length < 3) e.fullName = "Nombre completo requerido";
    if (form.company.trim().length < 2) e.company = "Empresa requerida";
    if (form.country.trim().length < 2) e.country = "País requerido";
    if (form.addressLine1.trim().length < 5) e.addressLine1 = "Dirección requerida";
    if (form.city.trim().length < 2) e.city = "Ciudad requerida";
    if (form.state.trim().length < 2) e.state = "Estado requerido";
    if (!/^[A-Za-z0-9\- ]{3,10}$/.test(form.postalCode.trim())) e.postalCode = "ZIP inválido (5 dígitos para EE. UU.)";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Correo inválido";
    if (!/^[+\d()\-.\s]{7,20}$/.test(form.phone.trim())) e.phone = "Teléfono inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setApiError(null);
    if (lines.length === 0) { setApiError("Tu carrito está vacío."); return; }
    if (!validate()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer: {
            ...form,
            addressLine2: form.addressLine2.trim() || undefined,
            notes: form.notes.trim() || undefined,
          },
          items: lines.map((l) => ({ productId: l.id, packages: l.packages })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data?.error ?? "No se pudo iniciar el pago. Revisa los datos.");
        setBusy(false);
        return;
      }
      clear(); // el carrito queda consumido: el snapshot vive en la sesión de pago
      router.push(`/pay/${data.pid}`);
    } catch {
      setApiError("Error de red al iniciar el pago. Intenta de nuevo.");
      setBusy(false);
    }
  }

  if (hydrated && lines.length === 0 && !busy) {
    return (
      <div className="container page-pad">
        <div className="empty-state">
          <div className="big">🛒</div>
          <h2>Nothing to check out</h2>
          <p>Your cart is empty. Add carnation packages first.</p>
          <Link href="/catalog" className="btn btn-primary">Browse catalog →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-pad">
      <div className="page-title-row">
        <h1 style={{ margin: 0 }}>Buyer & shipping info</h1>
        <span className="muted">Wholesale order · U.S. delivery</span>
      </div>

      <div className="checkout-layout">
        <form className="panel" onSubmit={submit} noValidate>
          {apiError && <div className="form-error">{apiError}</div>}
          <h3 style={{ marginBottom: 14 }}>Buyer information</h3>
          <div className="form-grid">
            <div className="field">
              <label>Full name <span className="req">*</span></label>
              <input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Jane Doe" />
              {errors.fullName && <div className="err">{errors.fullName}</div>}
            </div>
            <div className="field">
              <label>Company / distributor <span className="req">*</span></label>
              <input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="U.S. Flowers Wholesale Inc." />
              {errors.company && <div className="err">{errors.company}</div>}
            </div>
            <div className="field">
              <label>Country <span className="req">*</span></label>
              <select value={form.country} onChange={(e) => set("country", e.target.value)}>
                <option>Estados Unidos</option>
                <option>Colombia</option>
                <option>Otro</option>
              </select>
              {errors.country && <div className="err">{errors.country}</div>}
            </div>
            <div className="field">
              <label>Phone <span className="req">*</span></label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 305 555 0100" />
              {errors.phone && <div className="err">{errors.phone}</div>}
            </div>
            <div className="field span2">
              <label>Shipping address (U.S.) <span className="req">*</span></label>
              <input value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} placeholder="1200 Flower District Ave, Suite 5" />
              {errors.addressLine1 && <div className="err">{errors.addressLine1}</div>}
            </div>
            <div className="field span2">
              <input value={form.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} placeholder="Apartment, suite, dock (opcional)" />
            </div>
            <div className="field">
              <label>City <span className="req">*</span></label>
              <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Miami" />
              {errors.city && <div className="err">{errors.city}</div>}
            </div>
            <div className="field">
              <label>State <span className="req">*</span></label>
              <select value={form.state} onChange={(e) => set("state", e.target.value)}>
                <option value="">Select state…</option>
                {US_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
              {errors.state && <div className="err">{errors.state}</div>}
            </div>
            <div className="field">
              <label>Postal code (ZIP) <span className="req">*</span></label>
              <input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} placeholder="33101" inputMode="numeric" />
              {errors.postalCode && <div className="err">{errors.postalCode}</div>}
            </div>
            <div className="field">
              <label>Email <span className="req">*</span></label>
              <input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="buyer@company.com" type="email" />
              {errors.email && <div className="err">{errors.email}</div>}
            </div>
            <div className="field span2">
              <label>Order notes (opcional)</label>
              <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Ventana de entrega, consolidado con otras fincas, contactos en el marketplace…" />
            </div>
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={busy}>
            {busy ? "Creating secure payment session…" : `Continue to payment (simulated) →`}
          </button>
          <p className="opt" style={{ fontSize: "0.78rem", color: "var(--ink-faint)", textAlign: "center", marginTop: 10 }}>
            Demo flow: after this step you will see the MockPay simulated payment sheet. No real charges are made.
          </p>
        </form>

        <aside className="summary-card">
          <h3>Your order</h3>
          {lines.map((l) => (
            <div className="summary-row" key={l.id}>
              <span>{l.name} × {l.packages} pkg</span>
              <strong>{l.packages * l.priceUSD <= 0 ? "" : "$"}{(l.packages * l.priceUSD).toFixed(2)} USD</strong>
            </div>
          ))}
          <div className="summary-row">
            <span>Packages</span>
            <strong>{totalPackages}</strong>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <Price usdUSD={subtotalUSD} compact />
          </div>
          <div className="note">
            Las cantidades siempre son paquetes de 200 tallos. El total en
            COP se recalcula con la tasa demo de{" "}
            {new Intl.NumberFormat("es-CO").format(rate)} COP/USD.
          </div>
        </aside>
      </div>
    </div>
  );
}
