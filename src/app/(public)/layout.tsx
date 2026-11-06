import { DemoBanner } from "../DemoBanner";
import { SiteHeader } from "../SiteHeader";
import { SiteFooter } from "../SiteFooter";

// Grupo público del sitio (páginas de comprador). El panel admin
// usa un layout propio sin esta navegación.
export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <DemoBanner />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
