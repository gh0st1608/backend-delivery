// Prepara los .env.local de backends y frontend para el entorno LocalStack.
//
// - Si un servicio no tiene .env.local, lo crea desde .env.local.example.
// - Completa los secretos vacíos: un par RS256 compartido (privada solo en
//   auth) y una INTERNAL_API_KEY común. Nunca sobrescribe valores existentes.
// - En el frontend fija las URLs de los servicios según el host indicado
//   (localhost para web/emulador iOS, IP de la red para un celular).
//
// Uso: node env-setup.js <backendDir> <frontendDir> <host>
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const [backendDir, frontendDir, host = 'localhost'] = process.argv.slice(2);
const SERVICES = ['auth', 'shop', 'checkout', 'order', 'payment', 'notification'];
const PORTS = { auth: 3000, shop: 3002, checkout: 3003, order: 3004, payment: 3005 };

const quote = (v) => `"${v.replace(/\n/g, '\\n')}"`;

const read = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null);

// Valor de una clave (soporta PEM entre comillas dobles en varias líneas)
const getValue = (text, key) => {
  const m = text.match(new RegExp(`^${key}=("([\\s\\S]*?)"|(.*))$`, 'm'));
  if (!m) return undefined;
  return (m[2] ?? m[3] ?? '').trim();
};

const setIfEmpty = (text, key, value) =>
  text.replace(new RegExp(`^${key}=\\s*$`, 'm'), `${key}=${value}`);

const setValue = (text, key, value) =>
  new RegExp(`^${key}=.*$`, 'm').test(text)
    ? text.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`)
    : `${text.trimEnd()}\n${key}=${value}\n`;

const warnings = [];

// 1) Crear los .env.local que falten
for (const svc of SERVICES) {
  const dir = path.join(backendDir, `backend-${svc}`);
  const local = path.join(dir, '.env.local');
  if (!fs.existsSync(local)) {
    fs.copyFileSync(path.join(dir, '.env.local.example'), local);
    console.log(`  backend-${svc}: .env.local creado desde la plantilla`);
  }
}

// 2) Secretos compartidos: se reutilizan los existentes o se generan
const authEnv = read(path.join(backendDir, 'backend-auth', '.env.local'));
let privateKey = getValue(authEnv, 'JWT_PRIVATE_KEY');
let publicKey = getValue(authEnv, 'JWT_PUBLIC_KEY');
if (!privateKey || !publicKey) {
  const pair = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  privateKey = pair.privateKey.trim();
  publicKey = pair.publicKey.trim();
  console.log('  par de claves JWT RS256 local generado');
} else {
  // Normaliza "\n" literales para reescribir siempre el mismo formato
  privateKey = privateKey.replace(/\\n/g, '\n');
  publicKey = publicKey.replace(/\\n/g, '\n');
}
const internalApiKey =
  SERVICES.map((s) => getValue(read(path.join(backendDir, `backend-${s}`, '.env.local')), 'INTERNAL_API_KEY'))
    .find(Boolean) || crypto.randomBytes(32).toString('hex');

for (const svc of SERVICES) {
  const file = path.join(backendDir, `backend-${svc}`, '.env.local');
  let text = read(file);
  const before = text;
  if (svc === 'auth') text = setIfEmpty(text, 'JWT_PRIVATE_KEY', quote(privateKey));
  text = setIfEmpty(text, 'JWT_PUBLIC_KEY', quote(publicKey));
  text = setIfEmpty(text, 'INTERNAL_API_KEY', internalApiKey);
  if (text !== before) {
    fs.writeFileSync(file, text);
    console.log(`  backend-${svc}: secretos locales completados`);
  }
  if (svc === 'payment' && (!getValue(text, 'PAYPAL_CLIENT_ID') || !getValue(text, 'PAYPAL_CLIENT_SECRET'))) {
    warnings.push('backend-payment/.env.local no tiene PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET (sandbox): el pago con PayPal fallará.');
  }
}

// 3) Frontend: URLs según el host
if (frontendDir && fs.existsSync(frontendDir)) {
  const file = path.join(frontendDir, '.env.local');
  if (!fs.existsSync(file)) {
    fs.copyFileSync(path.join(frontendDir, '.env.local.example'), file);
    console.log('  frontend: .env.local creado desde la plantilla');
  }
  let text = read(file);
  for (const [svc, port] of Object.entries(PORTS)) {
    text = setValue(text, `EXPO_PUBLIC_API_URL_${svc.toUpperCase()}`, `http://${host}:${port}/${svc}`);
  }
  text = setValue(text, 'EXPO_PUBLIC_SOCKET_URL', `http://${host}:${PORTS.order}`);
  fs.writeFileSync(file, text);
  console.log(`  frontend: URLs apuntando a ${host}`);
  if (!getValue(text, 'EXPO_PUBLIC_API_KEY_GOOGLE')) {
    warnings.push('frontend/.env.local no tiene EXPO_PUBLIC_API_KEY_GOOGLE: el mapa y la geocodificación del checkout no funcionarán.');
  }
}

for (const w of warnings) console.log(`  ⚠ ${w}`);
