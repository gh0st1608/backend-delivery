import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SocketConfig } from '../realtime/websocket/socket.config';
import { UpdateCourierLocationUseCase } from '../../application/use-cases/update-courier-location.usecase';
import { UpdateCourierLocationDto } from '../../application/dto/request/update-courier-location.dto';
import { SocketRooms } from '../realtime/websocket/socket-rooms';

@WebSocketGateway()
export class OrderTrackingGateway extends SocketConfig {
  constructor(
    private readonly updateCourierLocationUseCase: UpdateCourierLocationUseCase,
  ) {
    super();
  }

  // 🛵 Courier envía ubicación
  @SubscribeMessage('order.tracking.update')
  async handleOrderLocation(
    @MessageBody('Data') dto: UpdateCourierLocationDto,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`📍 Tracking update from ${client.id}`);
    console.log('dto',dto)
    await this.updateCourierLocationUseCase.execute(dto);

    return { status: 'ok' };
  }

  // 👤 Cliente se suscribe al tracking de una orden
  @SubscribeMessage('order.tracking.join')
  handleJoinOrder(
    @MessageBody() payload: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(SocketRooms.orderTracking(payload.orderId));

    this.logger.log(
      `👤 Cliente ${client.id} unido a ${SocketRooms.orderTracking(payload.orderId)}`,
    );
  }

  @SubscribeMessage('order.tracking.leave')
  handleLeaveOrder(
    @MessageBody() payload: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(SocketRooms.orderTracking(payload.orderId));
  }
}
