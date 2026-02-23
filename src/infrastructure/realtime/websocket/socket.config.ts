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

  protected getServer(): Server {
    if (!this.server) {
      throw new Error('WebSocket server not initialized');
    }
    return this.server;
  }

  handleConnection(client: Socket) {
  this.logger.log(`🔌 Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Cliente desconectado: ${client.id}`);
  }
}
