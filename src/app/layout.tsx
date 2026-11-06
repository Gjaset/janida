import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "JANIDA SAS — Fresh Colombian Carnations for the U.S. Wholesale Market",
    template: "%s · JANIDA SAS",
  },
  description:
    "Exportadora colombiana de claveles hacia Estados Unidos. Catálogo mayorista en paquetes de 200 tallos, pedidos con pago simulado y seguimiento de envíos.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2e4b3a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
