import { timingSafeEqual } from 'crypto';
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
import { extractBearerToken, verifyAccessToken } from '../security/jwt-verifier';

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
  // Lo emite el dispositivo del repartidor (sin login de repartidor aún): se
  // exige la clave interna en el handshake, igual que los endpoints /courier.
  @SubscribeMessage('order.tracking.update')
  async handleOrderLocation(
    @MessageBody('Data') dto: UpdateCourierLocationDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (!this.hasInternalKey(client)) {
      return { status: 'error', message: 'No autorizado' };
    }

    this.logger.log(`📍 Tracking update from ${client.id}`);
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

    return { status: 'ok' };
  }

  @SubscribeMessage('order.tracking.leave')
  handleLeaveOrder(
    @MessageBody() payload: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(SocketRooms.orderTracking(payload.orderId));
  }

  // Token en el handshake: io(url, { auth: { token } }) en la app; los clientes
  // que no pueden enviar `auth` (p. ej. Postman) usan "Authorization: Bearer".
  private authenticate(client: Socket): string | null {
    try {
      const token =
        client.handshake.auth?.token ??
        extractBearerToken(client.handshake.headers.authorization);
      return token ? verifyAccessToken(token).userId : null;
    } catch {
      return null;
    }
  }

  // Clave interna en el handshake: auth.apiKey (app) o header x-internal-api-key
  // (Postman). Comparación en tiempo constante.
  private hasInternalKey(client: Socket): boolean {
    const expected = process.env.INTERNAL_API_KEY ?? '';
    const received = String(
      client.handshake.auth?.apiKey ??
        client.handshake.headers['x-internal-api-key'] ??
        '',
    );
    return (
      expected.length > 0 &&
      received.length === expected.length &&
      timingSafeEqual(Buffer.from(received), Buffer.from(expected))
    );
  }
}
