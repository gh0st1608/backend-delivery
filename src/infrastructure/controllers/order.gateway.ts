import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SocketConfig } from '../websocket/socket.config';
import { UpdateOrderLocationUseCase } from '../../application/use-cases/update-order-location.usecase';
import { UpdateOrderLocationDto } from '../../application/dto/request/update-order-location.dto';

@WebSocketGateway()
export class OrderGateway extends SocketConfig {
  constructor(
    private readonly updateOrderLocationUseCase: UpdateOrderLocationUseCase,
  ) {
    super();
  }

  @SubscribeMessage('order.location.update')
  handleOrderLocation(
    @MessageBody('Data') dto: UpdateOrderLocationDto,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`📍 Location update from ${client.id}`);
    this.updateOrderLocationUseCase.execute(dto);

    return {
      status: 'ok',
      receivedAt: new Date().toISOString(),
    };
  }
}

