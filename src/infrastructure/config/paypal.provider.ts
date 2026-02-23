import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaypalConfig } from '../interfaces/paypal.interface';

@Injectable()
export class PaypalConfigProvider {
  constructor(private readonly config: ConfigService) {}

  getConfig(): PaypalConfig {
    const env = this.config.get<string>('PAYPAL_ENV', {
      infer: true,
    });

    return {
      clientId: this.config.get<string>(
        'PAYPAL_CLIENT_ID',
        { infer: true },
      )!,
      clientSecret: this.config.get<string>(
        'PAYPAL_CLIENT_SECRET',
        { infer: true },
      )!,
      baseUrl:
        env === 'production'
          ? 'https://api-m.paypal.com'
          : 'https://api-m.sandbox.paypal.com',
    };
  }
}
