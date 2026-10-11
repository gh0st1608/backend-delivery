// Prueba E2E del backend local con las mismas llamadas que hace la app móvil:
// registro, carrito, orden, pago PayPal (sandbox), PaymentApproved simulado,
// asignación de repartidor, entrega y seguridad de la sesión.
//
// Uso: node e2e.js <backendDir>
const path = require('path');
const ROOT = process.argv[2] ?? path.resolve(__dirname, '../../..');
const U = {
  auth: 'http://localhost:3000/auth',
  shop: 'http://localhost:3002/shop',
  checkout: 'http://localhost:3003/checkout',
  order: 'http://localhost:3004/order',
  payment: 'http://localhost:3005/payment',
};

let accessToken = null;
let failures = 0;
const ok = (cond, msg, extra = '') => {
  console.log(`${cond ? 'OK   ' : 'FALLO'} ${msg}${extra ? ` — ${extra}` : ''}`);
  if (!cond) failures++;
  return cond;
};

async function call(method, url, data, { auth = true } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Type': 'mobile',
      ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: data === undefined ? undefined : JSON.stringify({ Data: data }),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json.Data, error: json.Error ?? (res.ok ? null : json) };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // 1. Registro y sesión ------------------------------------------------
  const email = `demo+${Date.now()}@foodstore.local`;
  const reg = await call('POST', `${U.auth}/register`, { User: { name: 'Demo', email, password: 'Demo12345!' } }, { auth: false });
  ok(reg.status < 300 && reg.data?.Auth?.accessToken, 'registro devuelve access + refresh token', reg.error?.message);
  accessToken = reg.data?.Auth?.accessToken;
  const refresh1 = reg.data?.Auth?.refreshToken;

  const me = await call('GET', `${U.auth}/me`);
  const user = me.data?.user ?? me.data?.User ?? me.data;
  ok(me.status === 200 && user?.userId && !('password' in user), 'perfil /me sin exponer el hash de la contraseña');

  // 2. Onboarding -------------------------------------------------------
  const cats = await call('GET', `${U.shop}/categories?limit=10`);
  const categoryId = cats.data?.items?.[0]?.categoryId;
  const pref = await call('POST', `${U.auth}/preferences`, { Preference: { categoryIds: [categoryId] } });
  ok(pref.status < 300, 'preferencias guardadas para el usuario del token', pref.error?.message);

  // 3. Catálogo, precios y carrito -------------------------------------
  const products = (await call('GET', `${U.shop}/products?limit=20`)).data?.items ?? [];
  const burger = products.find((p) => p.name === 'Hamburguesa clásica');
  const drink = products.find((p) => p.name === 'Limonada');
  ok(burger && drink, `catálogo con ${products.length} productos`);

  const pricing = (await call('GET', `${U.order}/pricing`)).data?.pricing;
  ok(pricing?.deliveryFeeClp > 0 && pricing?.exchangeRateUsdClp > 0, 'tarifa de envío y tipo de cambio',
    `envío ${pricing?.deliveryFeeClp} CLP, 1 USD = ${pricing?.exchangeRateUsdClp} CLP (${pricing?.exchangeRateSource})`);

  for (const [p, q] of [[burger, 1], [drink, 1]]) {
    const r = await call('POST', `${U.checkout}/carts/me/items`, { Cart: { productId: p.productId, name: p.name, price: p.price, quantity: q, storeId: p.storeId, image: p.image } });
    ok(r.status < 300, `carrito: agrega ${p.name}`, r.error?.message);
  }
  const upd = await call('PATCH', `${U.checkout}/carts/me/items/${burger.productId}`, { Cart: { quantity: 2 } });
  ok(upd.status < 300, 'carrito: cambia cantidad a 2', upd.error?.message);
  const cart = (await call('GET', `${U.checkout}/carts/me`)).data?.cart;
  const expected = burger.price * 2 + drink.price;
  ok(cart?.total === expected, 'carrito persistido por usuario', `total ${cart?.total} CLP`);

  // 4. Orden con montos del servidor ------------------------------------
  const created = await call('POST', `${U.order}`, {
    Order: {
      storeId: burger.storeId, deliveryLat: -11.9700, deliveryLng: -77.0700,
      items: [{ productId: burger.productId, quantity: 2 }, { productId: drink.productId, quantity: 1 }],
    },
  });
  const order = created.data?.order;
  ok(order?.orderId && order.subtotalClp === expected, 'orden creada con precios del catálogo',
    order ? `subtotal ${order.subtotalClp} + envío ${order.deliveryFeeClp} = ${order.totalClp} CLP ≈ ${order.totalUsd} USD` : created.error?.message);

  // 5. Pago PayPal (sandbox) -------------------------------------------
  const pay = await call('POST', `${U.payment}/paypal`, {
    Payment: { orderId: order.orderId, provider: 'Paypal', successUrl: 'http://localhost:8081/payment/success', cancelUrl: 'http://localhost:8081/payment/failure' },
  });
  const paypalOk = ok(pay.status < 300 && pay.data?.payment?.redirectUrl, 'PayPal sandbox crea el pago y devuelve la URL de aprobación',
    pay.data?.payment ? `cobra ${pay.data.payment.amountUsd} USD` : JSON.stringify(pay.error));
  const paymentId = pay.data?.payment?.paymentId ?? `sim-${Date.now()}`;

  // 6. Aprobación (simulada: en sandbox requiere aprobar en el navegador) --
  const { EventBridgeClient, PutEventsCommand } = require(`${ROOT}/backend-order/node_modules/@aws-sdk/client-eventbridge`);
  const eb = new EventBridgeClient({ region: 'us-east-1', endpoint: 'http://localhost:4566', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } });
  const put = await eb.send(new PutEventsCommand({ Entries: [{
    EventBusName: 'foodstore-events', Source: 'payment-service', DetailType: 'PaymentApproved',
    Detail: JSON.stringify({ type: 'PaymentApproved', payload: { paymentId, orderId: order.orderId, userId: user.userId, provider: 'PAYPAL', amountUsd: order.totalUsd, amountClp: order.totalClp } }),
  }] }));
  ok(put.FailedEntryCount === 0, 'PaymentApproved publicado en EventBridge (simulando la confirmación de PayPal)');

  let status;
  for (let i = 0; i < 20; i++) {
    status = (await call('GET', `${U.order}/${order.orderId}/status-delivery`)).data?.order?.statusDelivery;
    if (status === 'ASSIGNED') break;
    await sleep(1500);
  }
  const full = (await call('GET', `${U.order}/${order.orderId}`)).data?.order;
  ok(status === 'ASSIGNED' && full?.status === 'PAID', 'order consume el evento de SQS, marca PAID y asigna repartidor',
    `status=${full?.status} delivery=${status} courier=${full?.courierId ?? '-'}`);

  // 7. Confirmación de entrega ------------------------------------------
  const conf = await call('PATCH', `${U.order}/${order.orderId}/confirm-delivery`);
  const after = (await call('GET', `${U.order}/${order.orderId}/status-delivery`)).data?.order?.statusDelivery;
  ok(conf.status < 300 && after === 'DELIVERED', 'el cliente confirma la entrega', after);

  // 8. Seguridad de sesión ----------------------------------------------
  const otherOrder = await call('GET', `${U.order}/${order.orderId}`, undefined, { auth: false });
  ok(otherOrder.status === 401, 'sin token no se puede leer la orden', `HTTP ${otherOrder.status}`);

  const r1 = await call('POST', `${U.auth}/refresh`, { Auth: { refreshToken: refresh1 } }, { auth: false });
  ok(r1.status === 200 && r1.data?.Auth?.refreshToken !== refresh1, 'refresh rota el token');
  const reuse = await call('POST', `${U.auth}/refresh`, { Auth: { refreshToken: refresh1 } }, { auth: false });
  const afterTheft = await call('POST', `${U.auth}/refresh`, { Auth: { refreshToken: r1.data?.Auth?.refreshToken } }, { auth: false });
  ok(reuse.status === 401 && afterTheft.status === 401, 'reusar un token rotado revoca toda la sesión (detección de robo)');

  await call('DELETE', `${U.checkout}/carts/me`);
  console.log(`\n${failures === 0 ? 'TODO OK' : `${failures} verificación(es) fallaron`}${paypalOk ? '' : ' (ver PayPal)'}`);
  process.exitCode = failures ? 1 : 0;
})().catch((e) => { console.error('FALLO inesperado:', e); process.exitCode = 1; });
