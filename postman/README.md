# Postman — FoodStore SDC

Colección para probar los microservicios del backend (auth, shop, checkout, order, payment, notification) y el tracking en tiempo real por Socket.IO.

| Archivo | Contenido |
|---|---|
| `foodstore.postman_collection.json` | 44 requests en 11 folders, con tests que guardan tokens e ids |
| `foodstore-dev.postman_environment.json` | **dev**: servicios locales sobre LocalStack (`infra-delivery/local/up.sh`) |
| `foodstore-prd.postman_environment.json` | **prd**: API Gateway en AWS |
| `socket-tracking.js` | Cliente de prueba del tracking (Socket.IO) por línea de comandos |
| `build-collection.js` | Genera la colección y los environments (no editar los JSON a mano) |

## Importar

1. En Postman: **Import** → arrastra los tres `.json`.
2. Arriba a la derecha elige el environment: **FoodStore — dev (LocalStack)** o **FoodStore — prd (AWS)**.
3. Completa en el environment las variables marcadas como *secret*:
   - `internal_api_key`: el valor de `INTERNAL_API_KEY` de los servicios. En dev está en `backend-*/.env.local`. Solo lo usan los requests de **9. Administración**.
   - En **prd**, además: `api_base` (la URL del API Gateway, que es la salida `http_api_url` de Terraform) y `web_app_url`.

> Los environments del repo no traen secretos. Postman guarda tus valores localmente; **no vuelvas a exportarlos** al repo con secretos.

## Flujo

Ejecuta los folders en orden. También puedes correrlos con el **Collection Runner**.

| Folder | Qué hace | Guarda |
|---|---|---|
| 1. Catálogo | Lista categorías y productos | `category_id`, `product_id`, `product_name`, `product_price`, `product_image`, `store_id` |
| 2. Auth | Registro (con un correo nuevo cada vez), login, perfil, refresh, preferencias y recuperar contraseña | `user_email`, `access_token`, `refresh_token`, `user_id` |
| 3. Carrito | Agregar, cambiar cantidad, ver, quitar y vaciar (`/carts/me`) | — |
| 4. Repartidores | Crear, reportar ubicación, consultar | `courier_id` |
| 5. Órdenes | Tarifa y tipo de cambio, crear orden (montos del servidor), listar y estado | `order_id`, `order_total_usd`, `order_total_clp` |
| 6. Pagos | Crear el pago en PayPal y confirmarlo tras aprobar | `payment_id`, `paypal_token`, `paypal_approve_url` |
| 7. Dev: simular pago aprobado | **Solo dev.** Publica `PaymentApproved` en EventBridge de LocalStack y espera la asignación del repartidor | `order_status_delivery` |
| 8. Entrega | Confirmar entrega y verificar `DELIVERED` | — |
| 9. Administración | Crear categoría y producto (con imagen), listar usuarios, preferencias y pagos, asignar repartidor y cambiar estado | — |
| 10. Notificaciones | **Solo dev.** Simula el mensaje SQS que envía un correo | — |
| 11. Cerrar sesión | Logout y verificación de que el refresh queda revocado | — |

Autenticación:
- La colección usa `Bearer {{access_token}}`.
- Un script de la colección agrega `X-Client-Type: {{client_type}}`. Con `mobile`, el refresh token llega en el body; con `web`, va en una cookie HttpOnly.

### Pasos manuales

Estos tres requests necesitan un dato que llega fuera de Postman. En una corrida automática fallan con `400` hasta que completes el dato:

- **6. Pagos → Confirmar pago:**
  1. Abre `paypal_approve_url` (está en la consola de Postman y en el environment).
  2. Inicia sesión con una **cuenta compradora sandbox** (developer.paypal.com → Sandbox → Accounts).
  3. PayPal redirige a `successUrl?token=...&PayerID=...`. Copia `PayerID` en la variable `paypal_payer_id` y ejecuta el request.
- **2. Auth → Recuperar contraseña (verificar código / nueva contraseña):**
  1. Ejecuta "enviar código".
  2. En dev el correo no se envía; el código se lee de LocalStack:
     ```bash
     docker exec foodstore-localstack awslocal dynamodb scan --table-name Users \
       --filter-expression "email = :e" --expression-attribute-values '{":e":{"S":"<user_email>"}}' \
       --query "Items[0].verificationCode.S"
     ```
  3. Guárdalo en `verification_code` y ejecuta los dos requests siguientes.

En dev, el folder 7 reemplaza la aprobación de PayPal para probar la asignación del repartidor y el tracking sin intervención manual.

## Tracking en tiempo real (Socket.IO)

Postman no exporta requests Socket.IO en colecciones v2.1, así que la request se crea a mano. Hay dos formas de probarlo.

### Opción A — Postman

1. **New → Socket.IO**. URL: `{{socket_url}}` (en dev, `http://localhost:3004`).
2. Pestaña **Headers**: `Authorization` = `Bearer {{access_token}}`.
3. Pestaña **Events**: activa la escucha de `order.courier.assigned`, `order.tracking.updated` y `on-error`.
4. **Connect** y envía, con **Acknowledgement** activado:

| Evento a emitir | Payload | Respuesta (ack) |
|---|---|---|
| `order.tracking.join` | `{ "orderId": "{{order_id}}" }` | `{ "status": "ok" }`, o `{ "status": "error" }` si el token es inválido o la orden no es tuya |
| `order.tracking.update` | `{ "Data": { "Courier": { "orderId": "{{order_id}}", "courierId": "{{courier_id}}", "location": { "lat": -11.975, "lng": -77.076 } } } }` | `{ "status": "ok" }` |
| `order.tracking.leave` | `{ "orderId": "{{order_id}}" }` | — |

5. Con el socket unido, ejecuta **7. Dev: simular pago aprobado**: llegará `order.courier.assigned`. Cada `order.tracking.update` llega a la sala como `order.tracking.updated`.

### Opción B — script

Usa `socket.io-client` de `frontend-delivery/node_modules`:

```bash
# Escucha los eventos de una orden (token y order_id: los guarda la colección)
node postman/socket-tracking.js --token <access_token> --order <order_id>

# Además simula al repartidor enviando su ubicación cada 3 s
node postman/socket-tracking.js --token <access_token> --order <order_id> --simulate-courier <courier_id>

# Autenticando por header, como Postman
node postman/socket-tracking.js --token <access_token> --order <order_id> --auth-mode header
```

## Diferencias entre dev y prd

| | dev (LocalStack) | prd (AWS) |
|---|---|---|
| URLs | Un puerto por servicio (`localhost:3000` … `3005`) | `{{api_base}}/<servicio>` (API Gateway HTTP) |
| PayPal | Sandbox | Según `PAYPAL_ENV` del servicio |
| 7. Simular pago aprobado | ✅ (EventBridge de LocalStack) | ❌ (usa el flujo real de PayPal) |
| 10. Notificaciones | ✅ (endpoint de emulación) | ❌ (notification es una Lambda disparada por SQS, sin HTTP) |
| Socket.IO | ✅ `http://localhost:3004` | ❌ Lambda no mantiene WebSockets: requiere desplegar order en ECS o migrar a API Gateway WebSocket |

## Regenerar la colección

Al agregar o cambiar endpoints, edita `build-collection.js` y ejecuta:

```bash
node postman/build-collection.js
```
