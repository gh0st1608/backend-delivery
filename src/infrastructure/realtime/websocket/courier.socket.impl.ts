import { Injectable } from '@nestjs/common';
import { SocketServerGateway } from '../../../domain/services/socket.server';
import { WebSocketGateway } from '@nestjs/websockets';
import { SocketConfig } from './socket.config';
import { CourierAssignedSocketEvent, CourierLocationSocketEvent } from '../../../domain/interfaces/event-socket.interface';

@WebSocketGateway()
@Injectable()
export class SocketServerGatewayImpl
  extends SocketConfig
  implements SocketServerGateway
{
  async emitCourierAssigned(payload: CourierAssignedSocketEvent): Promise<void> {
    this.getServer()
      .to(`order-tracking-${payload.orderId}`)
      .emit('order.courier.assigned', {
        ...payload,
        assignedAt: new Date().toISOString(),
      });
  }

  async emitCourierLocation(payload : CourierLocationSocketEvent): Promise<void> {
    this.getServer()
      .to(`order-tracking-${payload.orderId}`)
      .emit('order.tracking.updated', {
        ...payload,
        updatedAt: new Date().toISOString(),
    });
  }


}
