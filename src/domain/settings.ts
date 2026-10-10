// Parámetros de negocio del delivery. Hoy se leen de la tabla Settings
// (con valores por defecto de respaldo); la futura plataforma de
// administración solo tendrá que escribir en esa tabla.

export type AssignmentMode = 'AUTO' | 'MANUAL';
export type ExchangeRateSource = 'AUTO' | 'MANUAL';

export interface DeliverySettings {
  pricing: {
    currency: 'CLP';
    deliveryFeeClp: number;
  };
  exchangeRate: {
    // AUTO: dólar observado (Banco Central vía mindicador.cl) con respaldo
    // MANUAL: siempre se usa usdClp
    source: ExchangeRateSource;
    usdClp: number;
    cacheTtlSeconds: number;
  };
  assignment: {
    // AUTO: se asigna el repartidor al confirmarse el pago
    // MANUAL: lo asigna un operador desde la administración
    mode: AssignmentMode;
    maxLocationAgeSeconds: number;
    maxCandidates: number;
    maxPickupDistanceKm: number;
    retryIntervalSeconds: number;
    maxAttempts: number;
  };
}

const envNumber = (key: string, fallback: number) => {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export const defaultDeliverySettings = (): DeliverySettings => ({
  pricing: {
    currency: 'CLP',
    deliveryFeeClp: envNumber('DEFAULT_DELIVERY_FEE_CLP', 1990),
  },
  exchangeRate: {
    source: 'AUTO',
    usdClp: envNumber('DEFAULT_USD_CLP_RATE', 950),
    cacheTtlSeconds: envNumber('EXCHANGE_RATE_CACHE_TTL_SECONDS', 3600),
  },
  assignment: {
    mode: 'AUTO',
    maxLocationAgeSeconds: envNumber('COURIER_MAX_LOCATION_AGE_SECONDS', 120),
    maxCandidates: envNumber('COURIER_AUTO_ASSIGN_MAX_CANDIDATES', 25),
    maxPickupDistanceKm: envNumber('COURIER_MAX_PICKUP_DISTANCE_KM', 10),
    retryIntervalSeconds: envNumber('COURIER_ASSIGN_RETRY_INTERVAL_SECONDS', 30),
    maxAttempts: envNumber('COURIER_ASSIGN_MAX_ATTEMPTS', 20),
  },
});
