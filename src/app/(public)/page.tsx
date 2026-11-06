import Link from "next/link";
import { ContactForm } from "./ContactForm";

export default function HomePage() {
  return (
    <>
      {/* ============ HERO / PRESENTACIÓN ============ */}
      <section className="hero">
        <div className="container">
          <p className="kicker">Exportación floral · Colombia → Estados Unidos</p>
          <h1>
            Claveles colombianos, con frescura de finca y cumplimiento
            de exportación.
          </h1>
          <p className="lead">
            <strong>JANIDA SAS</strong> cultiva, selecciona y exporta claveles
            (estándar y mini spray) de la Sabana de Bogotá hacia
            mayoristas y distribuidores de flores de Estados Unidos. Vendemos en paquetes cerrados de{" "}
            <strong>200 tallos</strong>, con cadena de frío continua y despacho
            aéreo desde Bogotá (BOG) hacia Miami y Dallas–Fort Worth.
          </p>
          <div className="hero-actions">
            <Link href="/catalog" className="btn btn-primary btn-lg">
              Explorar catálogo de claveles →
            </Link>
            <Link href="#contact" className="btn btn-outline btn-lg">
              Hablar con ventas
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <b>+24 años</b>
              <span>de tradición floral familiar</span>
            </div>
            <div className="stat">
              <b>14 ha</b>
              <span>de cultivo protegido (demo)</span>
            </div>
            <div className="stat">
              <b>97 %</b>
              <span>cumplimiento de despachos (demo)</span>
            </div>
            <div className="stat">
              <b>USD 17–20</b>
              <span>precio por paquete de 200 tallos</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PROPUESTA DE VALOR ============ */}
      <section className="block">
        <div className="container">
          <div className="section-head">
            <p className="kicker">Propuesta de valor</p>
            <h2>Por qué mayoristas de EE. UU. compran a JANIDA</h2>
            <p>
              Operamos como extensión de la cadena de flores de nuestros
              clientes: producto consistente, comunicación directa y
              logística en frío sin atajos.
            </p>
          </div>
          <div className="grid-cards">
            <div className="value-card">
              <div className="icon">🌿</div>
              <h3>Frescura de finca</h3>
              <p>
                Cosecha bajo pedido y poscosecha especializada: hidratación,
                apertura controlada y empaque en caja hortícola, con cadena
                de frío continua de 2–4 °C hacia Miami y Atlanta.
              </p>
            </div>
            <div className="value-card">
              <div className="icon">🔗</div>
              <h3>Trazabilidad total</h3>
              <p>
                Ficha de trazabilidad por lote: variedad, finca, fecha de
                corte, grado del tallo y temperatura durante el
                transporte — documentada orden por orden.
              </p>
            </div>
            <div className="value-card">
              <div className="icon">✈️</div>
              <h3>Cumplimiento aéreo</h3>
              <p>
                Órdenes consolidadas con certificado fitosanitario (ICA),
                documentos de exportación y entrega coordinada a brokers en
                Miami (MIA) y Dallas (DFW).
              </p>
            </div>
            <div className="value-card">
              <div className="icon">💐</div>
              <h3>Variedad consistente</h3>
              <p>
                Cada orden sale con exactamente la variedad y el color
                solicitados — lotes homogéneos, tallos de grado Extra
                55&nbsp;cm o Spray 50&nbsp;cm.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ QUIÉNES SOMOS ============ */}
      <section id="about" className="block alt">
        <div className="container grid-2">
          <div>
            <p className="kicker" style={{ color: "var(--accent-deep)" }}>
              Quiénes somos
            </p>
            <h2>Una finca familiar que abastece desde 2001</h2>
            <p style={{ color: "var(--ink-soft)" }}>
              JANIDA SAS nace como una empresa familiar dedicada al cultivo
              de clavel en la Sabana de Bogotá, a 2.600 m de altitud, donde
              la radiación solar constante produce flores de tallo largo,
              cabeza compacta y color intenso.
            </p>
            <p style={{ color: "var(--ink-soft)" }}>
              Hoy somos una <strong>exportadora certificada</strong> por el
              ICA y participante del programa de trazabilidad
              Florverde para el mercado de Norteamérica. Nuestro equipo
              de 80 colaboradores (dato de demostración) combina selección
              manual en poscosecha, capacitación continua y logística en frío.
            </p>
            <p style={{ color: "var(--ink-soft)" }}>
              Trabajamos únicamente con <strong>venta mayorista en paquetes
              cerrados de 200 tallos</strong>; destino principal: EE.&nbsp;UU.
              (Miami MIA, Atlanta ATL, Dallas DFW). Precios por paquete
              entre <strong>USD&nbsp;17 y USD&nbsp;20</strong>, según
              variedad y temporada.
            </p>
          </div>
          <div>
            <img
              src="/demo-flowers/campo-janida.svg"
              alt="Cultivo de claveles JANIDA en la Sabana de Bogotá (imagen demo)"
              style={{
                borderRadius: "var(--radius)",
                border: "1px solid var(--line)",
                boxShadow: "var(--shadow-1)",
              }}
            />
            <p className="muted" style={{ fontSize: "0.8rem", color: "var(--ink-faint)", marginTop: 8 }}>
              Imagen de demostración (reemplazable por fotografía real).
            </p>
          </div>
        </div>
      </section>

      {/* ============ PROCESO DE EXPORTACIÓN ============ */}
      <section className="block">
        <div className="container grid-2">
          <div>
            <p className="kicker" style={{ color: "var(--accent-deep)" }}>
              Proceso de exportación
            </p>
            <h2>Del pedúnculo a la puerta mayorista</h2>
            <div className="process">
              <div className="step">
                <b>Cosecha bajo pedido</b>
                <p>
                  Tras el pago, calendarizamos el corte para garantizar la
                  máxima vida de flor: nunca almacenes de flor vieja.
                </p>
              </div>
              <div className="step">
                <b>Poscosecha y empaque</b>
                <p>
                  Hidratación, clasificación manual por grado de tallo y
                  empacado en caja hortícola: paquetes cerrados de 200 tallos
                  listos para exportación.
                </p>
              </div>
              <div className="step">
                <b>Cadena de frío y vuelo</b>
                <p>
                  Cámara de frío a 2–4 °C hasta que salga el vuelo BOG→MIA:
                  nunca más de 36 h de tránsito puerta a puerta (demo).
                </p>
              </div>
              <div className="step">
                <b>Recepción en destino</b>
                <p>
                  Documentos fitosanitarios pre-enviados al broker; entrega
                  coordinada al almacén del cliente en EE. UU.
                </p>
              </div>
            </div>
          </div>
          <div
            style={{
              alignSelf: "center",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius)",
              padding: "28px",
              boxShadow: "var(--shadow-1)",
            }}
          >
            <h3>Cómo comprar (mayorista)</h3>
            <ol style={{ color: "var(--ink-soft)", paddingLeft: 20, fontSize: "0.94rem", lineHeight: 1.8 }}>
              <li>
                Explora el <Link href="/catalog">catálogo</Link> de variedades
                con disponibilidad en paquetes.
              </li>
              <li>
                Agrega <strong>paquetes de 200 tallos</strong> a tu carrito
                (no vendemos tallo suelto).
              </li>
              <li>
                Completa tus datos de envío en EE. UU. y paga con el gateway
                de demostración MockPay.
              </li>
              <li>
                Nuestro equipo confirma la orden y la lleva pendiente →
                confirmado → en tránsito → <strong>entregado</strong>.
              </li>
            </ol>
            <Link href="/catalog" className="btn btn-primary" style={{ width: "100%", marginTop: 10 }}>
              Ir al catálogo →
            </Link>
          </div>
        </div>
      </section>

      {/* ============ CONTACTO ============ */}
      <section id="contact" className="block alt">
        <div className="container grid-2">
          <div>
            <p className="kicker" style={{ color: "var(--accent-deep)" }}>
              Contacto
            </p>
            <h2>Hablemos de tu programa de compras</h2>
            <p style={{ color: "var(--ink-soft)" }}>
              Surtimos a <strong>importadores, mayoristas, food wholesale y
              supermercados</strong> en Estados Unidos. Escríbenos, agendemos
              una llamada y armemos juntos tu plan semanal de claveles.
            </p>
            <ul style={{ listStyle: "none", paddingLeft: 0, fontSize: "0.95rem", color: "var(--ink-soft)", lineHeight: 2.1 }}>
              <li><strong>Oficina de ventas:</strong> ventas@janida.co</li>
              <li><strong>WhatsApp ventas:</strong> +57 320 555 0199 (demo)</li>
              <li><strong>Oficina EE. UU.:</strong> +1 (305) 555-0199 (demo)</li>
              <li><strong>Finca:</strong> Vereda San Cayetano, Savanna de Bogotá, Cundinamarca, Colombia (demo)</li>
              <li><strong>Horario:</strong> Lun– Vie · 7:00–17:00 (COT)</li>
            </ul>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
