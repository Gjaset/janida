// GET /api/meta — configuración pública usada por el frontend.
// La tasa de cambio vive SOLO en el servidor (EXCHANGE_RATE_COP);
// el cliente la recibe aquí, nunca la calcula.
import { NextResponse } from "next/server";
import {
  BRAND_NAME,
  EXCHANGE_RATE_COP,
  PACKAGE_SIZE,
  PAYMENT_PROVIDER,
} from "@/lib/config";

export async function GET() {
  return NextResponse.json({
    brand: BRAND_NAME,
    currencyBase: "USD",
    secondaryCurrency: "COP",
    exchangeRateCOP: EXCHANGE_RATE_COP,
    packageSize: PACKAGE_SIZE,
    paymentProvider: PAYMENT_PROVIDER,
  });
}
