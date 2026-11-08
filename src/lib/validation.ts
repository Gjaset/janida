// ============================================================
// Esquemas de validación (servidor) con Zod.
// Las rutas API rechazan payloads inválidos con estos esquemas.
// ============================================================
import { z } from "zod";

// ---------------- Comprador (checkout B2B) ----------------
// NOTA: NO se piden datos de tarjeta — el pago B2B se hace con
// factura comercial (prepago o crédito a 30/60/90 días).
export const buyerSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  company: z.string().trim().min(2, "Indica la empresa").max(140),
  country: z.string().trim().min(2).max(80),
  addressLine1: z.string().trim().min(5).max(160),
  addressLine2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().regex(/^[A-Za-z0-9\- ]{3,10}$/),
  email: z.string().trim().email(),
  phone: z.string().trim().regex(/^[+\d()\-.\s]{7,20}$/),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});
export type BuyerInput = z.infer<typeof buyerSchema>;

// ---------------- Carrito (ítems en CAJAS enteras) ----------------
export const cartItemSchema = z.object({
  productId: z.string().trim().min(1),
  // Cajas enteras. El pedido mínimo por producto se valida en el
  // servidor contra el producto (min_order_boxes).
  boxes: z.number().int("Cantidad en cajas enteras").min(1),
});
export type CartItemInput = z.infer<typeof cartItemSchema>;

export const checkoutSchema = z.object({
  buyer: buyerSchema,
  paymentTerms: z.enum(["prepaid", "net30", "net60", "net90"]),
  items: z.array(cartItemSchema).min(1, "Carrito vacío"),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ---------------- Contacto ----------------
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(2000),
});

// ---------------- Producto (admin) ----------------
export const productAdminSchema = z.object({
  variety: z.string().trim().min(1).max(80),
  name_en: z.string().trim().min(2).max(120),
  name_es: z.string().trim().min(2).max(120),
  desc_en: z.string().trim().min(10).max(2000),
  desc_es: z.string().trim().min(10).max(2000),
  type: z.enum(["standard", "spray"]),
  colorFamily: z.string().trim().min(2).max(40),
  stemsPerBox: z.number().int().min(1).max(999).default(200),
  minOrderBoxes: z.number().int().min(1).max(1000).default(5),
  pricePerBoxUSD: z.number().min(0.5).max(1000),
  costPerBoxCOP: z.number().int().min(0),
  stockBoxes: z.number().int().min(0),
  grade: z.string().trim().min(1).max(60),
  galleryUrls: z
    .array(
      z
        .string()
        .trim()
        .min(1, "La URL no puede estar vacía")
        .max(500)
        .refine(
          (u) => /^https?:\/\/.+/i.test(u) || u.startsWith("/"),
          "URL inválida (http(s)://… o ruta absoluta /…)"
        )
    )
    .min(1, "Agrega al menos una URL de imagen")
    .max(20),
  active: z.boolean(),
});
export type ProductAdminInput = z.infer<typeof productAdminSchema>;

// ---------------- Tracking / admin ----------------
export const createOrderStatus = z
  .string()
  .trim()
  .regex(/^ORD-\d{4}-\d{4}$/);

export const trackSchema = z.object({
  orderNumber: z.string().trim().min(4).max(40),
  email: z.string().trim().email(),
});

export const advanceSchema = z.object({
  action: z.enum(["advance", "mark_paid", "cancel"]),
  note: z.string().trim().max(300).optional(),
});

export const incidentSchema = z.object({
  kind: z.enum(["delay", "customs_hold"]),
  note: z.string().trim().max(300).optional(),
});
