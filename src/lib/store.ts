// ============================================================
// ALMACÉN DE DATOS (sin base de datos)
// ------------------------------------------------------------
// Implementación actual: archivo JSON en `data/db.json`,
// sembrado la primera vez desde `data/demo-seed.json`
// (generado por scripts/seed.js).
//
// Todo el acceso a datos de la app pasa por este módulo, de
// forma que migrar a una base de datos real (PostgreSQL,
// MongoDB, SQLite…) solo exige reimplementar estas funciones
// manteniendo las mismas firmas — el resto del código no cambia.
// ============================================================
import fsp from "node:fs/promises";
import path from "node:path";
import { DATA_DIR } from "./config";
import type {
  ContactMessage,
  Customer,
  Order,
  OrderItem,
  Product,
  Settings,
  TrackingEvent,
} from "./types";

const DB_FILE = path.join(DATA_DIR, "db.json");
/**
 * Semilla SIEMPRE en el directorio de despliegue (cwd-relative):
 * - Local: `data/demo-seed.json` junto al código.
 * - Vercel: se incluye en el bundle vía outputFileTracingIncludes
 *   y se lee del cwd de la función; las ESCRITuras van a /tmp
 *   (DATA_DIR), nunca al origen.
 */
const SEED_FILE = process.env.DATA_SEED
  ? process.env.DATA_SEED
  : path.join(process.cwd(), "data", "demo-seed.json");

export interface Db {
  meta: Record<string, unknown>;
  counters: { orderSeq: number; invoiceSeq: number };
  settings: Settings;
  products: Product[];
  customers: Customer[];
  orders: Order[]; // pedidos (cabecera)
  order_items: OrderItem[]; // líneas de pedido, referencian orderId
  tracking_events: TrackingEvent[]; // eventos del seguimiento
  contacts: ContactMessage[];
}

// ------------------------------------------------------------
// Cola de escritura: serializa las operaciones de actualización
// para evitar condiciones de carrera entre peticiones.
// ------------------------------------------------------------
let writeQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(task, task);
  writeQueue = next.catch(() => {});
  return next;
}

let seededOnce = false;

async function ensureSeeded(): Promise<void> {
  if (seededOnce) return;
  await fsp.mkdir(DATA_DIR, { recursive: true });
  try {
    await fsp.access(DB_FILE);
  } catch {
    // Primera ejecución (o tras `npm run seed` + reset): copiar semilla.
    try {
      const seed = await fsp.readFile(SEED_FILE, "utf-8");
      await fsp.writeFile(DB_FILE, seed, "utf-8");
    } catch {
      // Semilla no accesible (p. ej. bundle de Vercel sin data/):
      // crear un almacén vacío válido para no tumbar la función.
      await fsp.writeFile(
        DB_FILE,
        JSON.stringify({
          meta: { note: "semilla no encontrada en este build" },
          counters: { orderSeq: 0, invoiceSeq: 0 },
          settings: {
            referenceCostBoxCOP: 75000,
            exchangeRateCOP: 3800,
          },
          products: [],
          customers: [],
          orders: [],
          order_items: [],
          tracking_events: [],
          contacts: [],
        }),
        "utf-8"
      );
    }
  }
  seededOnce = true;
}

/** Lee todo el almacén (crea la semilla si el archivo no existe) */
export async function readDb(): Promise<Db> {
  await ensureSeeded();
  const raw = await fsp.readFile(DB_FILE, "utf-8");
  return JSON.parse(raw) as Db;
}

/** Reescribe el almacén completo (uso interno) */
async function persist(db: Db): Promise<void> {
  const tmp = DB_FILE + ".tmp";
  await fsp.writeFile(tmp, JSON.stringify(db, null, 2), "utf-8");
  await fsp.rename(tmp, DB_FILE); // escritura atómica
}

/**
 * Transacción: lee el almacén, muta los datos y persiste.
 * Las mutaciones se ejecutan en serie bajo la cola de escritura.
 */
export async function updateDb(
  mutator: (db: Db) => void | Promise<void>
): Promise<Db> {
  return enqueue(async () => {
    const db = await readDb();
    await mutator(db);
    await persist(db);
    return db;
  });
}

/** Restaura los datos de la semilla (destructivo) */
export async function resetToSeed(): Promise<void> {
  return enqueue(async () => {
    await fsp.mkdir(DATA_DIR, { recursive: true });
    const seed = await fsp.readFile(SEED_FILE, "utf-8");
    await fsp.writeFile(DB_FILE, seed, "utf-8");
  });
}

// ------------------------------------------------------------
// Consultas de alto nivel
// ------------------------------------------------------------

export async function listProducts(opts?: {
  includeInactive?: boolean;
}): Promise<Product[]> {
  const db = await readDb();
  const products = [...db.products];
  if (!opts?.includeInactive) return products.filter((p) => p.active);
  return products;
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const db = await readDb();
  return db.products.find((p) => p.id === id);
}

export async function listCustomers(): Promise<Customer[]> {
  const db = await readDb();
  return db.customers;
}

export async function listOrders(): Promise<Order[]> {
  const db = await readDb();
  return db.orders;
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const db = await readDb();
  return db.orders.find((o) => o.id === id);
}

export async function itemsOfOrder(orderId: string): Promise<OrderItem[]> {
  const db = await readDb();
  return db.order_items.filter((i) => i.orderId === orderId);
}

export async function eventsOfOrder(orderId: string): Promise<TrackingEvent[]> {
  const db = await readDb();
  return db.tracking_events
    .filter((e) => e.orderId === orderId)
    .sort((a, b) => a.at.localeCompare(b.at));
}

export async function getSettings(): Promise<Settings> {
  const db = await readDb();
  return db.settings;
}
