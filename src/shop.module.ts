// src/infrastructure/modules/auth.module.ts

import { Module } from '@nestjs/common';
import { ProductRepositoryImpl } from './infrastructure/repository/product.repository.impl';
import { ShopController } from './infrastructure/shop.controller';
import { ProductRepositorySymbol } from './domain/repository/product.repository';
import { ConfigModule } from '@nestjs/config';
import { CreateProductUseCase } from './application/create-product.application';
import { GetProductByIdUseCase } from './application/get-product-by-id.application';
import { GetProductsUseCase } from './application/get-products.application';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${process.env.NODE_ENV || ''}.env`,
      isGlobal: true,
    }),
  ],
  controllers: [ShopController],
  providers: [
    CreateProductUseCase,
    GetProductByIdUseCase,
    GetProductsUseCase,
    {
      provide: ProductRepositorySymbol,
      useClass: ProductRepositoryImpl,
    },
  ],
})
export class ShopModule {}
