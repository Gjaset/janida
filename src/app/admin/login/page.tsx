"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "No se pudo iniciar sesión.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit} noValidate>
        <p className="kicker" style={{ color: "var(--accent-deep)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.72rem", fontWeight: 700, marginBottom: 8 }}>
          Panel interno · JANIDA SAS
        </p>
        <h1>Acceso del administrador</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>
          Único administrador configurado por variables de entorno
          (<code style={{ fontSize: "0.8rem" }}>ADMIN_EMAIL</code> + hash).
        </p>
        {error && <div className="form-error">{error}</div>}
        <div className="field">
          <label>Correo</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@janida.co"
            autoComplete="username"
          />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} disabled={busy}>
          {busy ? "Verificando…" : "Iniciar sesión"}
        </button>
        <div className="login-note">
          <strong>Credenciales de demostración:</strong> admin@janida.co /
          admin123 (fijadas en <code>.env</code> y documentadas en el README).
          En producción define tu propio <code>ADMIN_EMAIL</code> y un hash
          propio con <code>npm run hash:password</code>.
        </div>
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Link href="/" style={{ fontSize: "0.85rem" }}>← Volver al sitio público</Link>
        </div>
      </form>
    </div>
  );
}
