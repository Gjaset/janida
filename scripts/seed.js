// ============================================================
// seed.js — Genera la semilla de datos: data/demo-seed.json
// ------------------------------------------------------------------
// Contenido:
//   products (9 variedades con fotos reales), customers (6), orders (~12 meses,
//   picos en febrero y mayo), order_items (cajas y tallos),
//   tracking_events, settings, contact_messages.
//
// Dato REAL de Janida: clavel en caja de 200 tallos a US$26–28.
// Los precios de las demás variedades y el costo de cajas son de
// EJEMPLO: por confirmar con Janida (ver README).
//
// Uso:   node scripts/seed.js        (o `npm run seed`)
// Reproducible: RNG con semilla fija.
// ============================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(root, "data", "demo-seed.json");

// ---------------- RNG con semilla ----------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260214);
const ri = (min, max) => min + Math.floor(rnd() * (max - min + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const MS_DAY = 86400000;
const NOW = new Date();
const TODAY = new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth(), NOW.getUTCDate()));

function iso(d) {
  return d.toISOString();
}
function addDays(d, n) {
  return new Date(d.getTime() + n * MS_DAY);
}
function dateOnly(d) {
  return d.toISOString().slice(0, 10);
}

function uid() {
  return Math.random().toString(36).slice(2, 14) + Date.now().toString(36);
}

// ============================================================
// PRODUCTS — 9 variedades con FOTOS REALES (public/carnations,
// tomadas de src/img). Los colores del catálogo y de cada foto
// coinciden por diseño: blanco, rosado, salmón, picotee, fucsia
// y surtido. El estándar de US$26–28/caja es el dato real de Janida.
// ============================================================
const products = [
  {
    id: "jan-baltico",
    variety: "Baltico",
    name_en: "Baltico White",
    name_es: "Baltico Blanco",
    desc_en:
      "Pure white standard carnation with large heads and the classic green calyx. Our anchor color for civic weddings and rainbow programs; photographed straight from the box band.",
    desc_es:
      "Clavel estándar blanco puro de botón grande y cáliz verde clásico. Nuestro color ancla para bodas y programas arcoíris; fotografiado directo de la banda de la caja.",
    type: "standard",
    colorFamily: "white",
    stemsPerBox: 200,
    minOrderBoxes: 5,
    pricePerBoxUSD: 28.0,
    costPerBoxCOP: 79000,
    stockBoxes: 110,
    grade: "Extra 55 cm",
    galleryUrls: [
      "/carnations/carnation-white-1.jpg",
      "/carnations/carnation-white-2.jpg",
      "/carnations/carnation-white-3.jpg",

    ],
    active: true,
  },
  {
    id: "jan-quicksand",
    variety: "Quicksand",
    name_en: "Quicksand Pink",
    name_es: "Quicksand Rosado",
    desc_en:
      "Dusty blush-pink standard carnation, soft pastel tone. Ideal for Mother's Day arrangements and mixed pastel boxes.",
    desc_es:
      "Clavel estándar rosado empolvado de tono pastel suave. Ideal para arreglos de Día de la Madre y mezclas pastel.",
    type: "standard",
    colorFamily: "pink",
    stemsPerBox: 200,
    minOrderBoxes: 5,
    pricePerBoxUSD: 27.0,
    costPerBoxCOP: 78000,
    stockBoxes: 95,
    grade: "Extra 55 cm",
    galleryUrls: [
      "/carnations/carnation-pink-2-cover.jpg",
      "/carnations/carnation-pink-2.jpg",
      "/carnations/carnation-pink-1.jpg",
      "/carnations/carnation-pink-3.jpg",
    ],
    active: true,
  },
  {
    id: "jan-candela",
    variety: "Candela",
    name_en: "Candela Picotee",
    name_es: "Candela Picotee",
    desc_en:
      "Two-tone picotee carnation: white or blush petals edged in a crisp fuchsia line. A standout in mixed programs; photographed in standard and spray heads.",
    desc_es:
      "Clavel picotee de dos tonos: pétalos blancos o rosados con un borde fucsia nítido. Resalta en programas mezclados; fotografiado en cabezas estándar y spray.",
    type: "standard",
    colorFamily: "picotee",
    stemsPerBox: 200,
    minOrderBoxes: 5,
    pricePerBoxUSD: 26.0,
    costPerBoxCOP: 75000,
    stockBoxes: 120,
    grade: "Extra 55 cm",
    galleryUrls: [
      "/carnations/carnation-picotee-2-cover.jpg",
      "/carnations/carnation-picotee-2.jpg",
      "/carnations/carnation-picotee-1.jpg",
      "/carnations/carnation-picotee-3.jpg",
      "/carnations/carnation-picotee-4.jpg",
    ],
    active: true,
  },
  {
    id: "jan-solano",
    variety: "Solano",
    name_en: "Solano Salmon",
    name_es: "Solano Salmón",
    desc_en:
      "Warm peach-salmon standard carnation with a round, fully double bloom. Popular for autumn palettes and country-style wraps.",
    desc_es:
      "Clavel estándar salmón melocotón de flor turgente y muy doble. Popular para paletas de otoño y envolturas estilo country.",
    type: "standard",
    colorFamily: "salmon",
    stemsPerBox: 200,
    minOrderBoxes: 5,
    pricePerBoxUSD: 26.5,
    costPerBoxCOP: 76500,
    stockBoxes: 85,
    grade: "Extra 55 cm",
    galleryUrls: ["/carnations/carnation-salmon-1.jpg"],
    active: true,
  },
  {
    id: "jan-berry",
    variety: "Carmine",
    name_en: "Berry Carmine",
    name_es: "Mora Carmesí",
    desc_en:
      "Deep wine-burgundy standard carnation in the fuchsia color family, from cerise to dark berry tones. Strong demand for late-winter and moody palettes.",
    desc_es:
      "Clavel estándar borgoña profundo, dentro de la familia fucsia, desde tonos cárminos hasta vino oscuro. Fuerte demanda para paletas de invierno.",
    type: "standard",
    colorFamily: "fuchsia",
    stemsPerBox: 200,
    minOrderBoxes: 5,
    pricePerBoxUSD: 26.5,
    costPerBoxCOP: 76500,
    stockBoxes: 80,
    grade: "Extra 55 cm",
    galleryUrls: [
      "/carnations/carnation-berry-1.jpg",
      "/carnations/carnation-berry-3.jpg",
    ],
    active: true,
  },
  {
    id: "jan-arctica",
    variety: "Arctica",
    name_en: "Arctica White Spray",
    name_es: "Arctica Mini Blanco",
    desc_en:
      "Cream-white spray carnation (mini) with several bloom points per stem and tight green buds. Great volume filler for white and wedding programs.",
    desc_es:
      "Mini clavel (spray) blanco crema con varios puntos de flor por tallo y botones verdes cerrados. Excelente relleno de volumen para programas blancos y bodas.",
    type: "spray",
    colorFamily: "white",
    stemsPerBox: 200,
    minOrderBoxes: 5,
    pricePerBoxUSD: 22.5,
    costPerBoxCOP: 62000,
    stockBoxes: 140,
    grade: "Spray 50 cm",
    galleryUrls: [
      "/carnations/carnation-white-spray-1.jpg",
      "/carnations/carnation-white-spray-2.jpg",
    ],
    active: true,
  },
  {
    id: "jan-stealth",
    variety: "Stealth",
    name_en: "Stealth Pink Spray",
    name_es: "Stealth Mini Rosado",
    desc_en:
      "Soft pink spray carnation with multiple small blooms per stem; the trade-favorite pink mini for weekly wholesale bunches.",
    desc_es:
      "Mini clavel rosado con varias flores pequeñas por tallo; el mini rosado favorito de los ramos mayoristas semanales.",
    type: "spray",
    colorFamily: "pink",
    stemsPerBox: 200,
    minOrderBoxes: 5,
    pricePerBoxUSD: 23.0,
    costPerBoxCOP: 63000,
    stockBoxes: 100,
    grade: "Spray 50 cm",
    galleryUrls: [
      "/carnations/carnation-pink-spray-1.jpg",
      "/carnations/carnation-pink-spray-2.jpg",
    ],
    active: true,
  },
  {
    id: "jan-trapz-fucsia",
    variety: "Trapz Fucsia",
    name_en: "Trapz Fuchsia Mini",
    name_es: "Trapz Fucsia Mini",
    desc_en:
      "Vivid fuchsia mini carnation for bright fills and seasonal highlights. Example price: to confirm with Janida.",
    desc_es:
      "Mini clavel fucsia vivo para rellenos luminosos y resaltes de temporada. Precio de ejemplo: por confirmar con Janida.",
    type: "spray",
    colorFamily: "fuchsia",
    stemsPerBox: 200,
    minOrderBoxes: 5,
    pricePerBoxUSD: 21.0,
    costPerBoxCOP: 61000,
    stockBoxes: 14,
    grade: "Spray 50 cm",
    galleryUrls: ["/carnations/carnation-fuchsia-spray-1.jpg"],
    active: true,
  },
  {
    id: "jan-minimix",
    variety: "Surtido",
    name_en: "Assorted Mini Mix",
    name_es: "Mini Surtido",
    desc_en:
      "Assorted mini carnation big bunch in the grower's mix (colors by season: pinks, picotee, violet, peach, yellow). Shipped bunched and sleeved, label included.",
    desc_es:
      "Ramo grande de mini clavel surtido en la mezcla del cultivador (colores según temporada: rosados, picotee, violeta, durazno, amarillo). Se envía manchado y enfundado con etiqueta.",
    type: "spray",
    colorFamily: "mix",
    stemsPerBox: 200,
    minOrderBoxes: 5,
    pricePerBoxUSD: 21.5,
    costPerBoxCOP: 60500,
    stockBoxes: 60,
    grade: "Spray 50 cm",
    galleryUrls: [
      "/carnations/carnation-mix-1.jpg",
      "/carnations/carnation-mix-2.jpg",
    ],
    active: true,
  },
].map((p) => ({
  ...p,
  createdAt: iso(addDays(TODAY, -400)),
  updatedAt: iso(addDays(TODAY, -ri(1, 30))),
}));

// ============================================================
// CUSTOMERS — 3 grandes (crédito 60/90) + 3 pequeños (prepago)
// ============================================================
const customers = [
  {
    id: "cus-brooklyn",
    company: "Brooklyn Floral Distributors LLC",
    contactName: "Marcus Hale",
    email: "purchasing@bklynfloral.example",
    phone: "+1 (212) 555-0107",
    country: "United States",
    city: "Brooklyn",
    state: "NY",
    postalCode: "11232",
    addressLine1: "245 32nd St, Sunset Park",
    paymentTerms: "net60",
    tier: "large",
  },
  {
    id: "cus-petals",
    company: "Petals USA Wholesale Inc.",
    contactName: "Alicia Vargas",
    email: "orders@petalsusa.example",
    phone: "+1 (305) 555-0142",
    country: "United States",
    city: "Miami",
    state: "FL",
    postalCode: "33122",
    addressLine1: "7800 NW 25th St, Doral",
    paymentTerms: "net90",
    tier: "large",
  },
  {
    id: "cus-gardenstate",
    company: "Garden State Floral Corp.",
    contactName: "Dana Whitfield",
    email: "buy@gardenstatefloral.example",
    phone: "+1 (201) 555-0163",
    country: "United States",
    city: "Newark",
    state: "NJ",
    postalCode: "07114",
    addressLine1: "1101 Canal St",
    paymentTerms: "net60",
    tier: "large",
  },
  {
    id: "cus-rosemont",
    company: "Rosemont Flower Market",
    contactName: "Peter Ito",
    email: "hello@rosemontflowers.example",
    phone: "+1 (312) 555-0119",
    country: "United States",
    city: "Chicago",
    state: "IL",
    postalCode: "60607",
    addressLine1: "210 Peoria St",
    paymentTerms: "prepaid",
    tier: "small",
  },
  {
    id: "cus-sunbelt",
    company: "Sunbelt Blooms LLC",
    contactName: "Rachel Boyd",
    email: "sales@sunbeltblooms.example",
    phone: "+1 (214) 555-0186",
    country: "United States",
    city: "Dallas",
    state: "TX",
    postalCode: "75207",
    addressLine1: "1420 Slocum St",
    paymentTerms: "prepaid",
    tier: "small",
  },
  {
    id: "cus-aurora",
    company: "Aurora Wholesale Flowers",
    contactName: "Ken Nakamura",
    email: "ken@aurorawholesale.example",
    phone: "+1 (415) 555-0128",
    country: "United States",
    city: "San Francisco",
    state: "CA",
    postalCode: "94103",
    addressLine1: "815 Howard St",
    paymentTerms: "prepaid",
    tier: "small",
  },
].map((c) => ({ ...c, createdAt: iso(addDays(TODAY, -ri(200, 420))) }));

const CUS_WEIGHTS = [
  ["cus-brooklyn", 0.3],
  ["cus-petals", 0.27],
  ["cus-gardenstate", 0.23],
  ["cus-rosemont", 0.09],
  ["cus-sunbelt", 0.07],
  ["cus-aurora", 0.04],
];

function weightedCustomer() {
  let r = rnd();
  for (const [id, w] of CUS_WEIGHTS) {
    r -= w;
    if (r <= 0) return id;
  }
  return "cus-aurora";
}

const RECORDERS = [
  "Diana (poscosecha)",
  "Marta (poscosecha)",
  "Javier (documentos)",
  "Andrés (transporte)",
  "Programación Janida",
];

// ============================================================
// ORDERS (~48–55 en 12 meses; picos febrero y mayo)
// ============================================================
const orders = [];
const order_items = [];
const tracking_events = [];
let seq = 0;
let invSeq = 140;

const YEAR_MONTHS = [];
{
  const d = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  for (let i = 0; i < 12; i++) {
    YEAR_MONTHS.unshift(new Date(Date.UTC(d.getFullYear(), d.getMonth() - i, 1)));
  }
}

function seasonal(month) {
  if (month === 1) return 2.1; // febrero (San Valentín)
  if (month === 4) return 1.75; // mayo (Día de la Madre)
  if (month === 11) return 1.35; // diciembre (Navidad)
  return 0.9;
}

for (const monthStart of YEAR_MONTHS) {
  const month = monthStart.getUTCMonth();
  const target = Math.round(2.6 * seasonal(month) + rnd() * 1.4);
  for (let k = 0; k < target; k++) {
    if (seq >= 58) break;
    seq++;
    invSeq++;

    // fecha del pedido dentro del mes (sin pasar hoy)
    const maxDay =
      monthStart.getUTCMonth() === TODAY.getUTCMonth()
        ? Math.min(28, TODAY.getUTCDate())
        : 28;
    const day = ri(1, Math.max(1, maxDay));
    const date = new Date(
      Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), day)
    );

    const cusId = weightedCustomer();
    const cus = customers.find((c) => c.id === cusId);
    const large = cus.tier === "large";

    // líneas: 1–2 productos
    const lineCount = large && rnd() < 0.65 ? 2 : 1;
    const productIds = [pick(products).id];
    while (productIds.length < lineCount) {
      const extra = pick(products).id;
      if (!productIds.includes(extra)) productIds.push(extra);
    }

    let total = 0;
    const items = [];
    for (let li = 0; li < productIds.length; li++) {
      const pro = products.find((p) => p.id === productIds[li]);
      const steps = large ? ri(4, 16) : ri(1, 4); // múltiplos de minOrder (5 cajas)
      const boxes = steps * pro.minOrderBoxes;
      const stems = boxes * pro.stemsPerBox;
      const subtotal = Math.round(boxes * pro.pricePerBoxUSD * 100) / 100;
      total = Math.round((total + subtotal) * 100) / 100;
      items.push({ pro, boxes, stems, subtotal });
    }

    const orderNumber = `ORD-${date.getUTCFullYear()}-${String(seq).padStart(4, "0")}`;
    const invoiceNumber = `FAC-${date.getUTCFullYear()}-${String(invSeq).padStart(4, "0")}`;
    const terms = cus.paymentTerms;
    const dueOffset = terms === "prepaid" ? 0 : terms === "net30" ? 30 : terms === "net60" ? 60 : 90;
    const invoiceDate = dateOnly(date);
    const dueDate = dateOnly(addDays(date, dueOffset));

    // pago: prepago siempre pagado; crédito: ~75% pagado,
    // ~12% por vencer, ~13% vencido
    let paymentStatus = "pending";
    let paidAt = null;
    if (terms === "prepaid") {
      paymentStatus = "paid";
      paidAt = invoiceDate;
    } else {
      const roll = rnd();
      if (roll < 0.75) {
        paymentStatus = "paid";
        const paySpan = Math.max(
          1,
          Math.floor(dueOffset * (0.2 + rnd() * 0.6))
        );
        paidAt = dateOnly(addDays(date, Math.min(paySpan, dueOffset)));
        if (paidAt > TODAY.toISOString().slice(0, 10)) {
          paidAt = dateOnly(TODAY);
        }
      } else if (roll < 0.87) {
        paymentStatus = "pending"; // dentro del plazo
        if (dueDate <= dateOnly(TODAY)) {
          // si ya venció el plazo, mejor vencida (para las tablas)
          paymentStatus = "pending";
        }
      } else {
        paymentStatus = "pending"; // vencida
        if (dueDate > dateOnly(TODAY)) {
          paymentStatus = "paid"; // se paga para no falsificar futuro
          paidAt = dueDate;
        }
      }
    }

    // estado según antigüedad
    const ageDays = Math.floor((TODAY - date) / MS_DAY);
    let status;
    if (seq === 1 && monthStart === YEAR_MONTHS[YEAR_MONTHS.length - 1]) {
      // los 3 pedidos más recientes muestran estados distintos
      status = "order_received";
    } else if (ageDays > 120) status = "delivered";
    else if (ageDays > 60) status = rnd() < 0.92 ? "delivered" : "cancelled";
    else if (ageDays > 30) status = rnd() < 0.9 ? "delivered" : "arrival_us";
    else if (ageDays > 14) status = pick(["delivered", "arrival_us", "in_transit"]);
    else if (ageDays > 7) status = pick(["in_transit", "export_docs_ready", "delivered_airline"]);
    else if (ageDays > 4) status = pick(["delivered_airline", "export_docs_ready", "post_harvest_review"]);
    else if (ageDays > 2) status = pick(["post_harvest_review", "picked_up_farm", "pickup_scheduled"]);
    else status = pick(["pickup_scheduled", "payment_confirmed", "order_received"]);

    const totalUSD = total;
    orders.push({
      id: orderNumber,
      buyer: {
        fullName: cus.contactName,
        company: cus.company,
        country: cus.country,
        addressLine1: cus.addressLine1,
        city: cus.city,
        state: cus.state,
        postalCode: cus.postalCode,
        email: cus.email,
        phone: cus.phone,
        notes: undefined,
      },
      customerId: cus.id,
      totalUSD,
      paymentTerms: terms,
      invoiceNumber,
      invoiceDate,
      dueDate,
      paymentStatus,
      paidAt: paidAt ?? undefined,
      awb: `014-${String(ri(10000000, 99999999))}`,
      estimatedDelivery: dateOnly(addDays(padi(paidAt ? new Date(paidAt + "T12:00:00Z") : date), 4)),
      status,
      createdAt: iso(date),
      updatedAt: iso(date),
    });

    for (const { pro, boxes, stems, subtotal } of items) {
      order_items.push({
        id: `${orderNumber}-i${order_items.length + 1}`,
        orderId: orderNumber,
        productId: pro.id,
        name_en: pro.name_en,
        name_es: pro.name_es,
        colorFamily: pro.colorFamily,
        stemsPerBox: pro.stemsPerBox,
        boxes,
        stems,
        pricePerBoxUSD: pro.pricePerBoxUSD,
        subtotalUSD: subtotal,
        costPerBoxCOP: pro.costPerBoxCOP,
      });
    }
  }
}

// padi: alias (mantener compatibilidad con órdenes marcadas)
function padi(d) {
  return d;
}

// ============================================================
// EVENTOS DE TRACKING por pedido
// ============================================================
const LADDER = [
  "order_received",
  "payment_confirmed",
  "pickup_scheduled",
  "picked_up_farm",
  "post_harvest_review",
  "export_docs_ready",
  "delivered_airline",
  "in_transit",
  "arrival_us",
  "delivered",
];
const LOC_BY_STATE = {
  order_received: "bogota",
  payment_confirmed: "bogota",
  pickup_scheduled: "allied_farm",
  picked_up_farm: "allied_farm",
  post_harvest_review: "postharvest",
  export_docs_ready: "bogota",
  delivered_airline: "bog_airport",
  in_transit: "transit",
  arrival_us: "customs",
  delivered: "delivered_receiver",
};

for (const o of orders) {
  const created = new Date(o.createdAt);
  let t = created.getTime();
  let evIdx = 0;

  const pushEvent = (type, status, kind, when, extra = {}) => {
    tracking_events.push({
      id: `${o.id}-e${++evIdx}`,
      orderId: o.id,
      type,
      status: status ?? undefined,
      incidentKind: kind ?? undefined,
      at: iso(new Date(when)),
      location: extra.location ?? (status ? LOC_BY_STATE[status] : "bogota"),
      note: extra.note,
      recordedBy: extra.recordedBy ?? pick(RECORDERS),
      etaShiftDays: extra.etaShiftDays,
    });
  };

  pushEvent("status", "order_received", null, t, { recordedBy: "Programación Janida" });

  if (o.paymentStatus === "paid" && o.paidAt) {
    const payT = new Date(o.paidAt + "T12:00:00Z").getTime();
    pushEvent("status", "payment_confirmed", null, Math.max(t, payT), {
      recordedBy: "Javier (documentos)",
    });
  }

  if (o.status === "cancelled") {
    const cancelAt = addDays(created, ri(1, 2));
    tracking_events.push({
      id: `${o.id}-e${++evIdx}`,
      orderId: o.id,
      type: "status",
      status: "cancelled",
      at: iso(cancelAt),
      location: "bogota",
      recordedBy: "Programación Janida",
      note: "El cliente solicitó cancelación; se devolvieron las cajas al inventario.",
    });
    continue;
  }

  const lastIdx = LADDER.indexOf(o.status);
  let base = o.paymentStatus === "paid" && o.paidAt
    ? new Date(o.paidAt + "T12:00:00Z").getTime()
    : created.getTime();

  // incidencia en ~12% de pedidos que no están al inicio
  let shiftDays = 0;
  if (lastIdx >= 2 && rnd() < 0.14) {
    const kind = rnd() < 0.55 ? "delay" : "customs_hold";
    shiftDays = kind === "delay" ? 3 : 4;
    base += Math.round(shiftDays * MS_DAY * 0.3);
    pushEvent("incident", null, kind, base + 4 * MS_DAY * (lastIdx - 2 > 0 ? 1 : 0) * 0.2, {
      note:
        kind === "delay"
          ? "Retraso del vuelo programado; se corrió la fecha estimada."
          : "Retención en aduana para inspección; se corrió la fecha estimada.",
    });
  }

  for (let i = 1; i <= lastIdx; i++) {
    base += Math.round((4 / lastIdx) * MS_DAY * (0.7 + rnd() * 0.6));
    // el evento no puede ser futuro ni anterior al anterior
    const at = Math.min(Math.max(base, t + MS_DAY), TODAY.getTime() - MS_DAY * 0.05);
    if (at <= t) continue;
    t = at;
    pushEvent("status", LADDER[i], null, t);
    if (LADDER[i] === "post_harvest_review") {
      const stems = order_items
        .filter((li) => li.orderId === o.id)
        .reduce((a, li) => a + li.stems, 0);
      tracking_events[tracking_events.length - 1].note =
        `Conteo verificado: ${stems} de ${stems} tallos.`;
    }
    if (LADDER[i] === "delivered") {
      const expiredEta = new Date(o.estimatedDelivery + "T18:00:00Z").getTime();
      if (t > expiredEta) {
        tracking_events[tracking_events.length - 1].note =
          "Entregado con atraso frente a la fecha estimada.";
      }
    }
  }
  // etaShiftDays visible en el pedido tras incidencias
  if (shiftDays) {
    o.estimatedDelivery = dateOnly(addDays(new Date(o.estimatedDelivery + "T12:00:00Z"), shiftDays));
  } else if (o.status === "delivered") {
    // las entregas tardías ya quedaron en el evento; la ETA semilla queda como pagada+4
  }
}

// ============================================================
// CONTACT_MESSAGES
// ============================================================
const contacts = [
  {
    id: "msg-1",
    name: "Sofía Restrepo",
    email: "sofia@classicpetals.example",
    phone: "+1 (718) 555-0110",
    message:
      "Hi! We are planning our Valentine's Day pre-book and would like 40 boxes of Baltico White and 20 of Candela Picotee per week for January. Can you confirm availability and payment terms?",
    createdAt: iso(addDays(TODAY, -6)),
  },
  {
    id: "msg-2",
    name: "Greg Miller",
    email: "greg@urbanbloom.example",
    phone: "+1 (646) 555-0132",
    message:
      "Do you handle net30 for first-time customers? We are opening a store in Philadelphia and would love a weekly carnation program.",
    createdAt: iso(addDays(TODAY, -11)),
  },
];

// ============================================================
// SETTINGS + meta
// ============================================================
const maxOrderSeq = Math.max(
  ...orders.map((o) => Number(o.id.split("-")[2]) || 0)
);
const maxInvoiceSeq = Math.max(
  ...orders.map((o) => Number(o.invoiceNumber.split("-")[2]) || 0)
);

const seed = {
  meta: {
    seed_version: 2,
    generated_at: iso(new Date()),
    generator: "scripts/seed.js",
    note:
      "Datos de ejemplo para el sitio. El clavel estándar (US$26–28 por caja de 200 tallos) es dato de Janida; los demás precios y costos son de ejemplo: por confirmar con Janida. Números de teléfono y correos de clientes son de ejemplo.",
  },
  counters: { orderSeq: maxOrderSeq, invoiceSeq: maxInvoiceSeq },
  settings: {
    exchangeRateCOP: 3323.18,
    referenceCostBoxCOP: 75000,
    lowStockThresholdBoxes: 20,
  },
  products,
  customers,
  orders,
  order_items,
  tracking_events,
  contacts,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(seed, null, 2), "utf-8");

// resumen
const cancelled = orders.filter((o) => o.status === "cancelled").length;
const delivered = orders.filter((o) => o.status === "delivered").length;
const overdue = orders.filter(
  (o) => o.paymentStatus === "pending" && o.dueDate < TODAY.toISOString().slice(0, 10)
).length;
const withIncident = new Set(
  tracking_events.filter((e) => e.type === "incident").map((e) => e.orderId)
).size;
const sales = orders
  .filter((o) => o.status !== "cancelled")
  .reduce((a, o) => a + o.totalUSD, 0);

console.log(`✔ seed.js -> data/demo-seed.json`);
console.log(
  `   ${products.length} productos · ${customers.length} clientes · ${orders.length} pedidos (${overdue} facturas vencidas, ${withIncident} con incidencia, ${cancelled} cancelados, ${delivered} entregados)`
);
console.log(`   Ventas no canceladas 12 meses: USD ${sales.toFixed(2)}`);
console.log(`   orderSeq=${maxOrderSeq} invoiceSeq=${maxInvoiceSeq}`);
