export interface ExchangeRate {
  usdClp: number; // pesos chilenos por 1 USD
  source: 'BANCO_CENTRAL' | 'MANUAL' | 'FALLBACK';
  fetchedAt: Date;
}

export interface ExchangeRateService {
  getUsdClp(): Promise<ExchangeRate>;
}

export const ExchangeRateServiceSymbol = Symbol('ExchangeRateService');
