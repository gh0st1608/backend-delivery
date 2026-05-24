const baseUrl = process.env.SIM_BASE_URL || 'http://localhost:3333';
const courierId = process.env.SIM_COURIER_ID || '1b045db6-a37c-4043-9187-16087994a7a0';
const intervalMs = Number(process.env.SIM_INTERVAL_MS || 3000);
const status = process.env.SIM_STATUS || 'AVAILABLE';

if (!courierId) {
  console.error('SIM_COURIER_ID is required');
  process.exit(1);
}

const route = parseRoute(
  process.env.SIM_POINTS ||
    '4.65161,-74.06365;4.65305,-74.06512;4.65471,-74.06693;4.65612,-74.06842',
);

if (!route.length) {
  console.error('SIM_POINTS must contain at least one lat,lng pair');
  process.exit(1);
}

let routeIndex = 0;

async function sendPresence() {
  const location = route[routeIndex];
  routeIndex = (routeIndex + 1) % route.length;

  const response = await fetch(`${baseUrl}/courier/${courierId}/presence`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Courier: {
        status,
        location,
      },
    }),
  });

  const body = await response.text();
  console.log(
    `[${new Date().toISOString()}] ${response.status} ${location.lat},${location.lng} ${body}`,
  );
}

function parseRoute(serializedRoute) {
  return serializedRoute
    .split(';')
    .map((point) => point.trim())
    .filter(Boolean)
    .map((point) => {
      const [lat, lng] = point.split(',').map(Number);

      return { lat, lng };
    })
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
}

sendPresence().catch(handleError);
setInterval(() => {
  sendPresence().catch(handleError);
}, intervalMs);

function handleError(error) {
  console.error(`[${new Date().toISOString()}] simulator error`, error);
}
