import { Module } from '@nestjs/common';
import { OrderController } from './infrastructure/controllers/order.controller';
import { CreateOrderUseCase } from './application/use-cases/create-order.usecase';
import { GetOrderByIdUseCase } from './application/use-cases/get-order-by-id.usecase';
import { OrderRepositorySymbol } from './domain/repository/order.repository';
import { OrderRepositoryImpl } from './infrastructure/repository/order.repository.impl';
import { OrderEventPublisherSymbol } from './domain/services/event.publisher';
import { ConfigModule } from '@nestjs/config';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-status.usecase';
import { EventBridgeOrderEventPublisherImpl } from './infrastructure/eventbridge/eventbridge-order-event.publisher';
import { UpdateOrderLocationUseCase } from './application/use-cases/update-order-location.usecase';
import { SocketServerGatewaySymbol } from './domain/services/socket.server';
import { SocketServerGatewayImpl } from './infrastructure/gateway/order.gateway.impl';
import { OrderGateway } from './infrastructure/controllers/order.gateway';

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
    UpdateOrderLocationUseCase,
    OrderGateway,
    {
      provide: OrderRepositorySymbol,
      useClass: OrderRepositoryImpl,
    },
    {
      provide: OrderEventPublisherSymbol,
      useClass: EventBridgeOrderEventPublisherImpl,
    },
    {
      provide: SocketServerGatewaySymbol,
      useClass: SocketServerGatewayImpl,
    }
  ],
})
export class OrderModule {}
