import { Module } from '@nestjs/common';
import { OrderController } from './infrastructure/controllers/order-http.controller';
import { CreateOrderUseCase } from './application/use-cases/create-order.usecase';
import { GetOrderByIdUseCase } from './application/use-cases/get-order-by-id.usecase';
import { OrderRepositorySymbol } from './domain/repository/order.repository';
import { OrderRepositoryImpl } from './infrastructure/persistence/dynamodb/order.repository.impl';
import { OrderEventPublisherSymbol } from './domain/services/event.publisher';
import { ConfigModule } from '@nestjs/config';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-status.usecase';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${process.env.NODE_ENV || ''}.env`,
      isGlobal: true,
    }),
  ],
  controllers: [OrderController],
  providers: [
    CreateOrderUseCase,
    GetOrderByIdUseCase,
    UpdateOrderStatusUseCase,
    AssignCourierToOrderUseCase,
    GetOrderStatusUseCase,
    GetOrdersUseCase,
    UpdateCourierLocationUseCase,
    OrderTrackingGateway,
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
      useClass: ShopHttpClientImpl,
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
