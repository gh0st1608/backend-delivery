import { CourierAssignedSocketEvent, CourierLocationSocketEvent } from "../interfaces/event-socket.interface";

export interface SocketServerGateway {
  emitCourierLocation(payload : CourierLocationSocketEvent): Promise<void>;
  emitCourierAssigned(payload: CourierAssignedSocketEvent): Promise<void>;
}


export const SocketServerGatewaySymbol = Symbol('SocketServerGateway');

