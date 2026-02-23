import { Module } from '@nestjs/common';
import { PaymentController } from './infrastructure/payment.controller';
import { PaymentRepositorySymbol } from './domain/repository/payment.repository';
import { ConfigModule } from '@nestjs/config';
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


@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${process.env.NODE_ENV || ''}.env`,
      isGlobal: true,
    }),
  ],
  controllers: [PaymentController],

  providers: [
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

    // =============================
    // INFRASTRUCTURE / CONFIG
    // =============================
    PaypalConfigProvider,
  ],
})
export class PaymentModule {}
