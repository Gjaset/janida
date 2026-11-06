"use client";
import { useState } from "react";

// Formulario de contacto (demo). Se guarda en el almacén mock vía
// /api/contact; en producción conectaría con correo/CRM.
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function validate(): boolean {
    const e: typeof errors = {};
    if (name.trim().length < 2) e.name = "Nombre requerido";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Correo inválido";
    if (message.trim().length < 10) e.message = "Cuenta brevemente qué necesitas (mínimo 10 caracteres)";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setApiError(null);
    if (!validate()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => ""));
      setSent(true);
    } catch {
      setApiError("No se pudo enviar el mensaje. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="panel">
        <div className="form-ok">
          ¡Gracias! Tu mensaje fue recibido (demo). El equipo de ventas
          te responderá en 1–2 días hábiles.
        </div>
        <button className="btn btn-outline" onClick={() => { setSent(false); setName(""); setEmail(""); setMessage(""); }}>
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <form className="panel" onSubmit={submit} noValidate>
      <h3 style={{ marginBottom: 14 }}>Envíanos un mensaje</h3>
      {apiError && <div className="form-error">{apiError}</div>}
      <div className="field">
        <label>Nombre <span className="req">*</span></label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
        {errors.name && <div className="err">{errors.name}</div>}
      </div>
      <div className="field">
        <label>Correo <span className="req">*</span></label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@empresa.com" type="email" />
        {errors.email && <div className="err">{errors.email}</div>}
      </div>
      <div className="field">
        <label>Mensaje <span className="req">*</span></label>
        <textarea
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Variedades y número de paquetes que te interesan, ciudad de entrega en EE. UU., frecuencia…"
        />
        {errors.message && <div className="err">{errors.message}</div>}
      </div>
      <button className="btn btn-primary" disabled={busy} style={{ width: "100%" }}>
        {busy ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
