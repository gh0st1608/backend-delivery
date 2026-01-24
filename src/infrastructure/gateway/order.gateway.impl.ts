import { Injectable } from "@nestjs/common";
import { SocketServerGateway } from "../../domain/services/socket.server";
import { WebSocketGateway } from "@nestjs/websockets";
import { SocketConfig } from "../websocket/socket.config";

@WebSocketGateway()
@Injectable()
export class SocketServerGatewayImpl
  extends SocketConfig
  implements SocketServerGateway {

  async emitLocation(
    courierId: string,
    orderId: string,
    lat: number,
    lng: number,
  ): Promise<void> {
    this.getServer()
      .to(`tracking-courier-${courierId}`)
      .emit('courier.location.updated', {
        orderId,
        lat,
        lng,
      });
  }
}

