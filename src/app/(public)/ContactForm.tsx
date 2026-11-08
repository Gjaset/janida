"use client";
import { useState } from "react";
import { useLang } from "../providers";

// Formulario de contacto de la sección #contact del inicio.
// Envía a /api/contact y guarda el mensaje en el almacén de datos.
export function ContactForm() {
  const { t } = useLang();
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      setState(res.ok ? "ok" : "err");
      if (res.ok) form.reset();
    } catch {
      setState("err");
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {state === "ok" && <div className="form-ok">{t("contact.ok")}</div>}
      {state === "err" && <div className="form-error">{t("contact.err")}</div>}
      <div className="field">
        <label htmlFor="cf-name">
          {t("contact.f_name")} <span className="req">{t("common.required_mark")}</span>
        </label>
        <input
          id="cf-name"
          name="name"
          required
          minLength={2}
          placeholder={t("contact.f_name_ph")}
        />
      </div>
      <div className="field">
        <label htmlFor="cf-email">
          {t("contact.f_email")} <span className="req">{t("common.required_mark")}</span>
        </label>
        <input
          id="cf-email"
          name="email"
          type="email"
          required
          placeholder={t("contact.f_email_ph")}
        />
      </div>
      <div className="field">
        <label htmlFor="cf-msg">
          {t("contact.f_message")} <span className="req">{t("common.required_mark")}</span>
        </label>
        <textarea
          id="cf-msg"
          name="message"
          rows={4}
          required
          minLength={10}
          placeholder={t("contact.f_message_ph")}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={state === "sending"}>
        {state === "sending" ? t("common.loading") : t("contact.f_send")}
      </button>
    </form>
  );
}
