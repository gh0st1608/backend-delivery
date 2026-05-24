import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CourierController } from './infrastructure/controllers/courier-http.controller';
import { CreateCourierUseCase } from './application/use-cases/create-courier.usecase';
import { GetCourierByIdUseCase } from './application/use-cases/get-courier-by-id.usecase';
import { CourierRepositorySymbol } from './domain/repository/courier.repository';
import { CourierRepositoryImpl } from './infrastructure/persistence/dynamodb/courier.repository.impl';
import { GetCouriersUseCase } from './application/use-cases/get-couriers.usecase';
import { UpdateCourierPresenceUseCase } from './application/use-cases/update-courier-presence.usecase';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${process.env.NODE_ENV || ''}.env`,
      isGlobal: true,
    }),
  ],
  controllers: [CourierController],
  providers: [
    CreateCourierUseCase,
    GetCourierByIdUseCase,
    GetCouriersUseCase,
    UpdateCourierPresenceUseCase,
    {
      provide: CourierRepositorySymbol,
      useClass: CourierRepositoryImpl,
    },
  ],
})
export class CourierModule {}
