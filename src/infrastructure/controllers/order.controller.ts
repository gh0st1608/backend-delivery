import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateOrderUseCase } from '../../application/use-cases/create-order.application';
import { GetOrderByIdUseCase } from '../../application/use-cases/get-order-by-id.application';
import { CreateOrderDto } from '../../application/dto/request/create-order.dto';

@Controller('order')
export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly getOrderByIdUseCase: GetOrderByIdUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.createOrderUseCase.execute(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.getOrderByIdUseCase.execute(id);
  }
}
