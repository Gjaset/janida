"use client";
// ============================================================
// CONFIRMACIÓN PÚBLICA DEL PEDIDO (tras el pago simulado).
// ============================================================
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { OrderStatus } from "@/lib/types";

interface OrderSummary {
  id: string;
  status: OrderStatus;
  totalUSD: number;
  totalCOP: number;
  exchangeRate: number;
  items: Array<{
    productName: string;
    variety: string;
    packages: number;
    packageSize: number;
    unitPriceUSD: number;
    subtotalUSD: number;
  }>;
  buyer: { fullName: string; company: string; city: string; state: string; country: string };
  paymentRef: string;
  paymentBrand: string;
  createdAt: string;
}

export default function OrderConfirmPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setOrder(d))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="container page-pad">
        <div className="empty-state">
          <div className="big">🔍</div>
          <h2>Order not found</h2>
          <p>The order {id} does not exist in this demo store.</p>
          <Link href="/catalog" className="btn btn-primary">Back to catalog</Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return <div className="container page-pad"><p>Loading order…</p></div>;
  }

  return (
    <div className="container page-pad order-confirm">
      <div className="ok-banner">
        <span className="icon">✅</span>
        <div>
          <strong>Payment approved (simulated)</strong> — order {order.id} was
          created. Your blooms are being scheduled for harvest and cold-chain
          export. Our team will move the order through{" "}
          <em>confirmed → in transit → delivered</em>.
        </div>
      </div>

      <h1>Thank you, {order.buyer.fullName.split(" ")[0]}!</h1>
      <p style={{ color: "var(--ink-soft)", marginBottom: 26 }}>
        Reservation {order.paymentRef} · paid with {order.paymentBrand} (MockPay simulation).
        We sent a confirmation to your email (in the real integration).
      </p>

      <div className="checkout-layout">
        <div className="panel">
          <h3>Order {order.id}</h3>
          <table className="data-table" style={{ boxShadow: "none" }}>
            <thead>
              <tr>
                <th>Variety</th>
                <th>Packages</th>
                <th>Stems</th>
                <th style={{ textAlign: "right" }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it) => (
                <tr key={it.productName}>
                  <td className="strong">
                    {it.productName}
                    <div style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>{it.variety}</div>
                  </td>
                  <td>{it.packages}</td>
                  <td>{it.packages * it.packageSize}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    ${it.subtotalUSD.toFixed(2)} USD
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 18 }}>
            <span className="status-chip" data-status={order.status}>
              ● {order.status.replace("_", " ")}
            </span>
          </div>
        </div>

        <aside className="summary-card">
          <h3>Summary</h3>
          <div className="summary-row">
            <span>Ship to</span>
            <strong style={{ textAlign: "right" }}>
              {order.buyer.company} · {order.buyer.city}, {order.buyer.state}, {order.buyer.country}
            </strong>
          </div>
          <div className="summary-row">
            <span>Ordered at</span>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>
              ${order.totalUSD.toFixed(2)} USD
              <div style={{ fontSize: "0.75rem", color: "var(--ink-faint)", fontWeight: 500 }}>
                ≈ {new Intl.NumberFormat("es-CO").format(order.totalCOP)} COP
              </div>
            </span>
          </div>
          <div className="note">
            Pago SIMULADO (documento de demostración). Este flujo deja lista la
            integración con Stripe real; los estados del pedido se gestionan
            desde el panel admin de JANIDA.
          </div>
          <Link href="/catalog" className="btn btn-primary" style={{ width: "100%", marginTop: 14 }}>
            Keep browsing the catalog
          </Link>
        </aside>
      </div>
    </div>
  );
}
