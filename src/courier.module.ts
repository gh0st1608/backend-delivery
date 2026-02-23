import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CourierController } from './infrastructure/controllers/courier-http.controller';
import { CreateCourierUseCase } from './application/use-cases/create-courier.usecase';
import { GetCourierByIdUseCase } from './application/use-cases/get-courier-by-id.usecase';
import { CourierRepositorySymbol } from './domain/repository/courier.repository';
import { CourierRepositoryImpl } from './infrastructure/persistence/dynamodb/courier.repository.impl';
import { GetCouriersUseCase } from './application/use-cases/get-couriers.usecase';
import { SocketServerGatewaySymbol } from './domain/services/socket.server';
import { SocketServerGatewayImpl } from './infrastructure/realtime/websocket/courier.socket.impl';
import { OrderTrackingGateway } from './infrastructure/controllers/order-socket.controller';
import { UpdateCourierLocationUseCase } from './application/use-cases/update-courier-location.usecase';
import { OrderRepositorySymbol } from './domain/repository/order.repository';
import { OrderRepositoryImpl } from './infrastructure/persistence/dynamodb/order.repository.impl';
import { EtaServiceSymbol } from './domain/services/eta.service';
import { EtaServiceImpl } from './infrastructure/services/eta.service.impl';

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
    {
      provide: CourierRepositorySymbol,
      useClass: CourierRepositoryImpl,
    },
  ],
})
export class CourierModule {}
