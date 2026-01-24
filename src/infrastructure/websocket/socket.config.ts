import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

export abstract class SocketConfig
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  protected server: Server;

  protected readonly logger = new Logger(this.constructor.name);

  afterInit(server: Server) {
    this.logger.log('🧠 OrderGateway WebSocket inicializado');
  }

  protected getServer(): Server {
    if (!this.server) {
      throw new Error('WebSocket server not initialized');
    }
    return this.server;
  }

  handleConnection(client: Socket) {
    this.logger.log(`🔌 Cliente conectado: ${client.id}`);
    const role = String(client.handshake.query.role);
    const courierId = String(client.handshake.query.courierId);
    const orderId = String(client.handshake.query.orderId);

    // 🛵 Courier
    if (role === 'courier' && courierId) {
      client.join(`courier-${courierId}`);
      this.logger.log(`🛵 Courier unido a courier-${courierId}`);
      return;
    }

    // 👤 Usuario que trackea
    if (role === 'user' && courierId && orderId) {
      client.join(`tracking-courier-${courierId}`);
      client.join(`order-${orderId}`);
      this.logger.log(`👤 User unido a tracking-courier-${courierId}`);
      return;
    }

    this.logger.warn(`❌ Cliente no autorizado`);
    client.disconnect();
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Cliente desconectado: ${client.id}`);
  }
}
