# Migrar la pasarela simulada a Stripe real

> La app ya tiene el checkout **en dos pasos** igual que Stripe Checkout,
> así que solo hay que cambiar el módulo de pago y reexpedir las rutas
> hacia la API real. Nada del flujo de carrito o del panel admin cambia.

El flujo implementado reproduzca exactamente la fila de endpoints de Stripe:

| Paso            | MockPay (hoy)                                    | Stripe real                                                          |
|-----------------|---------------------------------------------------|----------------------------------------------------------------------|
| Pre-checkout    | `POST /api/checkout/session`                      | igual (crea `PaymentIntent`, `amount`, `metadata.orderSnapshot`)     |
| Autorización    | `POST /api/payments/authorize?pid=...`            | `stripe.confirmPayment` en el front (o Payment Element)              |
| Confirmación    | Marca intento `succeeded`, crea el pedido         | Webhook `payment_intent.succeeded` → crea el pedido                  |
| Reintentos      | Intento permanece `requires_payment` tras fallo   | mismo comportamiento (Checkout Session reutilizable)                 |

## Pasos de integración

1. **Dependencia**
   ```bash
   npm install stripe
   ```

2. **Variables de entorno** (`src/lib/config.ts`)
   ```env
   PAYMENT_PROVIDER=stripe        # enciende el modo stripe
   STRIPE_SECRET_KEY=sk_live_...  # o sk_test_...
   NEXT_PUBLIC_STRIPE_PK=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. **Rama nueva de pago**: crea `src/lib/payments-stripe.ts` con al menos:
   - `createStripeCheckoutSession(snap)` → devuelve una `stripe.checkout.sessions.create()` mapeada
     del mismo snapshot de carrito (amount, moneda `usd`, `customer_email`, `client_reference_id`).
   - un webhook `src/app/api/webhooks/stripe/route.ts` que escuche
     `checkout.session.completed` o `payment_intent.succeeded` y llame a la
     MISMA función `createOrderFromPayment` que ya existe ✓.
   - Firmas de webhook con `stripe.webhooks.constructEvent(rawBody, sig, secret)`.

4. **Ruteo del frontend**: en `src/app/(public)/checkout/page.tsx`, en lugar de
   `POST /api/checkout/session → /pay/{pid}`, cuando
   `NEXT_PUBLIC_PAYMENT_PROVIDER === "stripe"` redirige a la `session.url`
   de Stripe (Serveless) o monta `@stripe/stripe-js` con el Payment Element.

5. **Seguridad**
   - Nunca pases la `sk_live_` al navegador: sólo `pk_`.
   - La `paymentRef` de hoy cambia por `ch_session_id` → persistúla en el
     campo `PaymentIntent.pid` (ya existe esa abstracción).
   - Configura un dominio de webhooks y la firma obligatoriamente, no aceptes
     callbacks sin verificar.

## Pruebas Satifactorias (producción)

| Tarjeta                          | Resultado esperado (Stripe)      |
|----------------------------------|----------------------------------|
| `4242 4242 4242 4242`            | `payment_intent.succeeded`       |
| `4000 0000 0000 0002`            | `generic_declined`               |
| `4000 0000 0000 9995`            | `insufficient_funds`             |
| `4000 0000 0000 0069`            | `expired_card` (si futura fecha) |

*(Números de prueba de Stripe: doc oficial https://docs.stripe.com/testing)*
