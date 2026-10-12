// src/infrastructure/modules/auth.module.ts

import { Module } from '@nestjs/common';
import { CartRepositoryImpl } from './infrastructure/repository/cart.repository.impl';
import { CheckoutController } from './infrastructure/controllers/checkout.controller';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ClearCartUseCase } from './application/use-cases/clear-cart.usecase';
import { CreateItemCartUseCase } from './application/use-cases/create-item-cart.usecase';
import { GetCartUseCase } from './application/use-cases/get-cart-by-user.usecase';
import { RemoveItemUseCase } from './application/use-cases/remove-item.usecase';
import { UpdateItemQuantityUseCase } from './application/use-cases/update-item-quantity.usecase';
import { CartRepositorySymbol } from './domain/repository/cart.repository';
import { EventBridgeCartEventPublisher } from './infrastructure/eventbridge/eventbridge-cart-event.publisher';
import { CartEventPublisherSymbol } from './domain/services/cart-event.publisher';

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
  controllers: [CheckoutController],
  providers: [
    // Guard global de rate limiting
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    ClearCartUseCase,
    CreateItemCartUseCase,
    GetCartUseCase,
    RemoveItemUseCase,
    UpdateItemQuantityUseCase,
    {
      provide: CartRepositorySymbol,
      useClass: CartRepositoryImpl,
    },
    {
      provide: CartEventPublisherSymbol,
      useClass: EventBridgeCartEventPublisher,
    },
  ],
})
export class CheckoutModule {}
