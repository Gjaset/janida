import { getLangCookie, t } from "@/lib/i18n";
import { TrackClient } from "./TrackClient";

// Seguimiento público: el cliente consulta con su número de pedido
// y el correo de la factura. El servidor resuelve la página; la
// búsqueda y el timeline vertical corren en el cliente vía /api/track.
export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const lang = await getLangCookie();
  const sp = await searchParams;
  return (
    <div className="container page-pad">
      <div style={{ maxWidth: 640, margin: "0 auto 26px" }}>
        <h1>{t(lang, "track.title")}</h1>
        <p className="lead" style={{ color: "var(--ink-soft)" }}>
          {t(lang, "track.lead")}
        </p>
      </div>
      <TrackClient prefillOrder={sp.order ?? ""} />
    </div>
  );
}
