import { Module } from '@nestjs/common';
import { OrderController } from './infrastructure/controllers/order-http.controller';
import { CreateOrderUseCase } from './application/use-cases/create-order.usecase';
import { GetOrderByIdUseCase } from './application/use-cases/get-order-by-id.usecase';
import { OrderRepositorySymbol } from './domain/repository/order.repository';
import { OrderRepositoryImpl } from './infrastructure/persistence/dynamodb/order.repository.impl';
import { OrderEventPublisherSymbol } from './domain/services/event.publisher';
import { ConfigModule } from '@nestjs/config';
import { UpdateOrderStatusDeliveryUseCase } from './application/use-cases/update-status.usecase';
import { EventBridgeOrderEventPublisherImpl } from './infrastructure/messaging/eventbridge/eventbridge-order-event.publisher';
import { StoreLocationServiceSymbol } from './domain/services/store.repository';
import { ShopHttpClientImpl } from './infrastructure/clients/store-http.client';
import { SocketServerGatewaySymbol } from './domain/services/socket.server';
import { SocketServerGatewayImpl } from './infrastructure/realtime/websocket/courier.socket.impl';
import { OrderTrackingGateway } from './infrastructure/controllers/order-socket.controller';
import { UpdateCourierLocationUseCase } from './application/use-cases/update-courier-location.usecase';
import { AssignCourierToOrderUseCase } from './application/use-cases/assign-courier-to-order.usecase';
import { EtaServiceSymbol } from './domain/services/eta.service';
import { EtaServiceImpl } from './infrastructure/services/eta.service.impl';
import { CourierRepositorySymbol } from './domain/repository/courier.repository';
import { CourierRepositoryImpl } from './infrastructure/persistence/dynamodb/courier.repository.impl';
import { GetOrderStatusUseCase } from './application/use-cases/get-order-status.usecase';
import { GetOrdersUseCase } from './application/use-cases/get-orders.usecase';
import { AutoAssignCourierUseCase } from './application/use-cases/auto-assign-courier.usecase';
import { ConfirmDeliveryUseCase } from './application/use-cases/confirm-delivery.usecase';
import { GetPricingUseCase } from './application/use-cases/get-pricing.usecase';
import { HandlePaymentApprovedUseCase } from './application/use-cases/handle-payment-approved.usecase';
import { RetryPendingAssignmentsUseCase } from './application/use-cases/retry-pending-assignments.usecase';
import { CatalogServiceSymbol } from './domain/services/catalog.service';
import { ExchangeRateServiceSymbol } from './domain/services/exchange-rate.service';
import { MindicadorExchangeRateService } from './infrastructure/services/mindicador-exchange-rate.service';
import { SettingsRepositorySymbol } from './domain/repository/settings.repository';
import { SettingsRepositoryImpl } from './infrastructure/persistence/dynamodb/settings.repository.impl';
import { PaymentEventsConsumer } from './infrastructure/messaging/sqs/payment-events.consumer';
import { SqsPollerService } from './infrastructure/messaging/sqs/sqs-poller.service';
import { AssignmentRetryScheduler } from './infrastructure/schedulers/assignment-retry.scheduler';

@Module({
  imports: [
    ConfigModule.forRoot({
      // .env.local por defecto; .env.production con NODE_ENV=production
      envFilePath: `.env.${process.env.NODE_ENV || 'local'}`,
      isGlobal: true,
    }),
  ],
  controllers: [OrderController],
  providers: [
    CreateOrderUseCase,
    GetOrderByIdUseCase,
    UpdateOrderStatusDeliveryUseCase,
    AssignCourierToOrderUseCase,
    AutoAssignCourierUseCase,
    GetOrderStatusUseCase,
    GetOrdersUseCase,
    UpdateCourierLocationUseCase,
    ConfirmDeliveryUseCase,
    GetPricingUseCase,
    HandlePaymentApprovedUseCase,
    RetryPendingAssignmentsUseCase,
    OrderTrackingGateway,

    // Eventos de pago y reintentos de asignación
    PaymentEventsConsumer,
    SqsPollerService,
    AssignmentRetryScheduler,

    // Un único cliente HTTP de shop expone ubicación y catálogo
    ShopHttpClientImpl,
    {
      provide: CatalogServiceSymbol,
      useExisting: ShopHttpClientImpl,
    },
    {
      provide: SettingsRepositorySymbol,
      useClass: SettingsRepositoryImpl,
    },
    {
      provide: ExchangeRateServiceSymbol,
      useClass: MindicadorExchangeRateService,
    },
    {
      provide: OrderRepositorySymbol,
      useClass: OrderRepositoryImpl,
    },
    {
      provide: CourierRepositorySymbol,
      useClass: CourierRepositoryImpl,
    },
    {
      provide: OrderEventPublisherSymbol,
      useClass: EventBridgeOrderEventPublisherImpl,
    },
    {
      provide: StoreLocationServiceSymbol,
      useExisting: ShopHttpClientImpl,
    },
    {
      provide: SocketServerGatewaySymbol,
      useClass: SocketServerGatewayImpl,
    },
    {
      provide: EtaServiceSymbol,
      useClass: EtaServiceImpl,
    },
  ],
})
export class OrderModule {}
