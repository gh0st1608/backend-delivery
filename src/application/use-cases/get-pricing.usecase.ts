import { Inject, Injectable } from '@nestjs/common';
import {
  SettingsRepository,
  SettingsRepositorySymbol,
} from '../../domain/repository/settings.repository';
import {
  ExchangeRateService,
  ExchangeRateServiceSymbol,
} from '../../domain/services/exchange-rate.service';
import { convertClpToUsd } from '../../domain/order.entity';

// Parámetros que la app necesita para mostrar el resumen antes de pagar.
// El monto definitivo siempre lo calcula la orden al crearse.
@Injectable()
export class GetPricingUseCase {
  constructor(
    @Inject(SettingsRepositorySymbol)
    private readonly settingsRepository: SettingsRepository,
    @Inject(ExchangeRateServiceSymbol)
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  async execute() {
    const [settings, rate] = await Promise.all([
      this.settingsRepository.getDeliverySettings(),
      this.exchangeRateService.getUsdClp(),
    ]);

    return {
      currency: settings.pricing.currency,
      deliveryFeeClp: settings.pricing.deliveryFeeClp,
      exchangeRateUsdClp: rate.usdClp,
      exchangeRateSource: rate.source,
      exchangeRateDate: rate.fetchedAt,
      deliveryFeeUsd: convertClpToUsd(settings.pricing.deliveryFeeClp, rate.usdClp),
    };
  }
}
