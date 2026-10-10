import { Injectable, Logger } from '@nestjs/common';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SettingsRepository } from '../../../domain/repository/settings.repository';
import {
  DeliverySettings,
  defaultDeliverySettings,
} from '../../../domain/settings';
import { getAwsCredentials } from '../../helpers/aws.helper';

/**
 * Tabla Settings (PK: settingKey). Ítem "DELIVERY":
 * {
 *   settingKey: 'DELIVERY',
 *   pricing:      { deliveryFeeClp },
 *   exchangeRate: { source: 'AUTO' | 'MANUAL', usdClp, cacheTtlSeconds },
 *   assignment:   { mode: 'AUTO' | 'MANUAL', maxLocationAgeSeconds, maxCandidates,
 *                   maxPickupDistanceKm, retryIntervalSeconds, maxAttempts }
 * }
 * Cualquier valor ausente o inválido toma el valor por defecto.
 */
@Injectable()
export class SettingsRepositoryImpl implements SettingsRepository {
  private readonly logger = new Logger(SettingsRepositoryImpl.name);
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName = process.env.SETTINGS_TABLE ?? 'Settings';
  private readonly cacheTtlMs = 60_000;

  private cache: { value: DeliverySettings; expiresAt: number } | null = null;

  constructor() {
    this.docClient = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: process.env.AWS_REGION ?? 'us-east-1',
        credentials: getAwsCredentials(),
      }),
    );
  }

  async getDeliverySettings(): Promise<DeliverySettings> {
    if (this.cache && this.cache.expiresAt > Date.now()) {
      return this.cache.value;
    }

    const defaults = defaultDeliverySettings();
    let stored: Record<string, any> = {};

    try {
      const result = await this.docClient.send(
        new GetCommand({
          TableName: this.tableName,
          Key: { settingKey: 'DELIVERY' },
        }),
      );
      stored = result.Item ?? {};
    } catch (error) {
      // Sin tabla o sin acceso se opera con valores por defecto
      this.logger.warn(
        `No se pudo leer ${this.tableName}; se usan valores por defecto (${(error as Error).name})`,
      );
    }

    const value = this.merge(defaults, stored);
    this.cache = { value, expiresAt: Date.now() + this.cacheTtlMs };
    return value;
  }

  private merge(
    defaults: DeliverySettings,
    stored: Record<string, any>,
  ): DeliverySettings {
    const num = (value: unknown, fallback: number) =>
      typeof value === 'number' && Number.isFinite(value) && value > 0
        ? value
        : fallback;
    const oneOf = <T extends string>(value: unknown, options: T[], fallback: T) =>
      options.includes(value as T) ? (value as T) : fallback;

    const pricing = stored.pricing ?? {};
    const exchangeRate = stored.exchangeRate ?? {};
    const assignment = stored.assignment ?? {};

    return {
      pricing: {
        currency: 'CLP',
        deliveryFeeClp: Math.round(
          num(pricing.deliveryFeeClp, defaults.pricing.deliveryFeeClp),
        ),
      },
      exchangeRate: {
        source: oneOf(exchangeRate.source, ['AUTO', 'MANUAL'], defaults.exchangeRate.source),
        usdClp: num(exchangeRate.usdClp, defaults.exchangeRate.usdClp),
        cacheTtlSeconds: num(
          exchangeRate.cacheTtlSeconds,
          defaults.exchangeRate.cacheTtlSeconds,
        ),
      },
      assignment: {
        mode: oneOf(assignment.mode, ['AUTO', 'MANUAL'], defaults.assignment.mode),
        maxLocationAgeSeconds: num(
          assignment.maxLocationAgeSeconds,
          defaults.assignment.maxLocationAgeSeconds,
        ),
        maxCandidates: num(assignment.maxCandidates, defaults.assignment.maxCandidates),
        maxPickupDistanceKm: num(
          assignment.maxPickupDistanceKm,
          defaults.assignment.maxPickupDistanceKm,
        ),
        retryIntervalSeconds: num(
          assignment.retryIntervalSeconds,
          defaults.assignment.retryIntervalSeconds,
        ),
        maxAttempts: num(assignment.maxAttempts, defaults.assignment.maxAttempts),
      },
    };
  }
}
