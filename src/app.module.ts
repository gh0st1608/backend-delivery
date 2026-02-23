import { Module } from '@nestjs/common';
import { CourierModule } from './courier.module';
import { OrderModule } from './order.module';
import { ConfigModule } from '@nestjs/config';
import { SocketServerGatewaySymbol } from './domain/services/socket.server';
import { SocketServerGatewayImpl } from './infrastructure/realtime/websocket/courier.socket.impl';
import { EtaServiceImpl } from './infrastructure/services/eta.service.impl';
import { EtaServiceSymbol } from './domain/services/eta.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CourierModule,
    OrderModule,
  ],
})
export class AppModule {}
