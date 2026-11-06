"use client";
// ============================================================
// PÁGINA DE PAGO SIMULADO (MockPay, tipo Stripe Checkout).
// ⚠️ SIMULACIÓN: no se validan tarjetas reales ni se hacen
// cargos. Solo funcionan los números de prueba documentados.
// ============================================================
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface IntentInfo {
  pid: string;
  status: string;
  amountUSD: number;
  totalCOP: number;
  packages: number;
  lines: number;
  buyerName: string;
}

export default function PayPage() {
  const params = useParams<{ pid: string }>();
  const router = useRouter();
  const pid = params.pid;

  const [info, setInfo] = useState<IntentInfo | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [zip, setZip] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/payments/${pid}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setInfo(d);
        setName(d.buyerName ?? "");
      })
      .catch(() => setLoadError(true));
  }, [pid]);

  function parseExp(): { expMonth: string; expYear: string } | null {
    const m = exp.trim().match(/^(\d{1,2})\s*\/?\s*(\d{2,4})$/);
    if (!m) return null;
    const mm = m[1].padStart(2, "0");
    let yyyy = m[2];
    if (yyyy.length === 2) yyyy = `20${yyyy}`;
    return { expMonth: mm, expYear: yyyy };
  }

  function localValidate(): boolean {
    const digits = card.replace(/\D/g, "");
    if (digits.length < 15 || digits.length > 16) {
      setError("Card number must have 15–16 digits (use the test numbers).");
      return false;
    }
    const e = parseExp();
    if (!e) { setError("Expiry must be MM/AA or MM/AAAA."); return false; }
    if (!/^\d{3,4}$/.test(cvc.trim())) { setError("CVC must be 3–4 digits."); return false; }
    if (name.trim().length < 3) { setError("Cardholder name required."); return false; }
    if (!/^[A-Za-z0-9\- ]{3,10}$/.test(zip.trim())) { setError("Billing ZIP invalid."); return false; }
    setError(null);
    return true;
  }

  async function pay(ev: React.FormEvent) {
    ev.preventDefault();
    if (!localValidate()) return;
    setBusy(true);
    setError(null);
    try {
      const e = parseExp();
      const res = await fetch(`/api/payments/authorize?pid=${encodeURIComponent(pid)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardNumber: card.replace(/\D/g, ""),
          cvc: cvc.trim(),
          expMonth: e!.expMonth,
          expYear: e!.expYear,
          name: name.trim(),
          zip: zip.trim(),
        }),
      });
      const data = await res.json();
      if (data.status === "succeeded") {
        router.push(data.redirectUrl);
        return;
      }
      setError(data.message ?? "Payment could not be processed.");
    } catch {
      setError("Network error while contacting the (mock) payment gateway.");
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <div className="container page-pad">
        <div className="pay-wrap">
          <div className="form-error">Payment session not found. Please restart the checkout.</div>
          <Link href="/cart" className="btn btn-outline">← Back to cart</Link>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="container page-pad">
        <div className="pay-wrap"><p>Loading payment sheet…</p></div>
      </div>
    );
  }

  return (
    <div className="container page-pad">
      <div className="pay-wrap">
        <div className="mockpay-sheet">
          <div className="mockpay-head">
            <div className="brandline">
              <span className="mp">⚡ MockPay</span>
              <span className="pill">SIMULACIÓN · NO REAL</span>
            </div>
            <div className="amount">${info.amountUSD.toFixed(2)} USD</div>
            <div className="cop">
              ≈ {new Intl.NumberFormat("es-CO").format(info.totalCOP)} COP ·{" "}
              {info.packages} paquete(s) · {info.lines} variedad(es)
            </div>
          </div>
          <div className="mockpay-body">
            <div className="testcards">
              <strong>Tarjetas de prueba (demo)</strong> — solo estos números
              procesan; ninguno toca una red de pagos real:
              <br />
              <code>4242 4242 4242 4242</code> aprueba ·{" "}
              <code>5555 5555 5555 4444</code> aprueba ·{" "}
              <code>3782 822463 10005</code> aprueba
              <br />
              <code>4000 0000 0000 0002</code> declinada ·{" "}
              <code>4000 0000 0000 9995</code> sin fondos ·{" "}
              <code>4000 0000 0000 0069</code> expirada
            </div>

            {error && <div className="pay-error">✖ {error}</div>}

            <form onSubmit={pay} noValidate>
              <div className="field">
                <label>Card number</label>
                <input
                  value={card}
                  onChange={(e) => setCard(e.target.value)}
                  placeholder="4242 4242 4242 4242"
                  inputMode="numeric"
                  autoComplete="cc-number"
                />
              </div>
              <div className="field">
                <label>Cardholder name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="JANE DOE" autoComplete="cc-name" />
              </div>
              <div className="row-exp">
                <div className="field">
                  <label>Expiry (MM/AA)</label>
                  <input value={exp} onChange={(e) => setExp(e.target.value)} placeholder="12/28" autoComplete="cc-exp" />
                </div>
                <div className="field">
                  <label>CVC</label>
                  <input value={cvc} onChange={(e) => setCvc(e.target.value)} placeholder="123" inputMode="numeric" autoComplete="cc-csc" />
                </div>
                <div className="field">
                  <label>Billing ZIP</label>
                  <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="33101" inputMode="numeric" />
                </div>
              </div>
              <button className="btn btn-accent btn-lg" style={{ width: "100%" }} disabled={busy}>
                {busy ? "Processing…" : "Pay now (simulated)"}
              </button>
            </form>

            <p style={{ fontSize: "0.78rem", color: "var(--ink-faint)", textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>
              Este checkout es una simulación del flujo de Stripe. La capa
              está diseñada para reemplazarse por Stripe real (ver
              docs/STRIPE-INTEGRATION.md). Ningún dato de tarjeta se envía a
              servicios externos.
            </p>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Link href="/cart" className="btn btn-outline btn-sm">← Cancel</Link>
              <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)", alignSelf: "center" }}>
                session {pid.slice(0, 14)}…
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
