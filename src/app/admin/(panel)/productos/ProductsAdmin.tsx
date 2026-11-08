"use client";
// ============================================================
// GESTIÓN DE PRODUCTOS (admin, en español): crear, editar y
// eliminar variedades con: bilingüe (nombre/descripción en/ES),
// cajas: tallos por caja, pedido mínimo, precio USD por caja,
// costo COP por caja, disponibilidad EN CAJAS y galería de URLs.
// ============================================================
import { useCallback, useEffect, useState } from "react";
import { Modal, ModalHead } from "../../../Modal";
import type { Product } from "@/lib/types";
import { format_money } from "@/lib/money";

const FALLBACK = "/demo-flowers/placeholder.svg";

interface FormState {
  variety: string;
  name_en: string;
  name_es: string;
  desc_en: string;
  desc_es: string;
  type: "standard" | "spray";
  colorFamily: string;
  stemsPerBox: number;
  minOrderBoxes: number;
  pricePerBoxUSD: number;
  costPerBoxCOP: number;
  stockBoxes: number;
  grade: string;
  galleryUrls: string[];
  active: boolean;
}

function emptyForm(): FormState {
  return {
    variety: "",
    name_en: "",
    name_es: "",
    desc_en: "",
    desc_es: "",
    type: "standard",
    colorFamily: "red",
    stemsPerBox: 200,
    minOrderBoxes: 5,
    pricePerBoxUSD: 26,
    costPerBoxCOP: 75000,
    stockBoxes: 100,
    grade: "Extra 55 cm",
    galleryUrls: [],
    active: true,
  };
}

function fromProduct(p: Product): FormState {
  return {
    variety: p.variety,
    name_en: p.name_en,
    name_es: p.name_es,
    desc_en: p.desc_en,
    desc_es: p.desc_es,
    type: p.type,
    colorFamily: p.colorFamily,
    stemsPerBox: p.stemsPerBox,
    minOrderBoxes: p.minOrderBoxes,
    pricePerBoxUSD: p.pricePerBoxUSD,
    costPerBoxCOP: p.costPerBoxCOP,
    stockBoxes: p.stockBoxes,
    grade: p.grade,
    galleryUrls: [...p.galleryUrls],
    active: p.active,
  };
}

// -------- editor en modal --------
function ProductEditor({
  initial,
  takenIds,
  onClose,
  onSaved,
}: {
  initial: Product | null;
  takenIds: Set<string>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const creating = initial === null;
  const [form, setForm] = useState<FormState>(initial ? fromProduct(initial) : emptyForm());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addUrl() {
    const u = newUrl.trim();
    if (!u) return;
    set("galleryUrls", [...form.galleryUrls, u]);
    setNewUrl("");
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = creating
        ? await fetch("/api/admin/products", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(form),
          })
        : await fetch(`/api/admin/products/${initial!.id}`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(form),
          });
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Datos inválidos.");
      }
    } catch {
      setError("Error de red.");
    }
    setBusy(false);
  }

  // El servidor envía el id solo al crear; en edición se ignora.
  return (
    <Modal open onClose={onClose} wide>
      <ModalHead title={creating ? "Nueva variedad" : `Editar · ${initial!.name_es}`} onClose={onClose} />
      {error && <div className="form-error">{error}</div>}
      <div className="form-grid">
        <div className="field">
          <label>Variedad (nombre comercial)</label>
          <input value={form.variety} onChange={(e) => set("variety", e.target.value)} placeholder="Tempo" />
        </div>
        <div className="field">
          <label>Tipo</label>
          <select value={form.type} onChange={(e) => set("type", e.target.value as "standard")}>
            <option value="standard">Clavel estándar</option>
            <option value="spray">Mini clavel (spray)</option>
          </select>
        </div>
        <div className="field">
          <label>Nombre (EN)</label>
          <input value={form.name_en} onChange={(e) => set("name_en", e.target.value)} />
        </div>
        <div className="field">
          <label>Nombre (ES)</label>
          <input value={form.name_es} onChange={(e) => set("name_es", e.target.value)} />
        </div>
        <div className="field span2">
          <label>Descripción (EN)</label>
          <textarea rows={2} value={form.desc_en} onChange={(e) => set("desc_en", e.target.value)} />
        </div>
        <div className="field span2">
          <label>Descripción (ES)</label>
          <textarea rows={2} value={form.desc_es} onChange={(e) => set("desc_es", e.target.value)} />
        </div>
        <div className="field">
          <label>Color (familia)</label>
          <select value={form.colorFamily} onChange={(e) => set("colorFamily", e.target.value)}>
            {["white", "pink", "salmon", "picotee", "fuchsia", "mix"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Grado</label>
          <input value={form.grade} onChange={(e) => set("grade", e.target.value)} />
        </div>
        <div className="field">
          <label>Tallos por caja</label>
          <input
            type="number"
            min={1}
            value={form.stemsPerBox}
            onChange={(e) => set("stemsPerBox", Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>Pedido mínimo (cajas)</label>
          <input
            type="number"
            min={1}
            value={form.minOrderBoxes}
            onChange={(e) => set("minOrderBoxes", Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>Precio por caja (USD)</label>
          <input
            type="number"
            min={0.5}
            step="0.5"
            value={form.pricePerBoxUSD}
            onChange={(e) => set("pricePerBoxUSD", Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>Costo por caja (COP)</label>
          <input
            type="number"
            min={0}
            step={1000}
            value={form.costPerBoxCOP}
            onChange={(e) => set("costPerBoxCOP", Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>Disponibilidad (cajas)</label>
          <input
            type="number"
            min={0}
            value={form.stockBoxes}
            onChange={(e) => set("stockBoxes", Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>Visible en el catálogo</label>
          <select
            value={form.active ? "1" : "0"}
            onChange={(e) => set("active", e.target.value === "1")}
          >
            <option value="1">Sí</option>
            <option value="0">No</option>
          </select>
        </div>
      </div>

      <h4 style={{ margin: "14px 0 8px" }}>Galería de imágenes</h4>
      <div className="gallery-editor">
        <div className="url-add">
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Pega una URL: https://… o /ruta/imagen.svg"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
          />
          <button type="button" className="btn btn-outline btn-sm" onClick={addUrl}>
            Agregar
          </button>
        </div>
        {form.galleryUrls.length === 0 && (
          <p style={{ fontSize: "0.82rem", color: "var(--danger)", margin: "8px 0 0" }}>
            Agrega al menos una URL de imagen.
          </p>
        )}
        <ul>
          {form.galleryUrls.map((u, i) => (
            <li key={u + i}>
              <img src={u} alt="" onError={fallbackToPlaceholder} />
              <code>{u}</code>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => set("galleryUrls", form.galleryUrls.filter((_, j) => j !== i))}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 18, display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-outline" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={save}>
          {busy ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </Modal>
  );
}

function fallbackToPlaceholder(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.src = FALLBACK;
}

export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/products");
    if (res.ok) {
      const j = await res.json();
      setProducts(j.products);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function removeProduct(p: Product) {
    if (!window.confirm(`¿Eliminar "${p.name_es}" del catálogo?`)) return;
    await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
    setMessage(`Producto eliminado: ${p.name_es}`);
    void load();
  }

  const takenIds = new Set((products ?? []).map((p) => p.id));

  return (
    <>
      <div className="admin-h">
        <div>
          <h1>Productos</h1>
          <div className="admin-opt">
            Venta por cajas enteras de 200 tallos · precio y costo por caja
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
          + Nueva variedad
        </button>
      </div>

      {message && <div className="form-ok">{message}</div>}

      {!products ? (
        <p>Cargando…</p>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="big">🌸</div>
          <p>No hay productos. Crea la primera variedad.</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>Variedad (ES / EN)</th>
              <th>Tallos × caja</th>
              <th>Mín. cajas</th>
              <th>Precio caja</th>
              <th>Costo caja</th>
              <th>Stock (cajas)</th>
              <th>Visible</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <img
                    className="thumb"
                    src={p.galleryUrls[0] ?? FALLBACK}
                    alt=""
                    onError={fallbackToPlaceholder}
                  />
                </td>
                <td className="strong">
                  {p.name_es} / {p.name_en}
                  <br />
                  <small style={{ color: "var(--ink-faint)" }}>{p.grade}</small>
                </td>
                <td>{p.stemsPerBox}</td>
                <td>{p.minOrderBoxes}</td>
                <td>{format_money(p.pricePerBoxUSD)}</td>
                <td>{format_money(p.costPerBoxCOP, { currency: "COP", decimals: 0 })}</td>
                <td>
                  <span
                    className={`badge ${
                      p.stockBoxes === 0 ? "badge-out" : p.stockBoxes <= 20 ? "badge-low" : "badge-package"
                    }`}
                  >
                    {p.stockBoxes}
                  </span>
                </td>
                <td>{p.active ? "Sí" : "No"}</td>
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setEditing(p)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeProduct(p)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {(creating || editing !== null) && (
        <ProductEditor
          initial={editing}
          takenIds={takenIds}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setMessage("Cambios guardados.");
            void load();
          }}
        />
      )}
    </>
  );
}
