// ============================================================
// Hash de contraseñas con scrypt (módulo nativo de Node).
// Sin dependencias externas; equivalente en propósito a bcrypt
// y apto para producción.
//
// Formato del hash almacenado (auto-descriptivo):
//   scrypt$n=16384$r=8$p=1$<salt-hex>$<hash-hex>
// ============================================================
import crypto from "node:crypto";

const N = 16384, R = 8, P = 1, KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(8);
  const hash = crypto.scryptSync(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$n=${N}$r=${R}$p=${P}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split("$"); // [scrypt, n=…, r=…, p=…, salt, hash]
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;
    const [, nPart, rPart, pPart, saltHex, hashHex] = parts;
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const actual = crypto.scryptSync(
      password,
      salt,
      expected.length,
      {
        N: Number(nPart.replace("n=", "")),
        r: Number(rPart.replace("r=", "")),
        p: Number(pPart.replace("p=", "")),
      }
    );
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
