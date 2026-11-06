// ============================================================
// ALMACÉN DE DATOS (mock, sin base de datos)
// ------------------------------------------------------------
// Implementación actual: archivo JSON en `data/db.json`,
// sembrado la primera vez desde `data/demo-seed.json`.
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
  Order,
  PaymentIntent,
  Product,
} from "./types";

const DB_FILE = path.join(DATA_DIR, "db.json");
const SEED_FILE = path.join(DATA_DIR, "demo-seed.json");

export interface Db {
  meta: Record<string, unknown>;
  counters: { orderSeq: number };
  products: Product[];
  orders: Order[];
  payments: PaymentIntent[];
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
    // Primera ejecución (o tras `npm run demo:reset`): copiar semilla.
    const seed = await fsp.readFile(SEED_FILE, "utf-8");
    await fsp.writeFile(DB_FILE, seed, "utf-8");
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

/** Restaura los datos de demostración (destructivo) */
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
  if (!opts?.includeInactive) {
    return products.filter((p) => p.active);
  }
  return products;
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const db = await readDb();
  return db.products.find((p) => p.id === id);
}

export async function listOrders(): Promise<Order[]> {
  const db = await readDb();
  return db.orders;
}
