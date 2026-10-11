// Datos de prueba para el entorno local. Idempotente: reutiliza lo que ya existe.
// Crea categorías, productos (con imagen, precio en CLP y stock) y un repartidor.
// Escribe el id del repartidor en <runDir>/courier-id para el simulador.
//
// Uso: node seed.js <backendDir> <runDir>
const fs = require('fs');
const path = require('path');

const [backendDir, runDir] = process.argv.slice(2);
const SHOP = 'http://localhost:3002/shop';
const COURIER = 'http://localhost:3004/courier';
// shop devuelve una ubicación fija (Lima) para cualquier tienda
const STORE_ID = 'store-lima-01';

const envValue = (file, key) => {
  const m = fs.readFileSync(file, 'utf8').match(new RegExp(`^${key}=["']?([^"'\\r\\n]*)`, 'm'));
  return m?.[1];
};
const apiKey = envValue(path.join(backendDir, 'backend-shop', '.env.local'), 'INTERNAL_API_KEY');
if (!apiKey) throw new Error('INTERNAL_API_KEY vacía en backend-shop/.env.local');

async function api(method, url, data, headers = {}) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: data ? JSON.stringify({ Data: data }) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.Error) {
    throw new Error(`${method} ${url} -> ${res.status} ${JSON.stringify(json.Error ?? json)}`);
  }
  return json.Data;
}

const img = (id) => `https://images.unsplash.com/${id}?w=600&q=80`;

const CATALOG = [
  {
    category: { name: 'Hamburguesas', description: 'Hamburguesas artesanales', image: img('photo-1568901346375-23c9450c58cd') },
    products: [
      { name: 'Hamburguesa clásica', description: 'Carne, queso, lechuga y tomate', price: 6990, stock: 30, image: img('photo-1568901346375-23c9450c58cd') },
      { name: 'Hamburguesa doble', description: 'Doble carne y doble queso', price: 8990, stock: 20, image: img('photo-1553979459-d2229ba7433b') },
    ],
  },
  {
    category: { name: 'Pizzas', description: 'Pizzas al horno de piedra', image: img('photo-1513104890138-7c749659a591') },
    products: [
      { name: 'Pizza margarita', description: 'Tomate, mozzarella y albahaca', price: 9990, stock: 15, image: img('photo-1574071318508-1cdbab80d002') },
      { name: 'Pizza pepperoni', description: 'Pepperoni y mozzarella', price: 10990, stock: 15, image: img('photo-1628840042765-356cda07504e') },
    ],
  },
  {
    category: { name: 'Bebidas', description: 'Bebidas frías', image: img('photo-1544145945-f90425340c7e') },
    products: [
      { name: 'Limonada', description: 'Limonada natural 500 ml', price: 2490, stock: 50, image: img('photo-1523677011781-c91d1bbe2f9e') },
    ],
  },
];

(async () => {
  const admin = { 'X-Internal-Api-Key': apiKey };
  const categories = (await api('GET', `${SHOP}/categories?limit=100`))?.items ?? [];
  const products = (await api('GET', `${SHOP}/products?limit=100`))?.items ?? [];
  let created = 0;

  for (const { category, products: items } of CATALOG) {
    let categoryId = categories.find((c) => c.name === category.name)?.categoryId;
    if (!categoryId) {
      const res = await api('POST', `${SHOP}/categories`, { Category: category }, admin);
      categoryId = res?.category?.categoryId ?? res?.category?.id ?? res?.category;
      created++;
    }

    for (const p of items) {
      if (products.some((existing) => existing.name === p.name)) continue;
      await api('POST', `${SHOP}/products`, {
        Product: { ...p, categoryId, storeId: STORE_ID, currency: 'CLP', ingredients: [] },
      }, admin);
      created++;
    }
  }

  const couriers = (await api('GET', `${COURIER}?limit=100`))?.items ?? [];
  let courierId = couriers.find((c) => c.name === 'Repartidor Demo')?.courierId;
  if (!courierId) {
    const res = await api('POST', COURIER, {
      Courier: { name: 'Repartidor Demo', phone: '+56900000000', vehicleType: 'MOTO', status: 'AVAILABLE' },
    });
    courierId = res?.courier?.courierId;
    created++;
  }

  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'courier-id'), courierId);
  console.log(`  catálogo listo (${created} registros nuevos); repartidor ${courierId}`);
})().catch((e) => {
  console.error(`  seed falló: ${e.message}`);
  process.exit(1);
});
