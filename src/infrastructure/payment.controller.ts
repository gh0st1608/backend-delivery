import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreatePaymentUseCase } from '../application/use-cases/create-payment.use-case';
import { ConfirmPaymentUseCase } from '../application/use-cases/confirm-payment.use-case';
import { CreatePaymentDto } from '../application/dto/request/create-payment.dto';
import { ConfirmPaymentDto } from '../application/dto/request/confirm-payment.dto';
import { HttpStatusResponse } from '../domain/constants/http-code';
import { Entities } from '../domain/types/shared';
import { DomainSuccessMessages } from '../domain/constants/messages';
import { GetByParamsDto } from '../application/dto/request/get-by-params.dto';
import { GetPaymentsUseCase } from '../application/use-cases/get-payments.use-case';
import { CreatePaymentPaypalDto } from '../application/dto/request/create-order-paypal.dto';
import { CreatePaymentPaypalUseCase } from '../application/use-cases/create-payment-by-paypal.use-case';
import { JwtAuthGuard } from './security/jwt-auth.guard';
import { InternalApiKeyGuard } from './security/internal-api-key.guard';
import { CurrentUser } from './security/current-user.decorator';
import { extractBearerToken } from './security/jwt-verifier';
import { AuthenticatedUser } from '../domain/interfaces/security.interface';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly createPaymentUseCase: CreatePaymentUseCase,
    private readonly createPaymentPaypalUseCase: CreatePaymentPaypalUseCase,
    private readonly confirmPaymentUseCase: ConfirmPaymentUseCase,
    private readonly getPaymentsUseCase: GetPaymentsUseCase,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('paypal')
  async createPaymentPaypal(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('authorization') authorization: string,
    @Body() dto: CreatePaymentPaypalDto,
  ) {
    const { providerOrderId, redirectUrl, paymentId, amountUsd, amountClp } =
      await this.createPaymentPaypalUseCase.execute(
        user.userId,
        extractBearerToken(authorization)!,
        dto,
      );

    return this.ok(
      Entities.PAYMENT,
      { providerOrderId, redirectUrl, paymentId, amountUsd, amountClp },
      DomainSuccessMessages.CREATE_PAYMENT_PAYPAL_SUCESS,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('confirm')
  async confirmPaymentPaypal(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ConfirmPaymentDto,
  ) {
    const { orderId, paymentId, providerPaymentId, providerPaymentStatus } =
      await this.confirmPaymentUseCase.execute(user.userId, body);

    return this.ok(
      Entities.PAYMENT,
      {
        orderId,
        paymentId,
        providerPaymentId,
        providerPaymentStatus,
      },
      DomainSuccessMessages.CONFIRM_PAYMENT_SUCESS,
    );
  }

  // Registro manual y listado: solo administración / servicios internos
  @UseGuards(InternalApiKeyGuard)
  @Post()
  async create(@Body() dto: CreatePaymentDto) {
    const { paymentId } = await this.createPaymentUseCase.execute(dto);
    return this.ok(
      Entities.PAYMENT,
      paymentId,
      DomainSuccessMessages.CONFIRM_PAYMENT_SUCESS,
    );
  }

  @UseGuards(InternalApiKeyGuard)
  @Get()
  async getPayments(@Query() query: GetByParamsDto) {
    const payments = await this.getPaymentsUseCase.execute(query);
    return this.okPaginated(
      payments.items,
      payments.count,
      payments.nextCursor,
      DomainSuccessMessages.GET_PAYMENTS_SUCESS,
    );
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
