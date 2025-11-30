import { Module } from '@nestjs/common';
import { OrderController } from './infrastructure/controllers/order.controller';
import { CreateOrderUseCase } from './application/use-cases/create-order.application';
import { GetOrderByIdUseCase } from './application/use-cases/get-order-by-id.application';
import { OrderRepositorySymbol } from './domain/repository/order.repository';
import { OrderRepositoryImpl } from './infrastructure/repository/order.repository.impl';
import { OrderEventPublisherSymbol } from './domain/services/order-event.publisher';
import { EventBridgeOrderEventPublisher } from './infrastructure/eventbridge/eventbridge-order-event.publisher';
import { ConfigModule } from '@nestjs/config';

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
    {
      provide: OrderRepositorySymbol,
      useClass: OrderRepositoryImpl,
    },
    {
      provide: OrderEventPublisherSymbol,
      useClass: EventBridgeOrderEventPublisher,
    },
  ],
})
export class OrderModule {}
