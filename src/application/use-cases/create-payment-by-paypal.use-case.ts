import { Inject, Injectable } from "@nestjs/common";
import { PaypalPaymentGateway, PaypalPaymentGatewaySymbol } from "../../domain/services/paypal.gateway";
import { CreatePaymentPaypalDto } from "../dto/request/create-order-paypal.dto";
import {
  PaymentRepository,
  PaymentRepositorySymbol,
} from "../../domain/repository/payment.repository";
import { OrderGateway, OrderGatewaySymbol } from "../../domain/services/order.gateway";
import { Payment } from "../../domain/payment.entity";
import { OrderNotPayableException } from "../exceptions/order-not-payable.exception";
import { InvalidReturnUrlException } from "../exceptions/invalid-return-url.exception";

// PayPal no opera con CLP: se cobra en USD el equivalente congelado en la orden
const CHARGE_CURRENCY = 'USD';

@Injectable()
export class CreatePaymentPaypalUseCase {
  constructor(
    @Inject(PaypalPaymentGatewaySymbol)
    private readonly paypalPaymentGateway: PaypalPaymentGateway,
    @Inject(PaymentRepositorySymbol)
    private readonly paymentRepository: PaymentRepository,
    @Inject(OrderGatewaySymbol)
    private readonly orderGateway: OrderGateway,
  ) {}

  async execute(userId: string, accessToken: string, dto: CreatePaymentPaypalDto) {
    const { orderId, provider, successUrl, cancelUrl } = dto.Payment;

    this.assertAllowedReturnUrl(successUrl);
    this.assertAllowedReturnUrl(cancelUrl);

    // order solo devuelve la orden si pertenece al usuario del token
    const order = await this.orderGateway.getOrder(orderId, accessToken);

    if (!order || order.userId !== userId || order.status !== 'PENDING') {
      throw new OrderNotPayableException();
    }

    const { providerOrderId, approveLink } = await this.paypalPaymentGateway.createOrder({
      orderId,
      amount: order.totalUsd,
      currency: CHARGE_CURRENCY,
      successUrl,
      cancelUrl,
    });

    const payment = Payment.create({
      orderId,
      userId,
      amount: order.totalUsd,
      currency: CHARGE_CURRENCY,
      amountClp: order.totalClp,
      exchangeRateUsdClp: order.exchangeRateUsdClp,
      provider,
      providerOrderId,
    });

    const paymentId = await this.paymentRepository.save(payment);

    return {
      paymentId,
      providerOrderId,
      redirectUrl: approveLink,
      amountUsd: order.totalUsd,
      amountClp: order.totalClp,
    };
  }

  // PAYMENT_ALLOWED_RETURN_URLS: prefijos permitidos separados por coma
  private assertAllowedReturnUrl(url: string) {
    const allowed = (process.env.PAYMENT_ALLOWED_RETURN_URLS ?? '')
      .split(',')
      .map((prefix) => prefix.trim())
      .filter(Boolean);

    if (!allowed.some((prefix) => url.startsWith(prefix))) {
      throw new InvalidReturnUrlException();
    }
  }
}
