import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
import { getLangCookie } from "@/lib/i18n";

export const metadata: Metadata = {
  title: {
    default: "JANIDA SAS — Fresh Colombian Carnations for the U.S. Wholesale Market",
    template: "%s · JANIDA SAS",
  },
  description:
    "Colombian carnation exporter to the U.S. wholesale market. 200-stem sealed boxes, B2B orders with invoices and full shipment tracking.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2e4b3a",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLangCookie();
  return (
    <html lang={lang}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
