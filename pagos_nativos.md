# Plan: Pagos Nativos en la App de Delivery

## Situación Actual

El flujo de pago actual funciona así:

```
[Checkout] → createPaypalPayment() → redirectUrl (PayPal web)
           → expo-web-browser abre la URL
           → Usuario paga en el navegador
           → Deep link de vuelta con token + PayerID
           → confirmPayment() → success/failure
```

### Problemas
- **Sin control de interfaz**: el usuario sale de la app y ve el UI de PayPal.
- **Experiencia rota**: en algunos dispositivos el deep link de vuelta falla.
- **No se pueden guardar métodos de pago**: PayPal no expone un vault de tarjetas de cliente controlado por nosotros.
- **No hay opción de contraentrega**.
- PayPal, Google Pay y Apple Pay están listados en la UI pero **solo PayPal está implementado** en el backend.

> ⚠️ **IMPORTANTE — No eliminar el flujo PayPal:**
> El código de PayPal (`createPaypalPayment`, `confirmPayment`, `WebBrowser`, deep links) **debe conservarse** y solo ocultarse en la UI. Será reutilizado en países donde Stripe no esté disponible (ej. Perú actualmente no soporta Stripe como pasarela registrada). La estrategia es **ocultar la opción PayPal** en el `PaymentMethod` component por país/feature flag, sin borrar la lógica subyacente.

---

## Solución Recomendada: Stripe

Stripe es la opción más completa para este caso porque:

| Característica                    | Stripe | PayPal (actual) |
|------------------------------------|--------|-----------------|
| SDK nativo para React Native       | ✅      | ❌               |
| Control total de UI                | ✅      | ❌               |
| Guardar tarjetas (Customer Vault)  | ✅      | Limitado        |
| Google Pay / Apple Pay nativos     | ✅      | ❌               |
| Contraentrega (sin cobro online)   | ✅      | ❌               |
| Webhooks para confirmar pagos      | ✅      | ✅               |

### 💰 ¿Stripe es de pago?

**No tiene costo mensual ni de suscripción.** Cobra una comisión por transacción exitosa:

| Tipo de pago         | Comisión                        |
|----------------------|---------------------------------|
| Tarjeta local        | **2.9% + $0.30** por transacción |
| Tarjeta internacional| ~3.9% + $0.30                   |
| Google Pay / Apple Pay| Igual que tarjeta (sin extra)  |
| Contraentrega        | **$0** (no hay cobro online)    |

> 📝 **Ejemplo:** Si alguien paga $10, Stripe retiene ~$0.59 y tú recibes ~$9.41.

**Comparación con PayPal actual:** PayPal también cobra (~3.49% + $0.49 por transacción), así que ya se están pagando comisiones. Stripe suele ser más barato y tiene mejor SDK nativo.

**Para desarrollo y pruebas:** Stripe tiene un **modo test gratuito e ilimitado** con tarjetas de prueba. Se puede integrar y probar todo sin costo hasta que la app esté en producción.

---

## Flujo Propuesto

### Tarjeta de crédito / débito (Stripe)

```
[Checkout] → POST /payments/stripe/create-intent
           ← { clientSecret }
           → Stripe.confirmPayment(clientSecret, cardDetails)
           → success/failure en la misma app
           → POST /payments/stripe/confirm (webhook o manual)
```

### Contraentrega

```
[Checkout] → POST /orders/cash-on-delivery
           ← { orderId, status: "pending_delivery" }
           → Navega directo a /payment/success
           (sin cobro online, el pago ocurre cuando llega el pedido)
```

### Tarjeta guardada (Stripe Customer)

```
[Primera vez] → usuario ingresa tarjeta → Stripe guarda en su vault
             ← { stripeCustomerId, paymentMethodId } guardado en backend

[Siguiente vez] → GET /user/payment-methods
              ← lista de tarjetas guardadas (últimos 4 dígitos, marca)
              → usuario selecciona → confirmPayment con paymentMethodId guardado
```

---

## Cambios en el Frontend

### Dependencia a instalar

```bash
npx expo install @stripe/stripe-react-native
```

### Archivos a modificar / crear

#### [MODIFY] `checkout-store.ts`
- Agregar `"cash-on-delivery"` al tipo `PaymentMethod`.
- Agregar campo `selectedSavedCardId?: string`.

#### [MODIFY] `payment-method.tsx`
- Agregar opción **Contraentrega** con ícono de efectivo.
- Agregar sección "Tarjetas guardadas" que carga del backend.
- El botón de Stripe Card Sheet se abre solo al seleccionar "Credit Card" sin tarjeta guardada.

#### [MODIFY] `use-checkout-flow.ts`
- Si `paymentMethod === "cash-on-delivery"` → llamar endpoint de contraentrega y navegar a success directamente.
- Si `paymentMethod === "credit-card"` → llamar `POST /payments/stripe/create-intent`, luego `stripe.confirmPayment()`.
- Eliminar la lógica de `WebBrowser` y deep links.

#### [MODIFY] `payment.service.ts`
- Agregar `createStripeIntent()` → `POST /payments/stripe/create-intent`.
- Agregar `getSavedPaymentMethods()` → `GET /user/payment-methods`.
- Mantener PayPal por compatibilidad o marcarlo como deprecated.

#### [MODIFY] `payment.ts` (types)
- Agregar `CreateStripeIntentPayload`, `CreateStripeIntentResponse`.
- Agregar `SavedPaymentMethod` (id, brand, last4, expMonth, expYear).

#### [NEW] `hooks/payment/use-stripe-payment.ts`
- Encapsula `useStripe()`, `confirmPayment()`, manejo de errores de Stripe.

#### [NEW] `hooks/payment/use-saved-cards.ts`
- Carga las tarjetas guardadas del usuario desde el backend.

#### [NEW] `components/payment/saved-card-item.tsx`
- Muestra una tarjeta guardada (ícono de marca, •••• 4242, fecha exp.).

#### [MODIFY] `app/(stack)/payment/processing.tsx`
- Puede eliminarse o reutilizarse como pantalla de espera mientras Stripe procesa.

---

## Endpoints Backend Requeridos

> ⚠️ **IMPORTANTE:** El frontend ya está implementado. Solo falta que el backend responda a estas rutas para que el flujo funcione.

---

### 0. Dependencia: Instalar Stripe en el servidor

```bash
npm install stripe
```

Variables de entorno necesarias en el servidor:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # se obtiene al registrar el webhook en Stripe Dashboard
```

---

### 1. `POST /payment/stripe/create-intent` 🔴 PRIORIDAD ALTA

**Llamado desde:** `PaymentService.createStripeIntent()`  
**Cuándo:** Al presionar "Pay now" con Credit Card o Google Pay.

```
Request:
{
  "Data": {
    "Payment": {
      "orderId": "uuid",
      "amount": 7.50,
      "currency": "USD",
      "customerId": "cus_xxx"   // opcional, si el usuario tiene stripeCustomerId
    }
  }
}

Response:
{
  "Data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx"
  }
}
```

**Lógica en el servidor:**
```js
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(amount * 100),  // Stripe trabaja en centavos
  currency: currency.toLowerCase(),
  customer: customerId,              // opcional
  setup_future_usage: 'off_session', // para guardar la tarjeta
});
return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };
```

---

### 2. `POST /payment/stripe/webhook` 🔴 PRIORIDAD ALTA

**Cuándo:** Stripe llama a este endpoint cuando el pago es confirmado.  
**No es llamado por el frontend** — es llamado directamente por Stripe.

```
Header: Stripe-Signature: t=...,v1=...

Body: (raw, no JSON parseado)
```

**Lógica:**
```js
const event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);

if (event.type === 'payment_intent.succeeded') {
  const paymentIntent = event.data.object;
  // Actualizar orden a estado "paid" usando paymentIntent.metadata.orderId
  // Guardar paymentMethodId en el usuario si setup_future_usage fue usado
}
```

> 🔴 **No confirmes el pago solo desde el frontend.** Este webhook es la única fuente de verdad.

---

### 3. `POST /payment/cash-on-delivery` 🟡 PRIORIDAD MEDIA

**Llamado desde:** `useCheckoutFlow` cuando `paymentMethod === "cash-on-delivery"`.  
**Cuándo:** Usuario elige pagar al recibir el pedido.

```
Request:
{
  "Data": {
    "orderId": "uuid",
    "lat": -12.046374,
    "lng": -77.042793
  }
}

Response:
{
  "Data": {
    "orderId": "uuid",
    "status": "pending_delivery"
  }
}
```

**Lógica:** Crear la orden sin cobro. El estado inicial es `pending_delivery`. El delivery lo marca como pagado al entregar.

---

### 4. `GET /payment/user/payment-methods` 🟢 PRIORIDAD BAJA

**Llamado desde:** `PaymentService.getSavedPaymentMethods()`  
**Cuándo:** Al cargar la pantalla de Checkout para mostrar tarjetas guardadas.

```
Response:
{
  "Data": {
    "paymentMethods": [
      {
        "id": "pm_xxx",
        "brand": "visa",
        "last4": "4242",
        "expMonth": 12,
        "expYear": 2027
      }
    ]
  }
}
```

**Lógica:**
```js
const methods = await stripe.paymentMethods.list({
  customer: user.stripeCustomerId,
  type: 'card',
});
```

---

### 5. `DELETE /payment/user/payment-methods/:paymentMethodId` 🟢 PRIORIDAD BAJA

**Llamado desde:** `PaymentService.deleteSavedPaymentMethod(id)`  
**Cuándo:** Usuario elimina una tarjeta guardada.

```
Response: 204 No Content
```

**Lógica:**
```js
await stripe.paymentMethods.detach(paymentMethodId);
```

---

### 6. Campo en la BD: `stripe_customer_id` 🟡 PRIORIDAD MEDIA

```sql
ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255);
```

Al primer pago con Stripe, crear el Customer y guardar el ID:
```js
const customer = await stripe.customers.create({ email: user.email });
await db.users.update({ stripeCustomerId: customer.id }, { where: { id: userId } });
```

---

## Resumen de Prioridades

| # | Endpoint / Tarea                              | Estado    | Dónde   |
|---|-----------------------------------------------|-----------|---------|
| 1 | `POST /payment/stripe/create-intent`          | ⏳ Pendiente | Backend |
| 2 | `POST /payment/stripe/webhook`                | ⏳ Pendiente | Backend |
| 3 | `POST /payment/cash-on-delivery`              | ⏳ Pendiente | Backend |
| 4 | Campo `stripe_customer_id` en tabla `users`   | ⏳ Pendiente | BD      |
| 5 | `GET /payment/user/payment-methods`           | ⏳ Pendiente | Backend |
| 6 | `DELETE /payment/user/payment-methods/:id`    | ⏳ Pendiente | Backend |
| — | `StripeProvider` en layout                    | ✅ Hecho   | Frontend |
| — | `use-stripe-payment.ts`                       | ✅ Hecho   | Frontend |
| — | Opción contraentrega en UI                    | ✅ Hecho   | Frontend |
| — | PayPal preservado (comentado en UI)           | ✅ Hecho   | Frontend |
