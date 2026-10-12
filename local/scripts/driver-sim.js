// Simulador de la app del conductor (solo entorno local / LocalStack).
//
// Hace de "driver app": avanza los estados de entrega y emite la ubicación del
// repartidor por el socket, para demostrar el flujo completo después del pago:
//   PREPARING -> PICKED_UP -> ON_THE_WAY (moviéndose del local al cliente) -> [DELIVERED]
// Mientras se mueve, el cliente ve el mapa en vivo (order.tracking.updated).
//
// Uso:
//   node driver-sim.js --order <orderId|latest> [--deliver] [opciones]
//
//   --order <id|latest>  Orden a repartir. "latest" toma la más reciente pagada.
//   --deliver            Marca DELIVERED al llegar (si no, lo confirma el cliente).
//   --steps <n>          Tramos del recorrido pickup->dropoff (por defecto 12).
//   --interval <ms>      Tiempo entre emisiones de ubicación (por defecto 2500).
//   --internal-key <k>   INTERNAL_API_KEY (por defecto se lee de backend-order/.env.local).
//   --order-base <url>   Por defecto http://localhost:3004/order
//   --socket <url>       Por defecto http://localhost:3004
//   --endpoint <url>     LocalStack, por defecto http://localhost:4566
const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "../../..");            // backend-delivery/
const ORDER_DIR = path.join(ROOT, "backend-order");
const FRONT_DIR = path.resolve(ROOT, "../frontend-delivery");

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, all) => {
    if (cur.startsWith("--")) acc.push([cur.slice(2), all[i + 1]?.startsWith("--") ? true : all[i + 1] ?? true]);
    return acc;
  }, []),
);

const ORDER_BASE = args["order-base"] || "http://localhost:3004/order";
const SOCKET_URL = args.socket || "http://localhost:3004";
const ENDPOINT = args.endpoint || "http://localhost:4566";
const STEPS = Number(args.steps) || 12;
const INTERVAL = Number(args.interval) || 2500;
const DELIVER = !!args.deliver;

const readEnv = (file, key) => {
  try {
    const m = fs.readFileSync(file, "utf8").match(new RegExp(`^${key}=["']?([^"'\\r\\n]*)`, "m"));
    return m?.[1];
  } catch { return undefined; }
};
const INTERNAL_KEY = args["internal-key"] || readEnv(path.join(ORDER_DIR, ".env.local"), "INTERNAL_API_KEY");

if (!args.order) { console.error("Falta --order <orderId|latest>"); process.exit(1); }
if (!INTERNAL_KEY) { console.error("No se encontró INTERNAL_API_KEY (usa --internal-key)"); process.exit(1); }

const { io } = require(require.resolve("socket.io-client", { paths: [path.join(FRONT_DIR, "node_modules")] }));
const { DynamoDBClient } = require(require.resolve("@aws-sdk/client-dynamodb", { paths: [path.join(ORDER_DIR, "node_modules")] }));
const { DynamoDBDocumentClient, GetCommand, ScanCommand } = require(require.resolve("@aws-sdk/lib-dynamodb", { paths: [path.join(ORDER_DIR, "node_modules")] }));

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: "us-east-1", endpoint: ENDPOINT, credentials: { accessKeyId: "test", secretAccessKey: "test" } }),
);

const now = () => new Date().toLocaleTimeString();
const log = (m) => console.log(`[${now()}] ${m}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loadOrder() {
  if (args.order === "latest") {
    const { Items = [] } = await ddb.send(new ScanCommand({ TableName: "Orders" }));
    const paid = Items.filter((o) => o.status === "PAID").sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return paid[0] || Items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))[0];
  }
  const { Item } = await ddb.send(new GetCommand({ TableName: "Orders", Key: { orderId: args.order } }));
  return Item;
}

async function setStatus(orderId, statusDelivery) {
  const res = await fetch(`${ORDER_BASE}/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-internal-api-key": INTERNAL_KEY },
    body: JSON.stringify({ Data: { Order: { statusDelivery } } }),
  });
  log(`estado -> ${statusDelivery} (HTTP ${res.status})`);
  if (!res.ok) log(`  ${JSON.stringify(await res.json().catch(() => ({})))}`);
}

function emitLocation(socket, orderId, courierId, lat, lng) {
  return new Promise((resolve) => {
    socket.emit("order.tracking.update", { Data: { Courier: { orderId, courierId, location: { lat, lng } } } }, (ack) => {
      log(`ubicación ${lat.toFixed(5)},${lng.toFixed(5)} -> ${JSON.stringify(ack)}`);
      resolve(ack);
    });
  });
}

(async () => {
  let order = await loadOrder();
  // La asignación puede tardar un momento tras el pago: reintenta
  for (let i = 0; i < 10 && (!order || !order.courierId); i++) {
    if (!order) { log("orden no encontrada, reintentando…"); }
    else { log("orden aún sin repartidor asignado, esperando…"); }
    await sleep(2000);
    order = await loadOrder();
  }
  if (!order) { console.error("No se encontró la orden"); process.exit(1); }
  if (!order.courierId) { console.error(`La orden ${order.orderId} no tiene repartidor asignado (¿se pagó?)`); process.exit(1); }

  const { orderId, courierId } = order;
  const pickup = { lat: Number(order.pickupLat), lng: Number(order.pickupLng) };
  const dropoff = { lat: Number(order.dropoffLat), lng: Number(order.dropoffLng) };
  log(`orden ${orderId} | repartidor ${courierId}`);
  log(`local (${pickup.lat},${pickup.lng}) -> cliente (${dropoff.lat},${dropoff.lng})`);

  const socket = io(SOCKET_URL, { transports: ["websocket"], auth: { apiKey: INTERNAL_KEY } });
  await new Promise((res, rej) => {
    socket.on("connect", res);
    socket.on("connect_error", (e) => rej(new Error(e.message)));
    setTimeout(() => rej(new Error("timeout conectando al socket")), 8000);
  });
  log(`conectado al socket (${socket.id})`);

  // 1) En el local, preparando
  await setStatus(orderId, "PREPARING");
  await sleep(INTERVAL);

  // 2) Recoge el pedido
  await setStatus(orderId, "PICKED_UP");
  await emitLocation(socket, orderId, courierId, pickup.lat, pickup.lng);
  await sleep(INTERVAL);

  // 3) En camino: se mueve del local al cliente
  await setStatus(orderId, "ON_THE_WAY");
  for (let i = 1; i <= STEPS; i++) {
    const t = i / STEPS;
    const lat = pickup.lat + (dropoff.lat - pickup.lat) * t;
    const lng = pickup.lng + (dropoff.lng - pickup.lng) * t;
    await emitLocation(socket, orderId, courierId, lat, lng);
    await sleep(INTERVAL);
  }

  // 4) Llegó
  log("el repartidor llegó al destino");
  if (DELIVER) {
    await setStatus(orderId, "DELIVERED");
    log("pedido marcado como ENTREGADO");
  } else {
    log('listo para que el cliente pulse "Confirm Delivery" (o corre con --deliver)');
  }

  socket.close();
  process.exit(0);
})().catch((e) => { console.error("driver-sim:", e.message); process.exit(1); });
