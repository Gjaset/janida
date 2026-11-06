// Genera las imágenes SVG de demostración del catálogo en
// public/demo-flowers/. Son ilustraciones estilizadas de claveles
// pensadas para reemplazarse por fotos reales desde el panel admin
// (pegando URLs externas por producto).
//
// Uso: npm run demo:images
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "public", "demo-flowers");
fs.mkdirSync(outDir, { recursive: true });

// ------------------------------------------------------------
// RNG con semilla (mulberry32) para composiciones reproducibles
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Camino de "borla" rizada aproximando la corola de un clavel */
function ruffle(cx, cy, radius, rnd, points = 22, jitter = 0.14) {
  let d = "";
  const pts = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2 + rnd() * 0.12;
    const rr = radius * (1 - jitter + jitter * rnd() * 1.3);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, a]);
  }
  for (let i = 0; i < points; i++) {
    const [x0, y0, a0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    if (i === 0) d += `M${x0.toFixed(1)},${y0.toFixed(1)}`;
    const midA = a0 + 0.14;
    const cxp = cx + Math.cos(midA) * radius * 1.05;
    const cyp = cy + Math.sin(midA) * radius * 1.05;
    d += ` Q${cxp.toFixed(1)},${cyp.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  return d + " Z";
}

/** Cabeza de clavel estilizada: 3 corolas en capas + centro */
function carnationHead(cx, cy, r, palette, rnd, rot = 0) {
  const petals = [];
  const angles = [0, 120, 240];
  angles.forEach((a) => {
    const [layer] = [a];
    petals.push(
      `<g transform="translate(${cx},${cy}) rotate(${rot + a}) translate(0,${-r * 0.18})">
        <path d="${ruffle(0, 0, r * 0.62, rnd)}" fill="${palette.mid}" opacity="0.85"/>
      </g>`
    );
  });
  return `
  <g>
    <ellipse cx="${cx}" cy="${cy + r * 0.95}" rx="${r * 0.72}" ry="${r * 0.16}" fill="#3d5334" opacity="0.12"/>
    <path d="M ${cx} ${cy + r} C ${cx - 6} ${cy + r + 46}, ${cx - 2} ${cy + r + 90}, ${cx + 8} ${cy + r + 150}"
          stroke="#4F6B45" stroke-width="${Math.max(3, r * 0.07)}" fill="none" stroke-linecap="round"/>
    ${petals.join("")}
    <path d="${ruffle(cx, cy, r, rnd)}" fill="${palette.base}"/>
    <path d="${ruffle(cx, cy, r * 0.62, rnd)}" fill="${palette.mid}"/>
    <path d="${ruffle(cx, cy, r * 0.3, rnd)}" fill="${palette.core}"/>
    ${[0, 70, 140, 210, 280, 350]
      .map((deg) => {
        const a = (deg * Math.PI) / 180;
        return `<circle cx="${cx + Math.cos(a) * r * 0.42}" cy="${cy + Math.sin(a) * r * 0.42}" r="${r * 0.06}" fill="${palette.core}" opacity="0.5"/>`;
      })
      .join("")}
  </g>`;
}

function hoja(x, y, len, ang, fill) {
  const rad = (ang * Math.PI) / 180;
  const dx = Math.cos(rad), dy = Math.sin(rad);
  const mx = x + dx * len * 0.5, my = y + dy * len * 0.5;
  const bw = len * 0.22;
  return `<path d="M${x},${y} Q${mx + dy * bw},${my - dx * bw} ${x + dx * len},${y + dy * len} Q${mx - dy * bw},${my + dx * bw} ${x},${y} Z" fill="${fill}"/>`;
}

function svgDocument({ W = 960, H = 640, bgA, bgB, palette, seed, title, subtitle = "JANIDA SAS · imagen de demostración", layout = "trio" }) {
  const rnd = mulberry32(seed);
  const flowers = [];
  if (layout === "single") {
    flowers.push(carnationHead(W * 0.5, H * 0.42, Math.min(W, H) * 0.24, palette, rnd, 20));
  } else if (layout === "trio") {
    flowers.push(carnationHead(W * 0.62, H * 0.40, Math.min(W, H) * 0.19, palette, rnd, 15));
    flowers.push(carnationHead(W * 0.38, H * 0.52, Math.min(W, H) * 0.15, palette, rnd, 75));
    flowers.push(hoja(W * 0.45, H * 0.78, 120, -140, "#5B7A50"));
    flowers.push(hoja(W * 0.60, H * 0.85, 140, -30, "#4F6B45"));
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia, 'Times New Roman', serif">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bgA}"/>
      <stop offset="100%" stop-color="${bgB}"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.62" cy="0.38" r="0.5">
      <stop offset="0%" stop-color="${palette.base}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${palette.base}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#halo)"/>
  <rect x="0" y="${H * 0.82}" width="${W}" height="${H * 0.18}" fill="#4F6B45" opacity="0.14"/>
  ${hoja(W * 0.14, H * 0.9, 170, -35, "#5B7A50")}
  ${hoja(W * 0.86, H * 0.84, 160, -145, "#4F6B45")}
  ${flowers.join("")}
  <g opacity="0.92">
    <text x="46" y="${H - 58}" font-size="44" fill="#2d3a2e" font-weight="bold">${title}</text>
    <text x="46" y="${H - 26}" font-size="21" fill="#5a6a5b" letter-spacing="2">${subtitle}</text>
  </g>
</svg>\n`;
}

const palettes = {
  Rojo:   { base: "#C24B4B", mid: "#9E2B2B", core: "#711A1A" },
  Blanco: { base: "#F3EDE1", mid: "#E0D5C2", core: "#C9B394" },
  Rosa:   { base: "#E7A6A6", mid: "#D37E86", core: "#B75D6E" },
  Fucsia: { base: "#D95D8C", mid: "#B2описан2E64", core: "#8C2050" },
  Lila:   { base: "#B49ACB", mid: "#9274B1", core: "#6F5290" },
};

const bgPairs = {
  Rojo:   ["#F8EEE6", "#EDD6C8"],
  Blanco: ["#F6F4EE", "#E3DCCB"],
  Rosa:   ["#F8EFE9", "#F0DAD5"],
  Fucsia: ["#F9ECEF", "#EFD2DD"],
  Lila:   ["#F5F1F8", "#E2D9EC"],
};

const images = [
  { file: "tempo-red-1.svg", family: "Rojo", title: "Tempo Red", seed: 11, layout: "single" },
  { file: "tempo-red-2.svg", family: "Rojo", title: "Tempo Red", seed: 12, layout: "trio" },
  { file: "tempo-red-3.svg", family: "Rojo", title: "Tempo Red", seed: 13, layout: "trio" },
  { file: "baltico-white-1.svg", family: "Blanco", title: "Baltico White", seed: 21, layout: "single" },
  { file: "baltico-white-2.svg", family: "Blanco", title: "Baltico White", seed: 22, layout: "trio" },
  { file: "baltico-white-3.svg", family: "Blanco", title: "Baltico White", seed: 23, layout: "trio" },
  { file: "quicksand-pink-1.svg", family: "Rosa", title: "Quicksand Rosado", seed: 31, layout: "single" },
  { file: "quicksand-pink-2.svg", family: "Rosa", title: "Quicksand Rosado", seed: 32, layout: "trio" },
  { file: "quicksand-pink-3.svg", family: "Rosa", title: "Quicksand Rosado", seed: 33, layout: "trio" },
  { file: "trapz-fucsia-1.svg", family: "Fucsia", title: "Trapz Fucsia", seed: 41, layout: "single" },
  { file: "trapz-fucsia-2.svg", family: "Fucsia", title: "Trapz Fucsia", seed: 42, layout: "trio" },
  { file: "trapz-fucsia-3.svg", family: "Fucsia", title: "Trapz Fucsia", seed: 43, layout: "trio" },
  { file: "barca-spray-1.svg", family: "Fucsia", title: "Barca Mini", seed: 51, layout: "trio" },
  { file: "barca-spray-2.svg", family: "Fucsia", title: "Barca Mini", seed: 52, layout: "single" },
  { file: "barca-spray-3.svg", family: "Fucsia", title: "Barca Mini", seed: 53, layout: "trio" },
  { file: "omea-lilac-1.svg", family: "Lila", title: "Omea Lila", seed: 61, layout: "single" },
  { file: "omea-lilac-2.svg", family: "Lila", title: "Omea Lila", seed: 62, layout: "trio" },
  { file: "omea-lilac-3.svg", family: "Lila", title: "Omea Lila", seed: 63, layout: "trio" },
  { file: "domingo-red-1.svg", family: "Rojo", title: "Domingo Rojo", seed: 71, layout: "single" },
  { file: "domingo-red-2.svg", family: "Rojo", title: "Domingo Rojo", seed: 72, layout: "trio" },
  { file: "domingo-red-3.svg", family: "Rojo", title: "Domingo Rojo", seed: 73, layout: "trio" },
  { file: "loreto-picotee-1.svg", family: "Rosa", title: "Loreto Picotee", seed: 81, layout: "single" },
  { file: "loreto-picotee-2.svg", family: "Rosa", title: "Loreto Picotee", seed: 82, layout: "trio" },
  { file: "loreto-picotee-3.svg", family: "Rosa", title: "Loreto Picotee", seed: 83, layout: "trio" },
];

for (const img of images) {
  const svg = svgDocument({
    bgA: bgPairs[img.family][0],
    bgB: bgPairs[img.family][1],
    palette: palettes[img.family],
    seed: img.seed,
    title: img.title,
    layout: img.layout,
  });
  fs.writeFileSync(path.join(outDir, img.file), svg);
}

// Imagen genérica "campo" compartida en todas las galerías
const campo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 640" font-family="Georgia, serif">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#EAF0E2"/><stop offset="100%" stop-color="#F7F2E9"/>
    </linearGradient>
    <linearGradient id="field" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7A9464"/><stop offset="100%" stop-color="#4F6B45"/>
    </linearGradient>
  </defs>
  <rect width="960" height="640" fill="url(#sky)"/>
  <circle cx="800" cy="120" r="64" fill="#F2E4C4"/>
  <rect y="300" width="960" height="340" fill="url(#field)"/>
  ${Array.from({ length: 6 })
    .map((_, row) => {
      const y = 330 + row * 52;
      const scale = 1 + row * 0.22;
      return Array.from({ length: 14 })
        .map((__, i) => {
          const x = 30 + i * 70 + (row % 2) * 22;
          const r = 7 * scale;
          const c = row % 3 === 0 ? "#D95D8C" : row % 3 === 1 ? "#E7A6A6" : "#F3EDE1";
          return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="0.9"/><rect x="${x - 1.5}" y="${y}" width="3" height="${26 * scale}" fill="#3E5436"/>`;
        })
        .join("");
    })
    .join("")}
  <g opacity="0.92">
    <text x="46" y="588" font-size="44" fill="#20301f" font-weight="bold">Cultivo JANIDA SAS</text>
    <text x="46" y="620" font-size="21" fill="#2c402a" letter-spacing="2">Sabana de Bogotá · imagen de demostración</text>
  </g>
</svg>\n`;
fs.writeFileSync(path.join(outDir, "campo-janida.svg"), campo);

// Marcador de posición para URLs externas rotas
const placeholder = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 640" font-family="Georgia, serif">
  <rect width="960" height="640" fill="#EEEAE2"/>
  <ellipse cx="480" cy="330" rx="150" ry="120" fill="#DCD4C6"/>
  <text x="480" y="360" text-anchor="middle" font-size="30" fill="#8A8375">Imagen no disponible</text>
  <text x="480" y="400" text-anchor="middle" font-size="19" fill="#9A9284" letter-spacing="2">JANIDA SAS · demo</text>
</svg>\n`;
fs.writeFileSync(path.join(outDir, "placeholder.svg"), placeholder);

console.log(`✔ ${images.length + 2} imágenes SVG generadas en public/demo-flowers/`);
