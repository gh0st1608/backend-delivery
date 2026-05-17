import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateOrderUseCase } from '../../application/use-cases/create-order.usecase';
import { GetOrderByIdUseCase } from '../../application/use-cases/get-order-by-id.usecase';
import { CreateOrderDto } from '../../application/dto/request/create-order.dto';
import { UpdateStatusDto } from '../../application/dto/request/update-order-status.dto';
import { UpdateOrderStatusDeliveryUseCase } from '../../application/use-cases/update-status.usecase';
import { HttpStatusResponse } from '../../domain/constants/http-code';
import { Entities } from '../../domain/constants/enums';
import { DomainSuccessMessages } from '../../domain/constants/messages';
import { AssignCourierToOrderUseCase } from '../../application/use-cases/assign-courier-to-order.usecase';
import { GetOrderStatusUseCase } from '../../application/use-cases/get-order-status.usecase';
import { GetByParamsDto } from '../../application/dto/request/get-by-params.dto';
import { GetOrdersUseCase } from '../../application/use-cases/get-orders.usecase';

@Controller('order')
export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly getOrderByIdUseCase: GetOrderByIdUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusDeliveryUseCase,
    private readonly assignCourierToOrderUseCase: AssignCourierToOrderUseCase,
    private readonly getOrderStatusUseCase: GetOrderStatusUseCase,
    private readonly getOrdersUseCase: GetOrdersUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const orderId = await this.createOrderUseCase.execute(dto);
    return this.ok(
      Entities.ORDER,
      orderId,
      DomainSuccessMessages.GET_ORDER_SUCESS,
    );
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const { order } = await this.getOrderByIdUseCase.execute(id);
    return this.ok(
      Entities.ORDER,
      order,
      DomainSuccessMessages.GET_ORDER_SUCESS,
    );
  }

  @Get()
  async getList(@Query() query: GetByParamsDto) {
    const users = await this.getOrdersUseCase.execute(query);
    return this.okPaginated(
      users.items,
      users.count,
      users.nextCursor,
      DomainSuccessMessages.GET_COURIER_SUCESS,
    );
  }

  @Patch(':orderId/status')
  async updateStatusOrder(
    @Param('orderId') orderId: string,
    @Body() body: UpdateStatusDto,
  ) {
    const { statusDelivery } = body.Order;
    return this.updateOrderStatusUseCase.execute(orderId, statusDelivery);
  }

  @Get(':orderId/status-delivery')
  async getStatusOrder(@Param('orderId') orderId: string) {
    const statusDelivery = await this.getOrderStatusUseCase.execute(orderId);
    return this.ok(
      Entities.ORDER,
      statusDelivery,
      DomainSuccessMessages.GET_ORDER_STATUS_SUCESS,
    );
  }

  @Get(':orderId/assign/:courierId')
  async assignCourier(
    @Param('orderId') orderId: string,
    @Param('courierId') courierId: string,
  ) {
    return this.assignCourierToOrderUseCase.execute(orderId, courierId);
  }

  private ok<T>(key: string, data: T, message: string) {
    return {
      [key]: data,
      statusCode: HttpStatusResponse.OK,
      message,
    };
  }

  private okPaginated<T>(
    items: T[],
    count: number,
    nextCursor?: string,
    message?: string,
  ) {
    return {
      items,
      count,
      nextCursor,
      statusCode: HttpStatusResponse.OK,
      message,
    };
  }
}
