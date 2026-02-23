import { Inject, Injectable } from "@nestjs/common";
import { CourierRepository, CourierRepositorySymbol } from "../../domain/repository/courier.repository";
import { OrderRepository, OrderRepositorySymbol } from "../../domain/repository/order.repository";
import { EtaService, EtaServiceSymbol } from "../../domain/services/eta.service";
import { SocketServerGateway, SocketServerGatewaySymbol } from "../../domain/services/socket.server";
import { CourierNotFoundException } from "../exceptions/courier-not-found.exception";
import { OrderNotFoundException } from "../exceptions/order-not-found.exception";

@Injectable()
export class AssignCourierToOrderUseCase {
  constructor(
    @Inject(OrderRepositorySymbol)
    private readonly orderRepository: OrderRepository,

    @Inject(CourierRepositorySymbol)
    private readonly courierRepository: CourierRepository,

    @Inject(SocketServerGatewaySymbol)
    private readonly socketGateway: SocketServerGateway,
  ) {}

  async execute(orderId: string, courierId: string) {
    
    try {
    const order = await this.orderRepository.getById(orderId);
    const courier = await this.courierRepository.getById(courierId);

    if (!order) throw new OrderNotFoundException();
    if (!courier) throw new CourierNotFoundException();

    order.assignCourier(courierId);
    courier.assignOrder();

    // 3️⃣ Persistencia
    await this.orderRepository.save(order);
    await this.courierRepository.save(courier);

    await this.socketGateway.emitCourierAssigned({
      orderId,
      courierId,
    });

    return {
      orderId,
      courierId
    };
    }catch(error){
      console.log(error);
      throw error;
    }
  }
}
