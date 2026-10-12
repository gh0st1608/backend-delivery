// src/infrastructure/modules/auth.module.ts

import { Module } from '@nestjs/common';
import { ProductRepositoryImpl } from './infrastructure/repository/product.repository.impl';
import { ShopController } from './infrastructure/shop.controller';
import { ProductRepositorySymbol } from './domain/repository/product.repository';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CreateProductUseCase } from './application/create-product.application';
import { GetProductByIdUseCase } from './application/get-product-by-id.application';
import { GetProductsUseCase } from './application/get-products.application';
import { GetCategoriesUseCase } from './application/get-categories.application';
import { CategoryRepositoryImpl } from './infrastructure/repository/category.repository.impl';
import { CategoryRepositorySymbol } from './domain/repository/category.repository';
import { CreateCategoryUseCase } from './application/create-category.application';

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
  controllers: [ShopController],
  providers: [
    // Guard global de rate limiting
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    CreateProductUseCase,
    GetProductByIdUseCase,
    GetProductsUseCase,
    GetCategoriesUseCase,
    CreateCategoryUseCase,
    {
      provide: ProductRepositorySymbol,
      useClass: ProductRepositoryImpl,
    },
    {
      provide: CategoryRepositorySymbol,
      useClass: CategoryRepositoryImpl,
    },
  ],
})
export class ShopModule {}
