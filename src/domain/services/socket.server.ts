export interface SocketServerGateway {
  emitLocation(
    courierId: string,
    orderId: string,
    lat: number,
    lng: number,
  ): Promise<void>;
}


export const SocketServerGatewaySymbol = Symbol('SocketServerGateway');

