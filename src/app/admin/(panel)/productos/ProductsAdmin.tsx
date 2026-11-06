"use client";
// ============================================================
// GESTIÓN DE PRODUCTOS (admin): crear, editar, eliminar, cambiar
// disponibilidad (paquetes) y precio por paquete, y administrar
// la galería de URLs de imágenes (pegadas manualmente).
// ============================================================
import { useCallback, useEffect, useState } from "react";
import { Modal, ModalHead } from "../../../Modal";
import { productAdminSchema, type ProductAdminInput } from "@/lib/validation";
import type { Product } from "@/lib/types";
import { formatUSD } from "@/lib/currency";

const FALLBACK = "/demo-flowers/placeholder.svg";

// -------- Modal de creación/edición --------
function ProductEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: Product | null; // null → crear
  onClose: () => void;
  onSaved: () => void;
}) {
  const creating = initial === null;
  const [form, setForm] = useState<ProductAdminInput & { galleryUrls: string[] }>({
    name: initial?.name ?? "",
    variety: initial?.variety ?? "",
    type: initial?.type ?? "standard",
    colorFamily: initial?.colorFamily ?? "",
    presentation: initial?.presentation ?? "Paquete de 200 tallos",
    packageSize: initial?.packageSize ?? 200,
    priceUSD: initial?.priceUSD ?? 18,
    packagesAvailable: initial?.packagesAvailable ?? 100,
    grade: initial?.grade ?? "Extra 55 cm",
    description: initial?.description ?? "",
    galleryUrls: initial?.galleryUrls ?? [],
    active: initial?.active ?? true,
  });
  const [newUrl, setNewUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function addUrl() {
    const u = newUrl.trim();
    if (!u) return;
    setForm((f) => ({ ...f, galleryUrls: [...f.galleryUrls, u] }));
    setNewUrl("");
  }
  function removeUrl(idx: number) {
    setForm((f) => ({ ...f, galleryUrls: f.galleryUrls.filter((_, i) => i !== idx) }));
  }

  async function save() {
    const parsed = productAdminSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errs[String(issue.path[0])] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setBusy(true);
    setApiError(null);
    try {
      const res = await fetch(
        creating ? "/api/admin/products" : `/api/admin/products/${initial!.id}`,
        {
          method: creating ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setApiError(data?.error ?? "No se pudo guardar el producto.");
        return;
      }
      onSaved();
      onClose();
    } catch {
      setApiError("Error de red al guardar.");
    } finally {
      setBusy(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 11px",
    border: "1px solid var(--line-strong)",
    borderRadius: 9,
    fontSize: "0.92rem",
    background: "#fff",
    color: "var(--ink)",
  };

  return (
    <Modal open onClose={onClose} wide>
      <ModalHead
        title={creating ? "Nuevo producto" : `Editar: ${initial!.name}`}
        sub={
          creating
            ? "Se agregará al catálogo público (si está activo)"
            : `id: ${initial!.id} · cambia disponibilidad, precio y galería`
        }
        onClose={onClose}
      />
      {apiError && <div className="form-error">{apiError}</div>}

      <div className="form-grid">
        <div className="field">
          <label>Nombre comercial <span className="req">*</span></label>
          <input style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Tempo Red" />
          {errors.name && <div className="err">{errors.name}</div>}
        </div>
        <div className="field">
          <label>Variedad <span className="req">*</span></label>
          <input style={inputStyle} value={form.variety} onChange={(e) => setForm((f) => ({ ...f, variety: e.target.value }))} placeholder="Tempo" />
          {errors.variety && <div className="err">{errors.variety}</div>}
        </div>
        <div className="field">
          <label>Tipo <span className="req">*</span></label>
          <select style={inputStyle} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ProductAdminInput["type"] }))}>
            <option value="standard">Standard (flor grande)</option>
            <option value="spray">Spray (mini clavel)</option>
          </select>
        </div>
        <div className="field">
          <label>Familia de color <span className="req">*</span></label>
          <input style={inputStyle} value={form.colorFamily} onChange={(e) => setForm((f) => ({ ...f, colorFamily: e.target.value }))} placeholder="Rojo" />
          {errors.colorFamily && <div className="err">{errors.colorFamily}</div>}
        </div>
        <div className="field">
          <label>Presentación <span className="req">*</span></label>
          <input style={inputStyle} value={form.presentation} onChange={(e) => setForm((f) => ({ ...f, presentation: e.target.value }))} />
        </div>
        <div className="field">
          <label>Grado del tallo <span className="req">*</span></label>
          <input style={inputStyle} value={form.grade} onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))} />
        </div>
        <div className="field">
          <label>Precio por paquete (USD) <span className="req">*</span></label>
          <input type="number" step="0.25" min="1" style={inputStyle} value={form.priceUSD} onChange={(e) => setForm((f) => ({ ...f, priceUSD: Number(e.target.value) }))} />
          {errors.priceUSD && <div className="err">{errors.priceUSD}</div>}
        </div>
        <div className="field">
          <label>Disponibilidad (paquetes) <span className="req">*</span></label>
          <input type="number" step="1" min="0" style={inputStyle} value={form.packagesAvailable} onChange={(e) => setForm((f) => ({ ...f, packagesAvailable: Number(e.target.value) }))} />
          {errors.packagesAvailable && <div className="err">{errors.packagesAvailable}</div>}
        </div>
        <div className="field">
          <label>Tallos por paquete</label>
          <input type="number" step="1" min="1" style={inputStyle} value={form.packageSize} onChange={(e) => setForm((f) => ({ ...f, packageSize: Number(e.target.value) }))} />
          <div className="opt" style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
            Estándar del negocio: 200 (la venta es solo en paquetes cerrados)
          </div>
        </div>
        <div className="field">
          <label>Activo en catálogo</label>
          <select
            style={inputStyle}
            value={String(form.active)}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === "true" }))}
          >
            <option value="true">Sí — visible</option>
            <option value="false">No — oculto</option>
          </select>
        </div>
        <div className="field span2">
          <label>Descripción <span className="req">*</span></label>
          <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          {errors.description && <div className="err">{errors.description}</div>}
        </div>

        {/* Galería de URLs */}
        <div className="field span2">
          <label>Galería de imágenes (URLs externas — pega manualmente) <span className="req">*</span></label>
          <div className="gallery-editor">
            <div className="url-add">
              <input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://cdn.example.com/foto-tempo-red-01.jpg"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
              />
              <button type="button" className="btn btn-outline btn-sm" onClick={addUrl}>
                + Agregar URL
              </button>
            </div>
            {errors.galleryUrls && <div className="err" style={{ marginTop: 8 }}>{errors.galleryUrls}</div>}
            <ul style={{ marginTop: newUrl || form.galleryUrls.length ? undefined : 0 }}>
              {form.galleryUrls.map((u, i) => (
                <li key={`${u}-${i}`}>
                  <img src={u} alt="" onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK)} />
                  <code>{u}</code>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeUrl(i)}>
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
            <div className="opt" style={{ fontSize: "0.75rem", color: "var(--ink-faint)", marginTop: 10 }}>
              Primera imagen = portada del catálogo. También sirven rutas
              locales como <code>/demo-flowers/tempo-red-1.svg</code>.
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? "Guardando…" : creating ? "Crear producto" : "Guardar cambios"}
        </button>
      </div>
    </Modal>
  );
}

// -------- Tabla principal --------
export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/products")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setProducts(d.products ?? []))
      .catch(() => setProducts([]));
  }, []);

  useEffect(load, [load]);

  async function toggleActive(p: Product) {
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, active: !p.active }),
    });
    load();
  }

  async function remove(p: Product) {
    if (!confirm(`¿Eliminar "${p.name}" del catálogo? Los pedidos históricos conservan su información.`)) return;
    await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
    load();
  }

  const shown = (products ?? []).filter((p) =>
    `${p.name} ${p.variety} ${p.colorFamily}`.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <>
      <div className="admin-h">
        <div>
          <h1 style={{ margin: 0 }}>Productos</h1>
          <div className="admin-opt">
            Catálogo de claveles · venta exclusivamente en paquetes de 200 tallos
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar por nombre, variedad o color…"
            style={{ padding: "9px 12px", border: "1px solid var(--line-strong)", borderRadius: 9, width: 280, fontSize: "0.9rem" }}
          />
          <button className="btn btn-primary" onClick={() => setCreating(true)}>+ Nuevo producto</button>
        </div>
      </div>

      {products === null && <p>Cargando productos…</p>}

      {products !== null && (
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Precio / paquete</th>
              <th>Disponibilidad</th>
              <th>Estado</th>
              <th style={{ textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id}>
                <td>
                  <img className="thumb" src={p.galleryUrls[0] ?? FALLBACK} alt="" onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK)} />
                </td>
                <td className="strong">
                  {p.name}
                  <div style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
                    {p.variety} · {p.colorFamily} · {p.grade} · {p.galleryUrls.length} img.
                  </div>
                </td>
                <td>{p.type === "spray" ? "Spray" : "Standard"}</td>
                <td className="strong" style={{ whiteSpace: "nowrap" }}>
                  {formatUSD(p.priceUSD)}
                  <div style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>por {p.packageSize} tallos</div>
                </td>
                <td className="strong" style={{ whiteSpace: "nowrap" }}>
                  {p.packagesAvailable} paq.
                  {p.packagesAvailable <= 80 && <span className="badge badge-low" style={{ marginLeft: 6 }}>bajo</span>}
                </td>
                <td>
                  <button className={`chip ${p.active ? "selected" : ""}`} onClick={() => toggleActive(p)} title="Clic para cambiar">
                    {p.active ? "Activo" : "Oculto"}
                  </button>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => setEditing(p)}>Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--ink-faint)" }}>Sin productos que coincidan.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {creating && (
        <ProductEditor
          initial={null}
          onClose={() => setCreating(false)}
          onSaved={load}
        />
      )}
      {editing && (
        <ProductEditor
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </>
  );
}
