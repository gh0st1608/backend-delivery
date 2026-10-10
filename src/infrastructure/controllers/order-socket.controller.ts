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
import { Inject } from '@nestjs/common';
import {
  OrderRepository,
  OrderRepositorySymbol,
} from '../../domain/repository/order.repository';
import { verifyAccessToken } from '../security/jwt-verifier';

@WebSocketGateway()
export class OrderTrackingGateway extends SocketConfig {
  constructor(
    private readonly updateCourierLocationUseCase: UpdateCourierLocationUseCase,
    @Inject(OrderRepositorySymbol)
    private readonly orderRepository: OrderRepository,
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
  // Solo el dueño de la orden puede seguirla: la sala transmite la ubicación
  // del repartidor y la dirección de entrega.
  @SubscribeMessage('order.tracking.join')
  async handleJoinOrder(
    @MessageBody() payload: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.authenticate(client);
    const order = userId && payload?.orderId
      ? await this.orderRepository.getById(payload.orderId)
      : null;

    if (!order || !order.isOwnedBy(userId!)) {
      return { status: 'error', message: 'No autorizado' };
    }

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

  // Token en el handshake: io(url, { auth: { token } })
  private authenticate(client: Socket): string | null {
    try {
      const token = client.handshake.auth?.token;
      return token ? verifyAccessToken(token).userId : null;
    } catch {
      return null;
    }
  }
}
