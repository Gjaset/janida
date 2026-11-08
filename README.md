# JANIDA SAS — Sitio corporativo de exportación de claveles

Aplicación web completa para **JANIDA SAS**, empresa colombiana que compra flor
a **cultivos aliados** de la Sabana de Bogotá, la revisa y cuenta en su propia
**poscosecha** y la exporta por avión hacia el mercado mayorista de
**Estados Unidos**. Incluye:

- 🌷 **Presentación corporativa bilingüe** (inglés por defecto, botón de
  español en el encabezado): historia real de la empresa —sin fincas propias,
  control de calidad y conteo en poscosecha, equipo (2 socios, 4 en
  poscosecha, 1 en transporte), proceso de 4 días con documentos **ICA y
  DIAN**, sostenibilidad (separación de plástico/caucho y residuos de flor
  como forraje) y contacto.
- 🌸 **Catálogo mayorista**: venta **exclusivamente en cajas enteras selladas
  de 200 tallos**. El clavel estándar tiene el precio real de Janida
  (**US$ 26–28 por caja**); los precios de las demás variedades son de
  ejemplo: **por confirmar con Janida**. Filtros por tipo/color/precio/
  disponibilidad, precio por caja **y** por tallo (3 decimales), equivalente
  en COP con la tasa del sistema.
- 🛒 **Carrito y checkout B2B con factura**: **no se piden datos de tarjeta**.
  El comprador elige las **condiciones de pago** (prepago o crédito a 30/60/90
  días), recibe una **factura comercial** (`FAC-…`) con vencimiento, y el
  pedido se emite con número (`ORD-…`), guía aérea (AWB) y fecha estimada de
  entrega = **pago + 4 días** (2 de recogida/preparación + 2 de vuelo).
- 📦 **Seguimiento completo con eventos**: escalera de **10 estados**
  (pedido recibido → pago confirmado → recogida programada → recogido en
  finca aliada → revisión y conteo en poscosecha → documentos de exportación
  listos → entregado a la aerolínea → en tránsito → llegada a EE. UU. →
  entregado), timeline vertical, conteo verificado («600 de 600 tallos
  contados»), incidencias (retraso **+3 días**, retención en aduana **+4
  días**) que corren la ETA. El cliente consulta **solo su pedido** con
  número de pedido + correo de la factura.
- 📊 **Panel admin** (en español, único admin por variables de entorno):
  dashboard con selector de periodo (30 d / 90 d / 12 m), KPIs de ventas,
  cajas/tallos, margen por caja, cartera por cobrar y antigüedad, entregas a
  tiempo, incidencias, gráficas con valores, tablas de facturas vencidas y
  pedidos con problemas, inventario bajo y **simulador del dólar** (cuánto
  mueve el margen si el dólar baja 100 pesos). Gestión de pedidos (avanzar
  estado, confirmar pago, cancelar, registrar incidencias) y CRUD de
  productos con campos bilingües y galería de URLs.

> Los textos visibles del sitio público provienen **todos** de un único
> diccionario (`scripts/i18n.py` → `src/lib/i18n.json`); el formato de dinero
> pasa por una única función `format_money()` (`src/lib/money.ts`) — nunca se
> escribe un `$` a mano en las plantillas.

---

## 1) Instalación y ejecución local

Requisitos: **Node 18+** (probado con Node 22) y **Python 3** para regenerar
el diccionario. No se necesita base de datos.

```bash
npm install          # dependencias
npm run seed         # genera data/demo-seed.json (~40–45 pedidos en 12 meses)
npm run demo:reset   # restaura data/db.json desde la semilla
npm run dev          # http://localhost:3100
```

Alternativa con build de producción:

```bash
npm run build
npm start            # http://localhost:3100
```

Utilidades incluidas:

```bash
npm run i18n:build   # regenera src/lib/i18n.json desde scripts/i18n.py
npm run demo:images  # regenera las imágenes SVG en public/demo-flowers
npm run hash:password -- "TuClaveNueva"   # hash para ADMIN_PASSWORD_HASH
```

> El `package.json` declara `"type": "module"`: los scripts de Node usan
> sintaxis ESM de forma nativa.

### Credenciales de acceso al panel

- URL: `/admin/login` (también se llega automáticamente desde cualquier
  ruta `/admin/*` sin sesión).
- Correo: **`admin@janida.co`**
- Contraseña: **`admin123`**

> Cambia estas credenciales en producción definiendo `ADMIN_EMAIL` y
> `ADMIN_PASSWORD_HASH` (hash **scrypt**, se genera con
> `npm run hash:password -- "TuClaveNueva"`).

---

## 2) Variables de entorno (ver `.env.example`)

| Variable | Valor de ejemplo | Descripción |
|---|---|---|
| `ADMIN_EMAIL` | `admin@janida.co` | Correo de inicio de sesión del admin |
| `ADMIN_PASSWORD_HASH` | (hash de `admin123`) | Hash **scrypt** del password; **nunca** el password en claro |
| `ADMIN_SESSION_SECRET` | (cadena larga) | Semilla HMAC-SHA256 que firma la cookie de sesión (12 h de vida) |
| `EXCHANGE_RATE_COP` | `4200` | Tasa inicial: **1 USD = 3 800 COP** en la semilla (se guarda en `settings` del almacén) |
| `LOW_STOCK_THRESHOLD_BOXES` | `20` | Umbral de **cajas** para las alertas de inventario bajo del dashboard |

⚠️ **Importante sobre `.env`**: Next.js expande `$VARIABLE` en los archivos
de entorno. El hash usa `$` como separador y por eso en `.env` esos signos
van **escapados con `\$`** (así está escrito en `.env.example` y `.env`):

```
# generado:  scrypt$n=16384$...$salt$hash
# en .env:   scrypt\$n=16384\$...\$salt\$hash
```

La tasa de cambio vive en `settings.exchangeRateCOP` del almacén (la semilla
trae **3 800**) y se expone al navegador por `GET /api/meta`; **el cliente
nunca la calcula**. El margen del dashboard usa la tasa de `settings`.

---

## 3) Flujo completo

1. **Catálogo** (`/catalog`): filtra por tipo (estándar / mini clavel),
   color, rango de precio por caja y disponibilidad; añade cajas directamente
   (el botón respeta el pedido mínimo de cada variedad).
2. **Ficha de producto** (`/catalog/{id}`): tabla «Cómo se vende» — unidad de
   venta (caja entera sellada), tallos por caja, precio por caja (USD + COP),
   precio **por tallo** (3 decimales) y pedido mínimo. Paso en múltiplos del
   mínimo.
3. **Carrito** (`/cart`): cada línea muestra «n cajas = m tallos», avisos de
   mínimo/stock, resumen de cajas, tallos totales y subtotal USD/COP.
   Persiste en `localStorage`.
4. **Checkout** (`/checkout`): datos del comprador (empresa, dirección en
   EE. UU., correo corporativo) + **condiciones de pago**: prepago,
   net 30, net 60 o net 90. Sin tarjetas: se emite una **factura**.
5. **Confirmación** (`/orders/{ORD-…}`): número de pedido, factura emitida
   con vencimiento, resumen de cajas/tallos, AWB, entrega estimada y próximos
   pasos.
6. **Seguimiento** (`/track`): consulta con **número de pedido + correo**.
   Muestra estado de la factura (pagada / por pagar / vencida), AWB, ETA,
   timeline vertical (estado actual en rosa, anteriores en verde, pendientes
   en gris) e incidencias con su corrimiento de ETA.
7. **Panel admin** (`/admin`): dashboard → pedidos → productos.

### Escalera de estados del pedido (admin)

```
pedido recibido → pago confirmado → recogida programada → recogido en finca
→ revisión y conteo en poscosecha → documentos listos (ICA/DIAN)
→ entregado a aerolínea → en tránsito → llegada a EE. UU. → entregado
                                    │
                                    └── cancelado (solo antes de aerolínea)
```

- El admin avanza **un estado a la vez** (la API rechaza saltos con 409).
- **Confirmar pago** marca la factura pagada y **recalcula la ETA**
  (pago + 4 días + corrimientos por incidencias).
- **Incidencias**: retraso (+3 días) o retención en aduana (+4 días); la ETA
  se corre automáticamente y el evento queda en el timeline del cliente.
- **Cancelar**: permitido solo antes de entregar a la aerolínea; las cajas
  **vuelven al inventario** y el pedido sale de las métricas de ventas.
- En «revisión y conteo en poscosecha» el pedido registra el conteo
  verificado (visible en `/track` como «600 de 600 tallos contados»).

---

## 4) Almacén de datos (sin base de datos)

- **`data/db.json`** es el almacén activo (productos, clientes, pedidos,
  líneas de pedido, eventos de tracking, contactos, contadores y
  `settings`). Se crea la primera vez que se ejecuta la app copiando la
  semilla.
- **`data/demo-seed.json`** se regenera con `npm run seed`: **~40–45 pedidos en
  12 meses** con picos en febrero (San Valentín) y mayo (Día de la Madre),
  6 clientes (3 grandes con crédito 60/90 y ~80–85 % de las ventas, 3
  pequeños prepago), facturas vencidas, pedidos con incidencias y pedidos en
  estados distintos para exhibir el seguimiento. El `meta` de la semilla
  documenta explicitamente que los precios/teléfonos/correos son de ejemplo.
- Restaura con `npm run demo:reset`.

Todos los accesos pasan por un único módulo, `src/lib/store.ts` (cola de
escritura atómica + transacciones). Migrar a PostgreSQL/MongoDB/SQLite
significa reimplementar ese módulo con las mismas funciones: el resto de la
app no cambia. Los «contratos» de tablas están descritos en
`src/lib/types.ts`.

### Modelos de datos clave

| Entidad | Campos notables |
|---|---|
| `products` | `name_en/name_es/desc_en/desc_es` (bilingüe), `stemsPerBox` (200), `minOrderBoxes`, `pricePerBoxUSD`, `costPerBoxCOP`, `stockBoxes`, `galleryUrls` |
| `orders` | `buyer` (snapshot), `paymentTerms` (prepaid/net30/net60/net90), `invoiceNumber`, `invoiceDate`, `dueDate`, `paymentStatus`, `paidAt`, `awb`, `estimatedDelivery`, `status` |
| `order_items` | `boxes` (entero), `stems = boxes × stemsPerBox`, `pricePerBoxUSD`, `costPerBoxCOP` (margen) |
| `tracking_events` | `type` (status/incident), `status` o `incidentKind`, `at`, `location` (traducido vía `loc.*`), `note`, `recordedBy`, `etaShiftDays` |

### Precios (dato real vs ejemplo)

| Producto | Tipo | Color | Precio caja (USD) | Origen |
|---|---|---|---:|---|
| Candela Picotee | Estándar | picotee | **26.00** | **Rango real Janida** (clavel estándar US$26–28; los demás precios son ejemplo) |
| Solano Salmón | Estándar | salmón | 26.50 | Ejemplo · por confirmar con Janida |
| Mora Carmesí | Estándar | fucsia/vino | 26.50 | Ejemplo · por confirmar con Janida |
| Quicksand Rosado | Estándar | rosado | 27.00 | Ejemplo · por confirmar con Janida |
| Baltico Blanco | Estándar | blanco | 28.00 | Ejemplo · por confirmar con Janida |
| Arctica Mini Blanco | Mini | blanco | 22.50 | Ejemplo · por confirmar con Janida |
| Stealth Mini Rosado | Mini | rosado | 23.00 | Ejemplo · por confirmar con Janida |
| Mini Surtido | Mini | surtido | 21.50 | Ejemplo · por confirmar con Janida |
| Trapz Fucsia Mini | Mini | fucsia | 21.00 | Ejemplo · por confirmar con Janida (stock bajo) |

Los filtros de color del catálogo (blanco, rosado, salmón, picotee, fucsia,
surtido) fueron ajustados a las **fotos reales** de Janida: 23 fotografías en
`public/carnations/` (origen: carpeta `src/img` del proyecto) asignadas a cada
variedad para que **el color del filtro coincida con el color de la foto**.
No existen productos ni filtros de rojo, lila, verde o amarillo porque no hay
fotos de ese color. El admin puede **agregar o reemplazar URLs de fotos**
por producto (Productos → Editar → «Galería de imágenes»); si una URL falla,
muestra un marcador en vez de romperse.

---

## 5) Internacionalización (i18n)

- **Fuente única**: `scripts/i18n.py` — diccionario `en`/`es` con paridad de
  claves validada en build (falla si falta una clave en un idioma).
  Genera `src/lib/i18n.json` (`npm run i18n:build`).
- **Idioma por defecto**: inglés. El botón del encabezado alterna a español
  vía `GET /api/lang/es|en` que fija la cookie **`janida_lang`** y redirige
  a la página original.
- **Servidor**: `t(lang, key, vars)` + `getLangCookie()` en
  `src/lib/i18n.ts`. **Cliente**: `useLang()` del `LangProvider`
  (diccionario inyectado por el layout público).
- Los nombres y descripciones de producto se almacenan **en ambos idiomas**
  en la base de datos.

---

## 6) Seguridad implementada

- **Contraseñas**: hash **scrypt** con comparación en tiempo constante.
  Ningún password vive en claro en el código.
- **Sesión de admin**: cookie **HttpOnly** + `SameSite=Lax` (+ `Secure` en
  producción), firmada con **HMAC-SHA256** (12 h). El guard vive en el
  layout `src/app/admin/(panel)/layout.tsx` y **todas** las rutas
  `/api/admin/*` lo vuelven a verificar (401 sin sesión).
- **Validación**: schemas **zod** en servidor (422 con detalle por campo).
  **Los totales, tallos, vencimientos y la ETA se calculan siempre en
  servidor** — el frontend no decide precios ni fechas.
- **Inventario**: descuenta al emitir el pedido y devuelve al cancelar; no
  se puede pedir más cajas que la disponibilidad ni por debajo del mínimo
  (409 en `/api/orders`).
- **Idempotencia**: confirmar pago dos veces no duplica eventos ni retasa la
  ETA.
- **Seguimiento privado**: `/api/track` solo responde cuando número de
  pedido y correo coinciden con un pedido existente (404 en caso contrario).

---

## 7) Decisiones de diseño documentadas

| Tema | Decisión | Justificación |
|---|---|---|
| **Idioma público** | Inglés por defecto + botón ES | El comprador objetivo es un mayorista de EE. UU.; el equipo de Janida revisa el sitio en español con un clic (cookie `janida_lang`). |
| **Pago** | Factura B2B, **sin tarjetas** | Es la forma real de operar del negocio mayorista: prepago o crédito (net 30/60/90) con factura comercial. |
| **Moneda** | USD base; COP informativo | La facturación de exportación es en USD; el COP solo se muestra con la tasa de `settings`. |
| **Unidad de venta** | **Caja entera sellada de 200 tallos** | Única unidad del negocio; el carrito y el checkout solo avanzan en múltiplos del mínimo. |
| **ETA** | Pago + 4 días (2 recogida/prep + 2 vuelo) | Los tiempos reales que describe la empresa; las incidencias la corren +3/+4 días. |
| **Cancelación** | Solo antes de aerolínea | Después de la entrega a la aerolínea la carga está embarcada. |
| **Marcadores de contacto** | `+1 (000) 000-0000`, `contact@janida.example` | Marcadores para reemplazar por los datos reales de Ventas EE. UU. (ver `.env.example`). |
| **Estética** | Verde follaje + rosa clavel, serif elegante | Naturaleza floral, sobria, contraste AA. |

---

## 8) Estructura del código

```
janida-sas/
├─ data/
│  ├─ demo-seed.json          # semilla (npm run seed) — datos de ejemplo
│  └─ db.json                 # almacén activo (npm run demo:reset restaura)
├─ public/
│  ├─ carnations/             # FOTOS REALES de claveles (23, origen src/img)
│  └─ demo-flowers/           # SVG placeholder (fallback si una URL falla)
├─ scripts/
│  ├─ i18n.py                 # DICCIONARIO EN/ES → src/lib/i18n.json
│  ├─ seed.js                 # generador de la semilla (~40–45 pedidos/12 m)
│  ├─ reset-demo-data.mjs     # restaura db.json
│  ├─ make-svg-images.mjs     # imágenes SVG
│  └─ hash-password.mjs       # hash scrypt para ADMIN_PASSWORD_HASH
├─ src/
│  ├─ app/
│  │  ├─ (public)/            # sitio público (EN por defecto / ES por cookie)
│  │  │  ├─ page.tsx          # presentación corporativa + contacto
│  │  │  ├─ catalog/          # catálogo + ficha (tabla «Cómo se vende»)
│  │  │  ├─ cart/  checkout/  # carrito y checkout B2B con factura
│  │  │  ├─ orders/[id]/      # confirmación del pedido
│  │  │  └─ track/            # seguimiento público (timeline vertical)
│  │  ├─ admin/
│  │  │  ├─ login/            # acceso del único administrador
│  │  │  └─ (panel)/          # dashboard (métricas + simulador), pedidos
│  │  │                       # (acciones + incidencias), productos (CRUD)
│  │  ├─ api/                 # meta, orders, track, contact, lang/[to],
│  │  │                       # admin/* (métricas, pedidos, productos)
│  │  ├─ globals.css          # sistema de diseño (tokens + componentes)
│  │  └─ layout.tsx, providers.tsx (Lang/Cart/Rate)
│  └─ lib/
│     ├─ config.ts            # variables de entorno centralizadas
│     ├─ i18n.ts              # t() + getLangCookie() (server)
│     ├─ i18n.json            # generado desde scripts/i18n.py
│     ├─ money.ts             # format_money() — ÚNICO formateador de dinero
│     ├─ store.ts             # almacén JSON (único punto de acceso)
│     ├─ types.ts             # dominio: escalera de 10 estados, cajas, etc.
│     ├─ validation.ts        # schemas zod
│     ├─ orders.ts            # emitter + escalera + incidencias + lookup
│     ├─ metrics.ts           # motor de métricas del dashboard
│     └─ auth.ts, password.ts # sesión firmada + hash scrypt
└─ .env.example               # documentación de variables
```

Stack: **Next.js 15 (App Router) + React 19 + TypeScript + zod**. Sin base
de datos; CSS artesanal (sin framework UI).

---

## 10) Despliegue en Vercel

El proyecto está listo para Vercel (Next.js 15, se detecta
automáticamente), con dos particularidades por ser el almacén de
datos un archivo JSON:

**Almacén en serverless.** El filesystem de Vercel es de solo
lectura. El store detecta `VERCEL=1` y trabaja sobre una copia en
`/tmp/janida-data`: se auto-siembra desde `data/demo-seed.json`
(incluida en el bundle vía `outputFileTracingIncludes` de
`next.config.mjs`) y las escrituras (checkout, admin, contacto)
funcionan, pero son **efímeras** — se pierden al ciclar la
instancia. Suficiente para el sitio B2B de demostración con pedidos
simulados; si se necesita persistencia real:
reimplementar `src/lib/store.ts` (mismas firmas) sobre una BD
gestionada (p. ej. Neon/Postgres en el marketplace de Vercel), sin
tocar el resto del código.

**Variables de entorno.** Configurar en Vercel → Project → Settings
→ Environment Variables (Production):

| Variable | Valor |
|---|---|
| `ADMIN_EMAIL` | p. ej. `admin@janida.co` |
| `ADMIN_PASSWORD_HASH` | hash scrypt del password (`npm run hash:password -- "clave"`). **Ojo:** en el panel de Vercel va SIN escapar los `$` (el escape `\$` solo aplica a archivos `.env`) |
| `ADMIN_SESSION_SECRET` | 32+ caracteres aleatorios (`openssl rand -hex 32`) |
| `EXCHANGE_RATE_COP` | p. ej. `3800` |
| `LOW_STOCK_THRESHOLD_BOXES` | `20` |

(No hay claves de pasarela de pago: el checkout es factura B2B con
crédito 30/60/90.)

**Pasos.**
1. Hacer commit de los cambios y `git push github main` (remoto:
   `git@github.com:Gjaset/janida.git`).
2. En vercel.com → Add New → Project → importar `Gjaset/janida`.
3. Framework Preset: Next.js (autodetectado). Build / Start:
   por defecto (`next build` / `next start` → serverless). Node:
   >= 20 (fijado en `engines`).
4. Añadir las variables de entorno de la tabla.
5. Deploy. Al final cada URL sirve: `/`, `/catalog`, fichas,
   `/track`, `/admin`, y las fotos de `public/carnations/`.

---

## 11) Notas para producción

- Sustituir `data/db.json` por una base de datos real (reimplementar
  `src/lib/store.ts` con las mismas firmas).
- Los consumos de la API pública (`/api/orders`, `/api/track`,
  `/api/contact`) conviene protegerlos con rate-limit en producción.
- Correos transaccionales: hoy la factura «se emite» en el sistema; el paso
  de envío real del PDF de factura y del magic link de seguimiento queda
  como siguiente integración.
- Reemplazar los marcadores de contacto (`+1 (000) 000-0000`,
  `contact@janida.example`) por los datos reales de Ventas EE. UU.
- Cargar fotos reales del catálogo y las fichas ICA/Florverde por variedad
  cuando el cliente las comparta.
