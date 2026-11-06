// Restaura data/db.json desde la semilla data/demo-seed.json.
// Cuidado: borra pedidos, pagos y contactos generados.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const seed = path.join(root, "data", "demo-seed.json");
const db = path.join(root, "data", "db.json");

fs.copyFileSync(seed, db);
console.log("✔ Datos de demostración restaurados desde data/demo-seed.json");
console.log("  (cierra y vuelve a iniciar `npm run dev` si estaba en ejecución)");
