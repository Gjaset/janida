// Genera el hash scrypt de un password para ADMIN_PASSWORD_HASH.
// Uso: npm run hash:password -- "MiClaveNueva"
import crypto from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error('Uso: npm run hash:password -- "MiClaveNueva"');
  process.exit(1);
}
const N = 16384, R = 8, P = 1, KEYLEN = 64;
const salt = crypto.randomBytes(8);
const hash = crypto.scryptSync(password, salt, KEYLEN, { N, r: R, p: P });
console.log(
  `scrypt$n=${N}$r=${R}$p=${P}$${salt.toString("hex")}$${hash.toString("hex")}`
);
