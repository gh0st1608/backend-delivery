import { Module } from '@nestjs/common';
import { CourierModule } from './courier.module';
import { OrderModule } from './order.module';
import { ConfigModule } from '@nestjs/config';
import { SocketServerGatewaySymbol } from './domain/services/socket.server';
import { SocketServerGatewayImpl } from './infrastructure/realtime/websocket/courier.socket.impl';
import { EtaServiceImpl } from './infrastructure/services/eta.service.impl';
import { EtaServiceSymbol } from './domain/services/eta.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Límite por defecto de peticiones por IP (anti abuso)
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    CourierModule,
    OrderModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
