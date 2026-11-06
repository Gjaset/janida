// ============================================================
// Esquemas de validación (servidor) con zod.
// Se usan en las rutas API para rechazar payloads inválidos;
// el frontend también valida en el cliente con los mismos
// criterios y muestra errores amigables.
// ============================================================
import { z } from "zod";

// ---------------- Comprador (checkout) ----------------
export const buyerSchema = z.object({
  fullName: z.string().trim().min(3, "Nombre demasiado corto").max(120),
  company: z.string().trim().min(2, "Indica la empresa").max(140),
  country: z.string().trim().min(2).max(80),
  addressLine1: z.string().trim().min(5, "Dirección demasiado corta").max(160),
  addressLine2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Ciudad requerida").max(80),
  state: z.string().trim().min(2, "Estado/provincia requerido").max(80),
  postalCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9\- ]{3,10}$/, "Código postal inválido"),
  email: z.string().trim().email("Correo inválido"),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d()\-.\s]{7,20}$/, "Teléfono inválido"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});
export type BuyerInput = z.infer<typeof buyerSchema>;

// ---------------- Carrito (ítems en PAQUETES) ----------------
export const cartItemSchema = z.object({
  productId: z.string().trim().min(1),
  // Número de PAQUETES (entero ≥ 1). La venta es únicamente por
  // paquetes cerrados de 200 tallos.
  packages: z.number().int("Cantidad debe ser entera (paquetes)").min(1),
});
export const checkoutSchema = z.object({
  buyer: buyerSchema,
  items: z.array(cartItemSchema).min(1, "Carrito vacío"), // nota: min(1)
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ---------------- Contacto ----------------
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  message: z.string().trim().min(10).max(2000),
});

// ---------------- Pago simulado (tarjeta mock) ----------------
// NO se valida contra bandejas de tarjetas reales ni hay Luhn:
// el pasarela mock solo acepta los "números de prueba" documentados.
export const cardSchema = z.object({
  cardNumber: z
    .string()
    .trim()
    .regex(/^\d{15,16}$/, "Número de tarjeta inválido (use los números de prueba)"),
  cvc: z
    .string()
    .trim()
    .regex(/^\d{3,4}$/, "CVC inválido"),
  expMonth: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])$/, "Mes (MM) inválido"),
  expYear: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Año (AAAA) inválido"),
  name: z.string().trim().min(3).max(120),
  zip: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9\- ]{3,10}$/, "Código postal inválido"),
});
export type CardInput = z.infer<typeof cardSchema>;

// ---------------- Producto (admin) ----------------
export const productAdminSchema = z.object({
  name: z.string().trim().min(2).max(120),
  variety: z.string().trim().min(1).max(80),
  type: z.enum(["standard", "spray"]),
  colorFamily: z.string().trim().min(2).max(40),
  presentation: z.string().trim().min(3).max(120),
  packageSize: z
    .number()
    .int()
    .gt(0)
    .default(200),
  priceUSD: z
    .number()
    .min(1, "Precio demasiado bajo")
    .max(1000, "Precio demasiado alto"),
  packagesAvailable: z
    .number()
    .int("Disponibilidad en paquetes (entero)")
    .min(0),
  grade: z.string().trim().min(1).max(60),
  description: z.string().trim().min(10).max(2000),
  galleryUrls: z
    .array(
      z
        .string()
        .trim()
        .min(1, "URL de imagen no puede estar vacía")
        .max(500)
        .refine(
          (u) => /^https?:\/\/.+/i.test(u) || u.startsWith("/"),
          "URL de imagen inválida (http(s)://… o ruta absoluta /…)"
        )
    )
    .min(1, "Agrega al menos una URL de imagen")
    .max(20),
  active: z.boolean(),
});
export type ProductAdminInput = z.infer<typeof productAdminSchema>;

// ---------------- Cambio de estado de pedido ----------------
export const statusSchema = z.object({
  status: z.enum([
    "pendiente",
    "confirmado",
    "en_transito",
    "entregado",
    "cancelado",
  ]),
  note: z.string().trim().max(300).optional(),
});
