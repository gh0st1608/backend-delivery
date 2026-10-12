#!/usr/bin/env node
// Cliente de prueba del tracking en tiempo real (Socket.IO de backend-order).
//
// Se conecta, se une a la sala de una orden y muestra los eventos que emite el
// servidor. Con --simulate-courier además envía ubicaciones del repartidor.
//
// Uso:
//   node socket-tracking.js --token <access_token> --order <order_id>
//        [--url http://localhost:3004] [--simulate-courier <courier_id>]
//        [--auth-mode auth|header]
//
//   --auth-mode auth    envía el token en handshake.auth (como la app) [por defecto]
//   --auth-mode header  envía "Authorization: Bearer" (como Postman)
//
// Requiere socket.io-client: se toma de ../../frontend-delivery/node_modules o,
// si no existe, de cualquier node_modules accesible (npm i socket.io-client).
const path = require('path');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, all) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), all[i + 1]?.startsWith('--') ? true : all[i + 1] ?? true]);
    return acc;
  }, []),
);

const url = args.url || 'http://localhost:3004';
const { token, order: orderId } = args;
const authMode = args['auth-mode'] || 'auth';
// Emitir ubicaciones (order.tracking.update) exige la clave interna
const internalKey = args['internal-key'] || process.env.INTERNAL_API_KEY;
if (!token || !orderId) {
  console.error('Faltan --token y --order (los guarda la colección Postman en access_token y order_id).');
  process.exit(1);
}
if (args['simulate-courier'] && !internalKey) {
  console.error('--simulate-courier necesita --internal-key <INTERNAL_API_KEY> (o la variable de entorno).');
  process.exit(1);
}

const { io } = require(require.resolve('socket.io-client', {
  paths: [path.resolve(__dirname, '../../frontend-delivery/node_modules'), __dirname, process.cwd()],
}));

const socket = io(url, {
  transports: ['websocket'],
  ...(authMode === 'header'
    ? { extraHeaders: { Authorization: `Bearer ${token}`, ...(internalKey ? { 'x-internal-api-key': internalKey } : {}) } }
    : { auth: { token, ...(internalKey ? { apiKey: internalKey } : {}) } }),
});

const now = () => new Date().toLocaleTimeString();

socket.on('connect', () => {
  console.log(`[${now()}] conectado (${socket.id}) a ${url} — token por ${authMode}`);
  let joined = false;
  const onJoined = () => {
    if (joined) return;
    joined = true;
    console.log(`[${now()}] ✔ unido al tracking de la orden ${orderId}`);
    if (args['simulate-courier']) simulateCourier(args['simulate-courier']);
  };
  socket.emit('order.tracking.join', { orderId }, (ack) => {
    if (ack?.status === 'error') {
      console.log(`[${now()}] ✖ join rechazado: ${ack.message} (token inválido/expirado o la orden no es tuya)`);
      process.exit(2);
    }
    onJoined();
  });
  // Servidores anteriores no confirman el join exitoso: sin error en 2 s se asume unido
  setTimeout(onJoined, 2000);
});

socket.on('order.courier.assigned', (e) => console.log(`[${now()}] 🛵 order.courier.assigned`, JSON.stringify(e)));
socket.on('order.tracking.updated', (e) => console.log(`[${now()}] 📍 order.tracking.updated`, JSON.stringify(e)));
socket.on('on-error', (e) => console.log(`[${now()}] ⚠ on-error`, JSON.stringify(e)));
socket.on('connect_error', (e) => console.log(`[${now()}] ✖ connect_error: ${e.message}`));
socket.on('disconnect', (r) => console.log(`[${now()}] desconectado: ${r}`));

// Recorrido de ejemplo cerca de la tienda de prueba (Lima)
function simulateCourier(courierId) {
  const route = [[-11.9800, -77.0820], [-11.9780, -77.0790], [-11.9750, -77.0760], [-11.9720, -77.0730], [-11.9700, -77.0700]];
  let i = 0;
  console.log(`[${now()}] simulando repartidor ${courierId} (Ctrl+C para salir)`);
  const send = () => {
    const [lat, lng] = route[i++ % route.length];
    socket.emit('order.tracking.update', { Data: { Courier: { orderId, courierId, location: { lat, lng } } } }, (ack) =>
      console.log(`[${now()}] → order.tracking.update ${lat},${lng} ack=${JSON.stringify(ack)}`));
  };
  send();
  setInterval(send, 3000);
}

process.on('SIGINT', () => {
  socket.emit('order.tracking.leave', { orderId });
  socket.close();
  process.exit(0);
});
