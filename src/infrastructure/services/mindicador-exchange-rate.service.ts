import { Inject, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import {
  ExchangeRate,
  ExchangeRateService,
} from '../../domain/services/exchange-rate.service';
import {
  SettingsRepository,
  SettingsRepositorySymbol,
} from '../../domain/repository/settings.repository';

// Rango de cordura: evita congelar en una orden un valor corrupto de la API
const MIN_VALID_RATE = 300;
const MAX_VALID_RATE = 3000;

/**
 * Dólar observado del Banco Central de Chile (vía mindicador.cl).
 * - Cachea el valor según exchangeRate.cacheTtlSeconds.
 * - Si la API falla usa el último valor obtenido y, si no hay, el
 *   parametrizado en Settings (exchangeRate.usdClp).
 * - Con exchangeRate.source = MANUAL siempre usa el valor parametrizado.
 */
@Injectable()
export class MindicadorExchangeRateService implements ExchangeRateService {
  private readonly logger = new Logger(MindicadorExchangeRateService.name);
  private readonly apiUrl =
    process.env.EXCHANGE_RATE_API_URL ?? 'https://mindicador.cl/api/dolar';

  private cached: { rate: ExchangeRate; expiresAt: number } | null = null;

  constructor(
    @Inject(SettingsRepositorySymbol)
    private readonly settingsRepository: SettingsRepository,
  ) {}

  async getUsdClp(): Promise<ExchangeRate> {
    const { exchangeRate } = await this.settingsRepository.getDeliverySettings();

    if (exchangeRate.source === 'MANUAL') {
      return {
        usdClp: exchangeRate.usdClp,
        source: 'MANUAL',
        fetchedAt: new Date(),
      };
    }

    if (this.cached && this.cached.expiresAt > Date.now()) {
      return this.cached.rate;
    }

    try {
      const { data } = await axios.get(this.apiUrl, { timeout: 4000 });
      const value = Number(data?.serie?.[0]?.valor);

      if (
        !Number.isFinite(value) ||
        value < MIN_VALID_RATE ||
        value > MAX_VALID_RATE
      ) {
        throw new Error(`Valor de tipo de cambio inválido: ${data?.serie?.[0]?.valor}`);
      }

      const rate: ExchangeRate = {
        usdClp: value,
        source: 'BANCO_CENTRAL',
        fetchedAt: new Date(),
      };

      this.cached = {
        rate,
        expiresAt: Date.now() + exchangeRate.cacheTtlSeconds * 1000,
      };

      return rate;
    } catch (error) {
      this.logger.warn(
        `No se pudo obtener el tipo de cambio: ${(error as Error).message}`,
      );

      if (this.cached) return this.cached.rate;

      return {
        usdClp: exchangeRate.usdClp,
        source: 'FALLBACK',
        fetchedAt: new Date(),
      };
    }
  }
}
