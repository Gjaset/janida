"use client";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Modal accesible básico (cierra con Escape y clic fuera). */
export function Modal({
  open,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal ${wide ? "modal-admin" : ""}`} role="dialog" aria-modal>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function ModalHead({
  title,
  sub,
  onClose,
}: {
  title: ReactNode;
  sub?: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-head">
      <div>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {sub && <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>{sub}</div>}
      </div>
      <button className="modal-close" onClick={onClose} aria-label="Cerrar">
        ×
      </button>
    </div>
  );
}
