// GET /api/meta — configuración pública usada por el frontend.
// La tasa de cambio vive en el servidor (settings del almacén o
// la env EXCHANGE_RATE_COP como respaldo); el cliente la recibe
// aquí, nunca la calcula ni la escribe a mano.
import { NextResponse } from "next/server";
import { EXCHANGE_RATE_COP } from "@/lib/config";
import { getSettings } from "@/lib/store";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({
    brand: "JANIDA SAS",
    currencyBase: "USD",
    secondaryCurrency: "COP",
    exchangeRateCOP: settings.exchangeRateCOP ?? EXCHANGE_RATE_COP,
    stemsPerBox: 200,
  });
}
