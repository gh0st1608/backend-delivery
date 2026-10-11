// Genera la colección Postman (v2.1) y los environments dev / prd de FoodStore.
// Uso: node postman/build-collection.js   (escribe los JSON en esta misma carpeta)
// Para agregar o cambiar endpoints edita este archivo y vuelve a generar: así la
// colección y los environments no se editan a mano y quedan consistentes.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUT = process.argv[2] || __dirname;
const uid = (seed) => crypto.createHash('md5').update(seed).digest('hex').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12}).*/, '$1-$2-$3-$4-$5');

// ---------------------------------------------------------------- helpers
const script = (lines) => (Array.isArray(lines) ? lines : lines.split('\n'));
const test = (lines) => ({ listen: 'test', script: { type: 'text/javascript', exec: script(lines) } });
const pre = (lines) => ({ listen: 'prerequest', script: { type: 'text/javascript', exec: script(lines) } });

const expect = (codes) => `pm.test('HTTP ${codes.join(' o ')}', () => pm.expect(pm.response.code).to.be.oneOf([${codes.join(', ')}]));`;

function req(name, method, base, urlPath, opts = {}) {
  const { auth = 'bearer', body, query = [], tests = [], prerequest, description, codes = [200, 201] } = opts;
  const headers = [];
  if (body !== undefined) headers.push({ key: 'Content-Type', value: 'application/json' });
  if (auth === 'admin') headers.push({ key: 'X-Internal-Api-Key', value: '{{internal_api_key}}' });

  const pathParts = urlPath.split('/').filter(Boolean);
  const raw = `{{${base}}}${pathParts.length ? '/' + pathParts.join('/') : ''}${query.length ? '?' + query.map((q) => `${q.key}=${q.value}`).join('&') : ''}`;

  const item = {
    name,
    event: [test([expect(codes), ...tests]), ...(prerequest ? [pre(prerequest)] : [])],
    request: {
      method,
      header: headers,
      url: { raw, host: [`{{${base}}}`], path: pathParts, ...(query.length ? { query } : {}) },
      ...(description ? { description } : {}),
    },
  };
  if (auth === 'none' || auth === 'admin') item.request.auth = { type: 'noauth' };
  if (body !== undefined) {
    item.request.body = { mode: 'raw', raw: typeof body === 'string' ? body : JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } };
  }
  return item;
}

const folder = (name, description, item) => ({ name, description, item });

// Snippets de tests reutilizables
const data = 'const d = pm.response.json().Data || {};';
const saveTokens = [
  data,
  "if (d.Auth) {",
  "  pm.environment.set('access_token', d.Auth.accessToken);",
  "  if (d.Auth.refreshToken) pm.environment.set('refresh_token', d.Auth.refreshToken);",
  "  pm.test('Devuelve access token', () => pm.expect(d.Auth.accessToken).to.be.a('string'));",
  "}",
];
const idOf = (obj, key) => `(${obj} && (${obj}.${key} || ${obj}.id || (typeof ${obj} === 'string' ? ${obj} : undefined)))`;

// ------------------------------------------------------------- requests
const auth = folder('2. Auth', 'Registro, sesión (RS256 + refresh rotativo) y perfil. Los requests de este folder guardan `access_token` y `refresh_token` en el environment.', [
  req('Registrar usuario', 'POST', 'auth_url', '/register', {
    auth: 'none',
    codes: [201],
    body: { Data: { User: { name: 'Usuario Demo', email: '{{user_email}}', password: '{{password}}' } } },
    prerequest: [
      "// Un correo nuevo en cada ejecución para poder registrar varias veces",
      "pm.environment.set('user_email', `demo+${Date.now()}@foodstore.local`);",
      "if (!pm.environment.get('password')) pm.environment.set('password', 'Demo12345!');",
    ],
    tests: saveTokens,
  }),
  req('Iniciar sesión', 'POST', 'auth_url', '/login', {
    auth: 'none',
    codes: [200],
    body: { Data: { Auth: { authType: 'password', email: '{{user_email}}', password: '{{password}}' } } },
    tests: saveTokens,
  }),
  req('Mi perfil (me)', 'GET', 'auth_url', '/me', {
    codes: [200],
    tests: [data, "const u = d.user || d.User || d;", "pm.environment.set('user_id', u.userId);", "pm.test('No expone la contraseña', () => pm.expect(u).to.not.have.property('password'));"],
  }),
  req('Renovar sesión (refresh)', 'POST', 'auth_url', '/refresh', {
    auth: 'none',
    codes: [200],
    description: 'Rota el refresh token: el anterior queda inválido y reusarlo revoca toda la sesión. En web el refresh token viaja en la cookie HttpOnly (`X-Client-Type: web`).',
    body: { Data: { Auth: { refreshToken: '{{refresh_token}}' } } },
    tests: saveTokens,
  }),
  req('Guardar preferencias', 'POST', 'auth_url', '/preferences', {
    codes: [200, 201],
    description: 'El usuario sale del access token. Requiere `category_id` (folder Catálogo).',
    body: { Data: { Preference: { categoryIds: ['{{category_id}}'] } } },
  }),
  req('Usuario por id (solo el propio)', 'GET', 'auth_url', '/users/{{user_id}}', { codes: [200] }),
  req('Recuperar contraseña: enviar código', 'POST', 'auth_url', '/verify-email', {
    auth: 'none',
    codes: [200, 201],
    description: 'Envía un código de 4 dígitos por correo. En dev no hay envío real: el código se lee de la tabla Users en LocalStack (ver README).',
    body: { Data: { User: { email: '{{user_email}}' } } },
  }),
  req('Recuperar contraseña: verificar código', 'POST', 'auth_url', '/verify-code', {
    auth: 'none',
    codes: [200, 201],
    body: { Data: { User: { email: '{{user_email}}', code: '{{verification_code}}' } } },
  }),
  req('Recuperar contraseña: nueva contraseña', 'POST', 'auth_url', '/set-password', {
    auth: 'none',
    codes: [200, 201],
    description: 'Exige el mismo código; queda invalidado al cambiar la contraseña.',
    body: { Data: { User: { email: '{{user_email}}', password: '{{password}}', code: '{{verification_code}}' } } },
  }),
]);

const shop = folder('1. Catálogo (shop)', 'Lectura pública del catálogo. Guarda `category_id`, `product_id`, `product_name`, `product_price`, `product_image` y `store_id` para los siguientes requests.', [
  req('Listar categorías', 'GET', 'shop_url', '/categories', {
    auth: 'none', codes: [200], query: [{ key: 'limit', value: '20' }],
    tests: [data, "const c = (d.items || [])[0];", "if (c) pm.environment.set('category_id', c.categoryId);", "pm.test('Hay categorías', () => pm.expect((d.items || []).length).to.be.above(0));"],
  }),
  req('Listar productos', 'GET', 'shop_url', '/products', {
    auth: 'none', codes: [200], query: [{ key: 'limit', value: '20' }],
    tests: [
      data,
      "const p = (d.items || [])[0];",
      "if (p) {",
      "  pm.environment.set('product_id', p.productId);",
      "  pm.environment.set('product_name', p.name);",
      "  pm.environment.set('product_price', p.price);",
      "  pm.environment.set('product_image', p.image || '');",
      "  pm.environment.set('store_id', p.storeId);",
      "}",
      "pm.test('Hay productos', () => pm.expect((d.items || []).length).to.be.above(0));",
    ],
  }),
  req('Producto por id', 'GET', 'shop_url', '/products/{{product_id}}', { auth: 'none', codes: [200] }),
  req('Ubicación de la tienda', 'GET', 'shop_url', '/stores/{{store_id}}/location', { auth: 'none', codes: [200] }),
]);

const cart = folder('3. Carrito (checkout)', 'Siempre el carrito del usuario del token (`/carts/me`).', [
  req('Agregar producto', 'POST', 'checkout_url', '/carts/me/items', {
    codes: [200, 201],
    body: `{\n  "Data": {\n    "Cart": {\n      "productId": "{{product_id}}",\n      "name": "{{product_name}}",\n      "price": {{product_price}},\n      "quantity": 1,\n      "storeId": "{{store_id}}",\n      "image": "{{product_image}}"\n    }\n  }\n}`,
  }),
  req('Cambiar cantidad', 'PATCH', 'checkout_url', '/carts/me/items/{{product_id}}', {
    codes: [200], description: 'quantity = 0 elimina el producto del carrito.',
    body: { Data: { Cart: { quantity: 2 } } },
  }),
  req('Ver mi carrito', 'GET', 'checkout_url', '/carts/me', {
    codes: [200], tests: [data, "pm.test('Total en CLP', () => pm.expect(d.cart.total).to.be.a('number'));"],
  }),
  req('Quitar producto', 'DELETE', 'checkout_url', '/carts/me/items/{{product_id}}', { codes: [200] }),
  req('Vaciar carrito', 'DELETE', 'checkout_url', '/carts/me', { codes: [200, 400, 404] }),
]);

const courier = folder('4. Repartidores (courier)', 'Alta y presencia de repartidores (backend-order). Guarda `courier_id`.', [
  req('Crear repartidor', 'POST', 'courier_url', '', {
    auth: 'none', codes: [200, 201],
    body: { Data: { Courier: { name: 'Repartidor Postman', phone: '+56900000001', vehicleType: 'MOTO', status: 'AVAILABLE' } } },
    tests: [data, `pm.environment.set('courier_id', ${idOf('d.courier', 'courierId')});`],
  }),
  req('Reportar ubicación (presencia)', 'PATCH', 'courier_url', '/{{courier_id}}/presence', {
    auth: 'none', codes: [200],
    description: 'Para la asignación automática el repartidor debe reportar hace < 120 s y estar a < 10 km de la tienda (Lima en los datos de prueba).',
    body: { Data: { Courier: { status: 'AVAILABLE', location: { lat: -11.98, lng: -77.082 } } } },
  }),
  req('Repartidor por id', 'GET', 'courier_url', '/{{courier_id}}', { auth: 'none', codes: [200] }),
  req('Listar repartidores', 'GET', 'courier_url', '', { auth: 'none', codes: [200], query: [{ key: 'limit', value: '20' }] }),
]);

const orders = folder('5. Órdenes (order)', 'Montos en CLP calculados por el servidor con precios del catálogo y USD congelado al crear la orden. Guarda `order_id`, `order_total_usd` y `order_total_clp`.', [
  req('Tarifa de envío y tipo de cambio', 'GET', 'order_url', '/pricing', { codes: [200] }),
  req('Crear orden', 'POST', 'order_url', '', {
    codes: [200, 201],
    description: 'Solo productId y quantity: nombre, precio y usuario los resuelve el backend.',
    body: { Data: { Order: { storeId: '{{store_id}}', deliveryLat: -11.97, deliveryLng: -77.07, items: [{ productId: '{{product_id}}', quantity: 2 }] } } },
    tests: [
      data,
      "const o = d.order || {};",
      "pm.environment.set('order_id', o.orderId);",
      "pm.environment.set('order_total_usd', o.totalUsd);",
      "pm.environment.set('order_total_clp', o.totalClp);",
      "pm.test('Totales CLP y USD', () => { pm.expect(o.totalClp).to.be.a('number'); pm.expect(o.totalUsd).to.be.a('number'); });",
    ],
  }),
  req('Mis órdenes', 'GET', 'order_url', '', { codes: [200], query: [{ key: 'limit', value: '10' }] }),
  req('Orden por id', 'GET', 'order_url', '/{{order_id}}', { codes: [200] }),
  req('Estado de la entrega', 'GET', 'order_url', '/{{order_id}}/status-delivery', {
    codes: [200], tests: [data, "pm.environment.set('order_status_delivery', d.order && d.order.statusDelivery);"],
  }),
]);

const payments = folder('6. Pagos (payment)', 'PayPal (sandbox en dev). El monto sale de la orden; el cliente no lo envía.', [
  req('Crear pago PayPal', 'POST', 'payment_url', '/paypal', {
    codes: [200, 201],
    description: 'Abre `paypal_approve_url` en el navegador e inicia sesión con una cuenta compradora sandbox. PayPal redirige a successUrl con `token` y `PayerID`: copia PayerID en la variable `paypal_payer_id` y ejecuta "Confirmar pago".',
    body: { Data: { Payment: { orderId: '{{order_id}}', provider: 'Paypal', successUrl: '{{paypal_success_url}}', cancelUrl: '{{paypal_cancel_url}}' } } },
    tests: [
      data,
      "const p = d.payment || {};",
      "pm.environment.set('payment_id', p.paymentId);",
      "pm.environment.set('paypal_token', p.providerOrderId);",
      "pm.environment.set('paypal_approve_url', p.redirectUrl);",
      "console.log('Aprobar en PayPal:', p.redirectUrl);",
    ],
  }),
  req('Confirmar pago (tras aprobar en PayPal)', 'POST', 'payment_url', '/confirm', {
    codes: [200, 201],
    description: 'Captura el pago y publica PaymentApproved: order marca la orden como PAID y asigna repartidor. Es idempotente.',
    body: { Data: { Payment: { token: '{{paypal_token}}', PayerID: '{{paypal_payer_id}}', provider: 'Paypal' } } },
  }),
]);

const devSim = folder('7. Dev: simular pago aprobado (LocalStack)', 'Solo en el environment **dev**. Publica `PaymentApproved` directamente en EventBridge de LocalStack (firma AWS SigV4 con credenciales `test`), como si PayPal hubiera capturado el pago. Sirve para probar la asignación de repartidor y el tracking sin aprobar en PayPal.', [
  {
    ...req('Publicar PaymentApproved en EventBridge', 'POST', 'localstack_url', '', {
      auth: 'none', codes: [200],
      body: '{}',
      prerequest: [
        "if (!pm.environment.get('localstack_url')) throw new Error('Solo disponible en el environment dev (LocalStack)');",
        "const detail = {",
        "  type: 'PaymentApproved',",
        "  payload: {",
        "    paymentId: pm.environment.get('payment_id') || `sim-${Date.now()}`,",
        "    orderId: pm.environment.get('order_id'),",
        "    userId: pm.environment.get('user_id'),",
        "    provider: 'PAYPAL',",
        "    amountUsd: Number(pm.environment.get('order_total_usd')),",
        "    amountClp: Number(pm.environment.get('order_total_clp')),",
        "  },",
        "};",
        "pm.request.body.update(JSON.stringify({ Entries: [{ EventBusName: 'foodstore-events', Source: 'payment-service', DetailType: 'PaymentApproved', Detail: JSON.stringify(detail) }] }));",
      ],
      tests: ["pm.test('Sin entradas fallidas', () => pm.expect(pm.response.json().FailedEntryCount).to.eql(0));"],
    }),
    request: {
      method: 'POST',
      header: [
        { key: 'Content-Type', value: 'application/x-amz-json-1.1' },
        { key: 'X-Amz-Target', value: 'AWSEvents.PutEvents' },
      ],
      url: { raw: '{{localstack_url}}/', host: ['{{localstack_url}}'], path: [''] },
      body: { mode: 'raw', raw: '{}' },
      auth: {
        type: 'awsv4',
        awsv4: [
          { key: 'accessKey', value: 'test', type: 'string' },
          { key: 'secretKey', value: 'test', type: 'string' },
          { key: 'region', value: 'us-east-1', type: 'string' },
          { key: 'service', value: 'events', type: 'string' },
        ],
      },
    },
  },
  req('Esperar asignación de repartidor', 'GET', 'order_url', '/{{order_id}}/status-delivery', {
    codes: [200],
    description: 'order consume el evento desde SQS y asigna al repartidor disponible más cercano. Reintenta hasta ver ASSIGNED.',
    prerequest: ["// Pequeña espera para que el poller de SQS procese el evento", "setTimeout(() => {}, 3000);"],
    tests: [
      data,
      "const s = d.order && d.order.statusDelivery;",
      "pm.environment.set('order_status_delivery', s);",
      "const tries = Number(pm.environment.get('assign_tries') || 0);",
      "if (s !== 'ASSIGNED' && tries < 10) {",
      "  pm.environment.set('assign_tries', tries + 1);",
      "  if (pm.execution && pm.execution.setNextRequest) pm.execution.setNextRequest(pm.info.requestName); else postman.setNextRequest(pm.info.requestName);",
      "} else {",
      "  pm.environment.unset('assign_tries');",
      "  pm.test('Repartidor asignado', () => pm.expect(s).to.eql('ASSIGNED'));",
      "}",
    ],
  }),
]);

const delivery = folder('8. Entrega', 'El cliente confirma que recibió el pedido.', [
  req('Confirmar entrega', 'PATCH', 'order_url', '/{{order_id}}/confirm-delivery', { codes: [200] }),
  req('Estado final', 'GET', 'order_url', '/{{order_id}}/status-delivery', {
    codes: [200], tests: [data, "pm.test('Entregado', () => pm.expect(d.order.statusDelivery).to.eql('DELIVERED'));"],
  }),
]);

const admin = folder('9. Administración (X-Internal-Api-Key)', 'Endpoints de operación protegidos con la clave interna (`internal_api_key`, la misma `INTERNAL_API_KEY` de los servicios) hasta que exista la plataforma de administración con roles.', [
  req('Crear categoría', 'POST', 'shop_url', '/categories', {
    auth: 'admin', codes: [200, 201],
    body: { Data: { Category: { name: 'Postres', description: 'Postres caseros', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600' } } },
    tests: [data, `pm.environment.set('category_id', ${idOf('d.category', 'categoryId')});`],
  }),
  req('Crear producto', 'POST', 'shop_url', '/products', {
    auth: 'admin', codes: [200, 201],
    body: { Data: { Product: { name: 'Torta de chocolate', description: 'Porción individual', categoryId: '{{category_id}}', storeId: '{{store_id}}', price: 3990, currency: 'CLP', stock: 20, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600', ingredients: [] } } },
    tests: [data, `pm.environment.set('admin_product_id', ${idOf('d.product', 'productId')});`],
  }),
  req('Listar usuarios', 'GET', 'auth_url', '/users', { auth: 'admin', codes: [200], query: [{ key: 'limit', value: '10' }] }),
  req('Listar preferencias', 'GET', 'auth_url', '/preferences', { auth: 'admin', codes: [200], query: [{ key: 'limit', value: '10' }] }),
  req('Asignar repartidor manualmente', 'POST', 'order_url', '/{{order_id}}/assign/{{courier_id}}', { auth: 'admin', codes: [200, 201, 400, 409] }),
  req('Cambiar estado de entrega', 'PATCH', 'order_url', '/{{order_id}}/status', {
    auth: 'admin', codes: [200, 400],
    description: 'statusDelivery: ASSIGNED | PREPARING | PICKED_UP | ON_THE_WAY | DELIVERED | CANCELED',
    body: { Data: { Order: { statusDelivery: 'PICKED_UP' } } },
  }),
  req('Registrar pago manual', 'POST', 'payment_url', '', {
    auth: 'admin', codes: [200, 201],
    body: { Data: { Payment: { orderId: '{{order_id}}', amount: 10, currency: 'USD', provider: 'Paypal', providerOrderId: 'manual-{{$timestamp}}' } } },
  }),
  req('Listar pagos', 'GET', 'payment_url', '', { auth: 'admin', codes: [200], query: [{ key: 'limit', value: '10' }] }),
]);

const notification = folder('10. Notificaciones (solo dev)', 'backend-notification no expone HTTP en AWS (es una Lambda disparada por SQS). En local este endpoint simula el mensaje SQS para probar el envío por SES (LocalStack).', [
  req('Simular correo (evento SQS)', 'POST', 'notification_url', '/send-email', {
    auth: 'none', codes: [200, 201],
    body: { detail: { name: 'EmailVerificationRequested', payload: { email: '{{user_email}}', subject: 'Prueba desde Postman', message: 'Hola desde FoodStore' } } },
  }),
]);

const logout = folder('11. Cerrar sesión', 'Revoca toda la sesión en el servidor.', [
  req('Cerrar sesión (logout)', 'POST', 'auth_url', '/logout', {
    auth: 'none', codes: [200],
    body: { Data: { Auth: { refreshToken: '{{refresh_token}}' } } },
    tests: ["pm.environment.unset('access_token');", "pm.environment.unset('refresh_token');"],
  }),
  req('Refresh tras logout (debe fallar)', 'POST', 'auth_url', '/refresh', {
    auth: 'none', codes: [401],
    body: { Data: { Auth: { refreshToken: '{{refresh_token}}' } } },
  }),
]);

const collection = {
  info: {
    _postman_id: uid('foodstore-collection'),
    name: 'FoodStore SDC — Backend',
    description: [
      'Microservicios de FoodStore (auth, shop, checkout, order, payment, notification).',
      '',
      '**Environments**: `FoodStore — dev (LocalStack)` y `FoodStore — prd (AWS)`.',
      '',
      '**Flujo**: ejecuta los folders en orden (1 → 8). Los tests guardan tokens e ids en el environment.',
      'En dev, el folder 7 simula la aprobación del pago; en prd usa "6. Pagos → Confirmar pago" tras aprobar en PayPal.',
      '',
      '**Autenticación**: Bearer `{{access_token}}` a nivel de colección. Los endpoints de administración usan `X-Internal-Api-Key: {{internal_api_key}}`.',
      '',
      '**Socket.IO (tracking)**: Postman no exporta requests Socket.IO en colecciones v2.1. Ver `postman/README.md`.',
    ].join('\n'),
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{access_token}}', type: 'string' }] },
  event: [
    pre([
      "// La app identifica el tipo de cliente: web recibe el refresh token en cookie HttpOnly",
      "pm.request.headers.upsert({ key: 'X-Client-Type', value: pm.environment.get('client_type') || 'mobile' });",
    ]),
  ],
  item: [shop, auth, cart, courier, orders, payments, devSim, delivery, admin, notification, logout],
};

// ---------------------------------------------------------- environments
const runtime = ['access_token', 'refresh_token', 'user_email', 'user_id', 'verification_code', 'category_id', 'product_id', 'product_name', 'product_price', 'product_image', 'store_id', 'courier_id', 'order_id', 'order_total_usd', 'order_total_clp', 'order_status_delivery', 'payment_id', 'paypal_token', 'paypal_approve_url', 'paypal_payer_id', 'admin_product_id'];
const secret = new Set(['access_token', 'refresh_token', 'internal_api_key', 'password']);

const env = (name, values) => ({
  id: uid(name),
  name,
  values: [
    ...Object.entries(values).map(([key, value]) => ({ key, value, type: secret.has(key) ? 'secret' : 'default', enabled: true })),
    ...runtime.filter((k) => !(k in values)).map((key) => ({ key, value: '', type: secret.has(key) ? 'secret' : 'default', enabled: true })),
  ],
  _postman_variable_scope: 'environment',
});

const dev = env('FoodStore — dev (LocalStack)', {
  auth_url: 'http://localhost:3000/auth',
  notification_url: 'http://localhost:3001/notification',
  shop_url: 'http://localhost:3002/shop',
  checkout_url: 'http://localhost:3003/checkout',
  order_url: 'http://localhost:3004/order',
  courier_url: 'http://localhost:3004/courier',
  payment_url: 'http://localhost:3005/payment',
  socket_url: 'http://localhost:3004',
  localstack_url: 'http://localhost:4566',
  client_type: 'mobile',
  internal_api_key: '',
  password: 'Demo12345!',
  paypal_success_url: 'http://localhost:8081/payment/success',
  paypal_cancel_url: 'http://localhost:8081/payment/failure',
});

const prd = env('FoodStore — prd (AWS)', {
  api_base: 'https://<api-id>.execute-api.us-east-1.amazonaws.com',
  auth_url: '{{api_base}}/auth',
  notification_url: '',
  shop_url: '{{api_base}}/shop',
  checkout_url: '{{api_base}}/checkout',
  order_url: '{{api_base}}/order',
  courier_url: '{{api_base}}/courier',
  payment_url: '{{api_base}}/payment',
  socket_url: '',
  localstack_url: '',
  client_type: 'mobile',
  internal_api_key: '',
  password: '',
  web_app_url: 'https://<dominio-de-la-app>',
  paypal_success_url: '{{web_app_url}}/payment/success',
  paypal_cancel_url: '{{web_app_url}}/payment/failure',
});

fs.mkdirSync(OUT, { recursive: true });
const write = (file, obj) => fs.writeFileSync(path.join(OUT, file), JSON.stringify(obj, null, 2) + '\n');
write('foodstore.postman_collection.json', collection);
write('foodstore-dev.postman_environment.json', dev);
write('foodstore-prd.postman_environment.json', prd);

const count = (items) => items.reduce((n, i) => n + (i.item ? count(i.item) : 1), 0);
console.log(`Colección: ${count(collection.item)} requests en ${collection.item.length} folders → ${OUT}`);
