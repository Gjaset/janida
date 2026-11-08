import Link from "next/link";
import { getLangCookie, t } from "@/lib/i18n";
import { ContactForm } from "./ContactForm";
import { TRACKING_STATUSES } from "@/lib/types";

// ------------------------------------------------------------------
// Inicio — historia de la empresa con los datos reales de Janida:
// compra a cultivos aliados (sin fincas propias), revisión y conteo
// en poscosecha de cajas de 200 tallos, pedidos semanales y
// pre-books para Valentine's Day / Mother's Day / Navidad, equipo
// (2 socios, 4 en poscosecha, 1 en transporte), proceso de 4 días
// con documentos ICA y DIAN, sostenibilidad y contacto marcadores.
// ------------------------------------------------------------------
export default async function HomePage() {
  const lang = await getLangCookie();
  const statuses = TRACKING_STATUSES.filter(
    (s) => s !== "order_received" && s !== "payment_confirmed"
  );

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="kicker">{t(lang, "home.hero_kicker")}</div>
          <h1>{t(lang, "home.hero_title")}</h1>
          <p className="lead">{t(lang, "home.hero_lead")}</p>
          <div className="hero-actions">
            <Link href="/catalog" className="btn btn-primary btn-lg">
              ✿ {t(lang, "home.cta_catalog")}
            </Link>
            <Link href="/track" className="btn btn-outline btn-lg">
              {t(lang, "home.cta_track")}
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <b>4 días</b>
              <span>{t(lang, "home.stat_1_t")}</span>
            </div>
            <div className="stat">
              <b>200</b>
              <span>{t(lang, "home.stat_2_t")}</span>
            </div>
            <div className="stat">
              <b>3</b>
              <span>{t(lang, "home.stat_3_t")}</span>
            </div>
            <div className="stat">
              <b>52</b>
              <span>{t(lang, "home.stat_4_t")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* CALIDAD */}
      <section className="block" id="about">
        <div className="container grid-2">
          <div>
            <div className="section-head">
              <div className="kicker">{t(lang, "home.quality_kicker")}</div>
              <h2>{t(lang, "home.quality_title")}</h2>
              <p>{t(lang, "home.quality_body")}</p>
            </div>
          </div>
          <div className="grid-cards">
            <div className="value-card">
              <div className="icon">🌱</div>
              <h3>{t(lang, "home.quality_b1_t")}</h3>
              <p>{t(lang, "home.quality_b1_d")}</p>
            </div>
            <div className="value-card">
              <div className="icon">🔢</div>
              <h3>{t(lang, "home.quality_b2_t")}</h3>
              <p>{t(lang, "home.quality_b2_d")}</p>
            </div>
            <div className="value-card">
              <div className="icon">📦</div>
              <h3>{t(lang, "home.quality_b3_t")}</h3>
              <p>{t(lang, "home.quality_b3_d")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESO — igual al orden del tracking */}
      <section className="block alt">
        <div className="container grid-2">
          <div>
            <div className="section-head">
              <div className="kicker">{t(lang, "home.process_kicker")}</div>
              <h2>{t(lang, "home.process_title")}</h2>
              <p>{t(lang, "home.process_note")}</p>
              <Link href="/track" className="btn btn-outline btn-sm">
                {t(lang, "home.process_cta")} →
              </Link>
            </div>
          </div>
          <div className="process">
            <div className="step">
              <b>{t(lang, "home.process_1_t")}</b>
              <p>{t(lang, "home.process_1_d")}</p>
            </div>
            <div className="step">
              <b>{t(lang, "home.process_2_t")}</b>
              <p>{t(lang, "home.process_2_d")}</p>
            </div>
            <div className="step">
              <b>{t(lang, "home.process_3_t")}</b>
              <p>{t(lang, "home.process_3_d")}</p>
            </div>
            <div className="step">
              <b>{t(lang, "home.process_4_t")}</b>
              <p>{t(lang, "home.process_4_d")}</p>
            </div>
          </div>
        </div>
        <div className="container" style={{ marginTop: 18 }}>
          <div className="chip-row" aria-hidden="true">
            {statuses.map((s) => (
              <span key={s} className="chip">
                {t(lang, `status.${s}`)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* EQUIPO */}
      <section className="block">
        <div className="container">
          <div className="section-head">
            <div className="kicker">{t(lang, "home.team_kicker")}</div>
            <h2>{t(lang, "home.team_title")}</h2>
            <p>{t(lang, "home.team_body")}</p>
          </div>
          <div className="grid-cards">
            <div className="value-card">
              <div className="icon">👥</div>
              <h3>{t(lang, "home.team_b1_t")}</h3>
              <p>{t(lang, "home.team_b1_d")}</p>
            </div>
            <div className="value-card">
              <div className="icon">🔬</div>
              <h3>{t(lang, "home.team_b2_t")}</h3>
              <p>{t(lang, "home.team_b2_d")}</p>
            </div>
            <div className="value-card">
              <div className="icon">🚚</div>
              <h3>{t(lang, "home.team_b3_t")}</h3>
              <p>{t(lang, "home.team_b3_d")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* TEMPORADAS + SOSTENIBILIDAD */}
      <section className="block alt">
        <div className="container grid-2">
          <div>
            <div className="section-head">
              <div className="kicker">{t(lang, "home.seasons_kicker")}</div>
              <h2>{t(lang, "home.seasons_title")}</h2>
              <p>{t(lang, "home.seasons_body")}</p>
              <Link href="/#contact" className="btn btn-accent btn-sm">
                {t(lang, "home.seasons_cta")} →
              </Link>
            </div>
          </div>
          <div>
            <div className="section-head">
              <div className="kicker">{t(lang, "home.sustain_kicker")}</div>
              <h2>{t(lang, "home.sustain_title")}</h2>
            </div>
            <div className="grid-cards" style={{ gap: 14 }}>
              <div className="value-card">
                <div className="icon">♻️</div>
                <h3>{t(lang, "home.sustain_b1_t")}</h3>
                <p>{t(lang, "home.sustain_b1_d")}</p>
              </div>
              <div className="value-card">
                <div className="icon">🐄</div>
                <h3>{t(lang, "home.sustain_b2_t")}</h3>
                <p>{t(lang, "home.sustain_b2_d")}</p>
              </div>
              <div className="value-card">
                <div className="icon">✈️</div>
                <h3>{t(lang, "home.sustain_b3_t")}</h3>
                <p>{t(lang, "home.sustain_b3_d")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section className="block" id="contact">
        <div className="container grid-2">
          <div>
            <div className="section-head">
              <div className="kicker">{t(lang, "contact.kicker")}</div>
              <h2>{t(lang, "contact.title")}</h2>
              <p>{t(lang, "contact.body")}</p>
            </div>
            <ul className="specs" style={{ maxWidth: 420, paddingLeft: 0 }}>
              <li>
                <span>{t(lang, "contact.addr_t")}</span>
                <b>{t(lang, "footer.contact_addr")}</b>
              </li>
              <li>
                <span>{t(lang, "contact.phone_t")}</span>
                <b>{t(lang, "footer.contact_phone_us")}</b>
              </li>
              <li>
                <span>{t(lang, "contact.email_t")}</span>
                <b>{t(lang, "footer.contact_email")}</b>
              </li>
            </ul>
          </div>
          <div className="panel">
            <h3>{t(lang, "contact.form_t")}</h3>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
