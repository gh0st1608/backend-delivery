import { ArgumentsHost, Catch } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch(WsException)
export class WsExceptionFilter {
  public catch(exception: WsException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();
    this.handleError(client, exception);
  }

  public handleError(client: Socket, exception: WsException) {
    const objError = {
      statusCode: 400,
      client_id: client.id,
      timestamp: new Date().toISOString(),
      message: exception.getError(),
    };
    // handle websocket exception
    client.emit('on-error', objError);
    client.in(client.id).socketsJoin('on-error');
  }
}