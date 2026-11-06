# JANIDA SAS — Sitio corporativo de exportación de claveles

Aplicación web completa para **JANIDA SAS**, empresa colombiana que exporta
**claveles** hacia el mercado mayorista de **Estados Unidos**. Incluye:

- 🏡 **Presentación corporativa**: hero, propuesta de valor, quiénes somos,
  proceso de exportación y contacto (con formulario).
- 🌸 **Catálogo de claveles**: 8 variedades demo, venta **exclusivamente en
  paquetes cerrados de 200 tallos**, precios entre **USD 17 y USD 20** por
  paquete, filtros por tipo/color/precio/disponibilidad, búsqueda y galería
  de imágenes por variedad (URLs que el admin pega manualmente).
- 🛒 **Carrito persistente** (localStorage), cantidades **solo en paquetes**,
  totales en **USD y COP con conversión automática**.
- 💳 **Checkout con pago simulado** (MockPay, tipo Stripe): tarjetas de
  prueba con estados de éxito y fallo — **no hay cargos reales**.
- 🔐 **Panel admin protegido** (único admin por variables de entorno):
  dashboard de métricas, CRUD de productos con galería, gestión de pedidos
  con flujo **pendiente → confirmado → en tránsito → entregado** (+ cancelar).

---

## 1) Instalación y ejecución local

Requisitos: **Node 18+** (probado con Node 22). No se necesita base de datos.

```bash
npm install          # dependencias
npm run dev          # http://localhost:3100
```

Alternativa con build de producción:

```bash
npm run build
npm start            # http://localhost:3100
```

Utilidades incluidas:

```bash
npm run demo:reset   # restaura data/db.json desde la semilla demo
npm run demo:images  # regenera las imágenes SVG de demo en public/demo-flowers
npm run hash:password -- "TuClaveNueva"   # genera hash para ADMIN_PASSWORD_HASH
```

### Credenciales de demostración del panel admin

- URL: `/admin/login` (también se llega automáticamente desde cualquier
  ruta `/admin/*` sin sesión).
- Correo: **`admin@janida.co`**
- Contraseña: **`admin123`**

> Cambia estas credenciales en producción definiendo `ADMIN_EMAIL` y
> `ADMIN_PASSWORD_HASH` (hash **scrypt**, se genera con
> `npm run hash:password -- "TuClaveNueva"`).

---

## 2) Variables de entorno (ver `.env.example`)

| Variable | Valor demo | Descripción |
|---|---|---|
| `ADMIN_EMAIL` | `admin@janida.co` | Correo de inicio de sesión del admin |
| `ADMIN_PASSWORD_HASH` | (hash de `admin123`) | Hash **scrypt** del password; **nunca** el password en claro |
| `ADMIN_SESSION_SECRET` | demo… | Semilla HMAC-SHA256 que firma la cookie de sesión (12 h de vida) |
| `CURRENCY_BASE` | `USD` | Moneda base de **almacenamiento** y cálculo |
| `EXCHANGE_RATE_COP` | `4200` | Tasa de cambio demo: **1 USD = 4 200 COP** (puede usar decimales) |
| `PAYMENT_PROVIDER` | `mock` | Proveedor del checkout (`mock` hoy; `stripe` al migrar) |
| `PAYMENT_MOCK_*` | demo | Claves del gateway simulado |
| `NEXT_PUBLIC_DEMO_MODE` | `true` | Muestra avisos de demo en la UI |
| `NEXT_PUBLIC_PACKAGE_SIZE` | `200` | Tallos por paquete (la única unidad de venta) |
| `LOW_STOCK_THRESHOLD_PACKAGES` | `80` | Umbral de paquetes para alertas de bajo inventario |

⚠️ **Importante sobre `.env`**: Next.js expande `$VARIABLE` en los archivos
de entorno. El hash sí usa `$` como separador y por eso en `.env` esos
signos van **escapados con `\$`** (así está escrito en `.env.example` y
`.env`). Si regeneras el hash con `npm run hash:password`, escapa los
signos de dólar al copiarlo a `.env`:

```
# generado:  scrypt$n=16384$...$salt$hash
# en .env:   scrypt\$n=16384\$...\$salt\$hash
```

El servidor lee la tasa de cambio (`EXCHANGE_RATE_COP`) y la expone al
navegador por `GET /api/meta`; **el cliente nunca la calcula**. Cambiar la
variable y reiniciar es todo lo que se necesita para recalcular COP en toda
la UI (los pedidos históricos conservan la tasa registrada al momento del
pago).

---

## 3) Probar el flujo completo en demo

1. **Catálogo** (`/catalog`): filtra por tipo, color, precio 17–20 USD o
   búsqueda; la disponibilidad muestra **paquetes** (y su equivalente en
   tallos). Clic en la imagen abre la **galería**.
2. Agrega **paquetes** con «+ Add package» o desde la ficha con la
   cantidad que quieras (enteros, 1 paquete mínimo).
3. **Carrito** (`/cart`): modifica cantidades por paquete, quita líneas y
   revisa subtotales en USD y COP. El carrito persiste aunque cierres el
   navegador (localStorage).
4. **Checkout** (`/checkout`): completa los datos del comprador y la
   dirección de envío en EE. UU. Al continuar se crea una sesión de pago
   (equivalente a un `PaymentIntent`) y el carrito se consume.
5. **Pago simulado** (`/pay/{pid}`): hoja de MockPay con tarjetas de prueba:

   | Número | Resultado |
   |---|---|
   | `4242 4242 4242 4242` | ✅ Aprobada (Visa) |
   | `5555 5555 5555 4444` | ✅ Aprobada (Mastercard) |
   | `3782 822463 10005` | ✅ Aprobada (Amex) |
   | `4000 0000 0000 0002` | ❌ Declinada (permite reintentar con otra tarjeta) |
   | `4000 0000 0000 9995` | ❌ Fondos insuficientes |
   | `4000 0000 0000 0069` | ❌ Expirada |

   No hay validación real de tarjetas ni conexión a redes de pago. La capa
   ya deja listo el reemplazo por Stripe (ver
   [`docs/STRIPE-INTEGRATION.md`](docs/STRIPE-INTEGRATION.md)).
6. **Confirmación** (`/orders/{id}`): resumen público del pedido con estado
   inicial «pendiente».
7. **Panel admin** (`/admin`): dashboard, productos y pedidos.

### Flujo de estados de pedido (admin)

```
pendiente ──→ confirmado ──→ en tránsito ──→ entregado
    │              │
    └── cancelado ←┘   (solo desde pendiente o confirmado)
```

- Transiciones inválidas se rechazan **en servidor** (HTTP 409).
- Al **cancelar**, los paquetes vuelven al inventario y el pedido **sale**
  de las métricas de ventas.
- Cualquier transición válida queda registrada en el **historial** del
  pedido, visible en su detalle.

---

## 4) Almacén de datos (mock, sin base de datos)

- **`data/db.json`** es la «base de datos» de demostración (productos,
  pedidos, intentos de pago, contactos, contadores). Se crea solo la
  primera vez que se ejecuta la app.
- **`data/demo-seed.json`** es la semilla con los **datos de ejemplo
  claramente marcados** (variedades ficticias, números redondos, teléfonos
  y correos de ejemplo).
- Regenera todo con `npm run demo:reset` (o el botón «Restaurar datos
  demo» del dashboard de admin).

Todas las páginas/API acceden a los datos por un único módulo,
`src/lib/store.ts` (cola de escritura atómica + transacciones). Migrar a
PostgreSQL/MongoDB/SQLite significa reimplementar ese módulo con las mismas
funciones: el resto de la app no cambia. Las tablas/colecciones sugeridas
están descritas en `src/lib/types.ts`.

### Datos de ejemplo (se reemplazan desde el admin)

| Producto | Tipo | Color | Precio/paq. USD | Disponibilidad |
|---|---|---|---:|---:|
| Tempo Red | Standard | Rojo | 18.50 | 240 paq. |
| Baltico White | Standard | Blanco | 19.00 | 180 paq. |
| Quicksand Rosado | Standard | Rosa | 18.00 | 160 paq. |
| Trapz Fucsia | Standard | Fucsia | 19.50 | 60 paq. (bajo) |
| Barca Mini (Spray) | Spray | Fucsia | 17.50 | 300 paq. |
| Omea Lila (Spray) | Spray | Lila | 17.00 | 210 paq. |
| Domingo Rojo | Standard | Rojo | 18.20 | 120 paq. |
| Loreto Picotee (Spray) | Spray | Blanco picnic | 18.80 | 70 paq. (bajo) |

Las galerías apuntan a **imágenes SVG de demostración** generadas en
`public/demo-flowers/` (regenerables con `npm run demo:images`). El
administrador puede **pegar URLs externas reales** para cada producto
(desde el panel: Productos → Editar → «Galería de imágenes»); si una URL
falla, la app muestra un marcador de posición en vez de romperse.

---

## 5) Seguridad implementada

- **Contraseñas**: hash **scrypt** (módulo nativo de Node, equivalente a
  bcrypt en propósito) con comparación en tiempo constante. Ningún password
  vive en claro en el código.
- **Sesión de admin**: cookie **HttpOnly** + `SameSite=Lax` (+ `Secure` en
  producción), firmada con **HMAC-SHA256** y expiración a 12 h. El guard
  vive en el layout de servidor `src/app/admin/(panel)/layout.tsx`, y
  **todas** las rutas `/api/admin/*` lo vuelven a verificar (401 si no hay
  sesión) — defensa en profundidad por si el layout no alcanza.
- **Validación de formularios**: schemas **zod** tanto en cliente (mensajes
  amigables) como en servidor (422 con detalle por campo). Los totales de
  pedido se **recalculan siempre en servidor** con los precios del almacén:
  el frontend no decide precios.
- **Inventario**: descuenta al aprobar pago y devuelve al cancelar; no se
  puede comprar más de la disponibilidad (validado en servidor en el
  momento del pago, por si el stock cambió mientras se completaba el
  checkout).
- **Idempotencia de pago**: un intento aprobado no puede procesarse dos
  veces; tras un rechazo se permite reintentar (comportamiento tipo Stripe).

---

## 6) Decisiones de diseño documentadas

Se pidió “tomar la decisión más razonable” en lo no especificado:

| Tema | Decisión | Justificación |
|---|---|---|
| **Idioma público** | Inglés | El comprador objetivo es un mayorista/distribuidor de EE. UU.; convierte mejor navegar en su idioma. El panel admin está en español (equipo interno colombiano). |
| **Idioma del admin** | Español | Operadores internos; reduce fricción en la operación diaria. |
| **Moneda base de almacenamiento** | **USD** | Los precios de catálogo y facturación de exportación se manejan en USD; COP solo se muestra como conversión con `EXCHANGE_RATE_COP`. Cada pedido guarda la tasa del día del pago. |
| **Tasa de cambio** | Variable de entorno | Sencilla de configurar para demo; en producción se conectaría a la TRM diaria (SICOEX / datos.gov.co). |
| **Presentación** | Paquete cerrado de **200 tallos** | Única unidad de venta exigida por el negocio; el carrito solo avanza en múltiplos de paquete. |
| **Formato de imágenes** | URLs pasadas por admin | Se respetó el requisito: el admin pega URLs (externas o locales `/demo-flowers/...`); hay fallback si una imagen no carga. |
| **Estatus cancelable** | Desde `pendiente` y `confirmado` | Una vez «en tránsito» la carga ya está embarcada; cancelar operacionalmente no procede (fácil de cambiar en `ALLOWED_TRANSITIONS`). |
| **Flete** | Incluido en el precio (demo) | Simplifica el demo real de producción: se agregaría `shippingUSD` por peso/cajas. |
| **Estética** | Verde follaje + rosa clavel, serif elegante | Naturaleza floral, sobria, contraste y legibilidad AA en móvil/escritorio. |

---

## 7) Estructura del código

```
janida-sas/
├─ data/
│  ├─ demo-seed.json          # semilla de datos demo (productora de db.json)
│  └─ db.json                 # almacén generado (se re-crea con demo:reset)
├─ docs/
│  └─ STRIPE-INTEGRATION.md   # guía para conectar Stripe real
├─ public/demo-flowers/       # imágenes SVG de demo (catálogo)
├─ scripts/                   # utilidades de demo y de operación
├─ src/
│  ├─ app/
│  │  ├─ (public)/            # sitio público (aspect de comprador)
│  │  │  ├─ page.tsx          # presentación corporativa completa
│  │  │  ├─ catalog/          # catálogo con filtros y galería
│  │  │  ├─ cart/             # carrito persistente
│  │  │  ├─ checkout/         # datos del comprador (EE. UU.)
│  │  │  ├─ pay/[pid]/        # hoja de pago simulada MockPay
│  │  │  └─ orders/[id]/      # confirmación pública del pedido
│  │  ├─ admin/
│  │  │  ├─ login/            # acceso del único administrador
│  │  │  └─ (panel)/          # guard + dashboard + productos + pedidos
│  │  ├─ api/                 # rutas: meta, products, contact, auth,
│  │  │                       # checkout, payments, admin/*
│  │  ├─ globals.css          # sistema de diseño (tokens + componentes)
│  │  └─ layout.tsx, providers.tsx
│  └─ lib/
│     ├─ config.ts            # variables de entorno centralizadas
│     ├─ store.ts             # almacén de datos (único punto de acceso)
│     ├─ types.ts             # tipos de dominio (contratos de la “BD”)
│     ├─ password.ts, auth.ts # hash scrypt + sesión firmada
│     ├─ validation.ts        # schemas zod (cliente y servidor)
│     ├─ payments.ts          # gateway SIMULADO MockPay
│     ├─ orders.ts            # creación de pedidos + transiciones
│     └─ metrics.ts           # cálculo de métricas del dashboard
└─ .env.example               # documentación de variables
```

Stack: **Next.js 15 (App Router) + React 19 + TypeScript + zod**. Sin base
de datos; el CSS es artesanal (sin framework UI) para mantener el paquete
ligero y el estilo 100 % controlado.

---

## 8) Notas para producción

- Sustituir `data/db.json` por una base de datos real (ver §4).
- Montar Stripe siguiendo la guía `docs/STRIPE-INTEGRATION.md`.
- Correos transaccionales de confirmación (hoy solo se registra el pedido).
 Proteger el endpoint público `/api/orders/[id]` si el id de pedido en
 demo no fuera adecuado (hoy se asume link privado al comprador; un paso
 de “magic link” sería el reemplazo).
- Preparar la carga de fotos reales del catálogo, y fichas ICA/
  Florverde visibles por variedad si el cliente lo requiere (demo).
