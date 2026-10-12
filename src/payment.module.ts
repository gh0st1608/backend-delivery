import { Module } from '@nestjs/common';
import { PaymentController } from './infrastructure/payment.controller';
import { PaymentRepositorySymbol } from './domain/repository/payment.repository';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CreatePaymentUseCase } from './application/use-cases/create-payment.use-case';
import { ConfirmPaymentUseCase } from './application/use-cases/confirm-payment.use-case';
import { PaymentRepositoryImpl } from './infrastructure/repository/payment.repository.impl';
import { GetPaymentsUseCase } from './application/use-cases/get-payments.use-case';
import { PaymentEventPublisherSymbol } from './domain/services/event.publisher';
import { EventBridgePaymentEventPublisherImpl } from './infrastructure/messaging/eventbridge-payment-event.publisher';
import { PaypalPaymentGatewayImpl } from './infrastructure/services/paypal-payment-gateway.impl';
import { PaypalPaymentGatewaySymbol } from './domain/services/paypal.gateway';
import { CreatePaymentPaypalUseCase } from './application/use-cases/create-payment-by-paypal.use-case';
import { PaypalConfigProvider } from './infrastructure/config/paypal.provider';
import { OrderGatewaySymbol } from './domain/services/order.gateway';
import { OrderHttpClientImpl } from './infrastructure/clients/order-http.client';


@Module({
  imports: [
    ConfigModule.forRoot({
      // .env.local por defecto; .env.production con NODE_ENV=production
      envFilePath: `.env.${process.env.NODE_ENV || 'local'}`,
      isGlobal: true,
    }),
    // Límite por defecto de peticiones por IP (anti abuso)
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
  ],
  controllers: [PaymentController],

  providers: [
    // Guard global de rate limiting
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // =============================
    // APPLICATION (Use Cases)
    // =============================
    CreatePaymentUseCase,
    CreatePaymentPaypalUseCase,
    ConfirmPaymentUseCase,
    GetPaymentsUseCase,

    // =============================
    // DOMAIN → PORTS IMPLEMENTATION
    // =============================
    {
      provide: PaymentRepositorySymbol,
      useClass: PaymentRepositoryImpl,
    },
    {
      provide: PaymentEventPublisherSymbol,
      useClass: EventBridgePaymentEventPublisherImpl,
    },
    {
      provide: PaypalPaymentGatewaySymbol,
      useClass: PaypalPaymentGatewayImpl,
    },
    {
      provide: OrderGatewaySymbol,
      useClass: OrderHttpClientImpl,
    },

    // =============================
    // INFRASTRUCTURE / CONFIG
    // =============================
    PaypalConfigProvider,
  ],
})
export class PaymentModule {}
