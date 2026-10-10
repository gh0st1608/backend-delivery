import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
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
import { ConfirmDeliveryUseCase } from '../../application/use-cases/confirm-delivery.usecase';
import { GetPricingUseCase } from '../../application/use-cases/get-pricing.usecase';
import { JwtAuthGuard } from '../security/jwt-auth.guard';
import { InternalApiKeyGuard } from '../security/internal-api-key.guard';
import { CurrentUser } from '../security/current-user.decorator';
import { AuthenticatedUser } from '../../domain/interfaces/security.interface';

@Controller('order')
export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly getOrderByIdUseCase: GetOrderByIdUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusDeliveryUseCase,
    private readonly assignCourierToOrderUseCase: AssignCourierToOrderUseCase,
    private readonly getOrderStatusUseCase: GetOrderStatusUseCase,
    private readonly getOrdersUseCase: GetOrdersUseCase,
    private readonly confirmDeliveryUseCase: ConfirmDeliveryUseCase,
    private readonly getPricingUseCase: GetPricingUseCase,
  ) {}

  // =======================
  // CLIENTE (access token)
  // =======================

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto,
  ) {
    const order = await this.createOrderUseCase.execute(user.userId, dto);
    return this.ok(
      Entities.ORDER,
      order,
      DomainSuccessMessages.CREATE_ORDER_SUCCESS,
    );
  }

  // Tarifa de envío y tipo de cambio vigentes (para el resumen del carrito)
  @UseGuards(JwtAuthGuard)
  @Get('pricing')
  async getPricing() {
    const pricing = await this.getPricingUseCase.execute();
    return this.ok('pricing', pricing, DomainSuccessMessages.GET_PRICING_SUCCESS);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getList(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetByParamsDto,
  ) {
    const orders = await this.getOrdersUseCase.execute(user.userId, query);
    return this.okPaginated(
      orders.items,
      orders.count,
      orders.nextCursor,
      DomainSuccessMessages.GET_ORDERS_SUCCESS,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const { order } = await this.getOrderByIdUseCase.execute(id, user.userId);
    return this.ok(
      Entities.ORDER,
      order,
      DomainSuccessMessages.GET_ORDER_SUCESS,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':orderId/status-delivery')
  async getStatusOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId') orderId: string,
  ) {
    const statusDelivery = await this.getOrderStatusUseCase.execute(
      orderId,
      user.userId,
    );
    return this.ok(
      Entities.ORDER,
      statusDelivery,
      DomainSuccessMessages.GET_ORDER_STATUS_SUCESS,
    );
  }

  // El cliente confirma que recibió su pedido
  @UseGuards(JwtAuthGuard)
  @Patch(':orderId/confirm-delivery')
  async confirmDelivery(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId') orderId: string,
  ) {
    const order = await this.confirmDeliveryUseCase.execute(
      orderId,
      user.userId,
    );
    return this.ok(
      Entities.ORDER,
      order,
      DomainSuccessMessages.UPDATE_ORDER_SUCCESS,
    );
  }

  // ==========================================
  // REPARTIDOR / OPERADOR (clave interna)
  // Hasta que exista la plataforma de administración con roles
  // ==========================================

  @UseGuards(InternalApiKeyGuard)
  @Patch(':orderId/status')
  async updateStatusOrder(
    @Param('orderId') orderId: string,
    @Body() body: UpdateStatusDto,
  ) {
    const { statusDelivery } = body.Order;
    const order = await this.updateOrderStatusUseCase.execute(
      orderId,
      statusDelivery,
    );
    return this.ok(
      Entities.ORDER,
      order,
      DomainSuccessMessages.UPDATE_ORDER_SUCCESS,
    );
  }

  // Asignación manual (Settings.assignment.mode = MANUAL o reasignación)
  @UseGuards(InternalApiKeyGuard)
  @Post(':orderId/assign/:courierId')
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
