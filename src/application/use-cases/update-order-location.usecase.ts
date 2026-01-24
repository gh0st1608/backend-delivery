import { Inject, Injectable } from '@nestjs/common';
import { UpdateOrderLocationDto, UpdateOrderLocationPayloadDto } from '../dto/request/update-order-location.dto';
import { SocketServerGatewaySymbol, SocketServerGateway } from '../../domain/services/socket.server';

@Injectable()
export class UpdateOrderLocationUseCase {
  constructor(
    @Inject(SocketServerGatewaySymbol)
    private readonly socketServerGateway: SocketServerGateway,
  ) {}

  async execute(dto: UpdateOrderLocationDto): Promise<void> {
    const { courierId, orderId, lat, lng } = dto.Order;
    await this.socketServerGateway.emitLocation(
      courierId,
      orderId,
      lat,
      lng,
  );
  }
}
