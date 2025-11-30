// src/infrastructure/modules/auth.module.ts

import { Module } from '@nestjs/common';
import { CartRepositoryImpl } from './infrastructure/repository/cart.repository.impl';
import { CartController } from './infrastructure/controllers/cart.controller';
import { ConfigModule } from '@nestjs/config';
import { ClearCartUseCase } from './application/use-cases/clear-cart.usecase';
import { CreateItemCartUseCase } from './application/use-cases/create-item-cart.usecase';
import { GetCartUseCase } from './application/use-cases/get-cart-by-user.usecase';
import { RemoveItemUseCase } from './application/use-cases/remove-item.usecase';
import { CartRepositorySymbol } from './domain/repository/cart.repository';
import { EventBridgeCartEventPublisher } from './infrastructure/eventbridge/eventbridge-cart-event.publisher';
import { CartEventPublisherSymbol } from './domain/services/cart-event.publisher';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${process.env.NODE_ENV || ''}.env`,
      isGlobal: true,
    }),
  ],
  controllers: [CartController],
  providers: [
    ClearCartUseCase,
    CreateItemCartUseCase,
    GetCartUseCase,
    RemoveItemUseCase,
    {
      provide: CartRepositorySymbol,
      useClass: CartRepositoryImpl,
    },
    {
      provide: CartEventPublisherSymbol,
      useClass: EventBridgeCartEventPublisher,
    }
  ],
})
export class CartModule {}
