import { DeliverySettings } from '../settings';

export interface SettingsRepository {
  getDeliverySettings(): Promise<DeliverySettings>;
}

export const SettingsRepositorySymbol = Symbol('SettingsRepository');
