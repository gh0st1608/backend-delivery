import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateOrderUseCase } from '../../application/use-cases/create-order.usecase';
import { GetOrderByIdUseCase } from '../../application/use-cases/get-order-by-id.usecase';
import { CreateOrderDto } from '../../application/dto/request/create-order.dto';
import { UpdateStatusDto } from '../../application/dto/request/update-order-status.dto';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/update-status.usecase';

@Controller('order')
export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly getOrderByIdUseCase: GetOrderByIdUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.createOrderUseCase.execute(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.getOrderByIdUseCase.execute(id);
  }

  @Patch(':orderId/status')
  async updateStatus(
    @Param('orderId') orderId: string,
    @Body() body: UpdateStatusDto,
  ) {
    const { status } = body.Order;
    return this.updateOrderStatusUseCase.execute(orderId, status);
  }

}
