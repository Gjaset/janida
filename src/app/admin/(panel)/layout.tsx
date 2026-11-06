import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { AdminTopbar } from "./AdminTopbar";

// GUARDIA del panel: cualquier página bajo /admin (excepto login)
// exige sesión firmada; sin cookie válida redirige a /admin/login.
export default async function AdminPanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return (
    <div className="admin-shell">
      <AdminTopbar email={session.email} />
      <div className="admin-body">{children}</div>
    </div>
  );
}
