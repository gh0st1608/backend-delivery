import { Inject, Injectable } from "@nestjs/common";
import { PaypalPaymentGateway, PaypalPaymentGatewaySymbol } from "../../domain/services/paypal.gateway";
import { CreatePaymentPaypalDto } from "../dto/request/create-order-paypal.dto";
import { CreatePaymentUseCase } from "./create-payment.use-case";

@Injectable()
export class CreatePaymentPaypalUseCase {
  constructor(
    private readonly createPaymentUseCase: CreatePaymentUseCase,

    @Inject(PaypalPaymentGatewaySymbol)
    private readonly paypalPaymentGateway: PaypalPaymentGateway,
  ) {}

  async execute(dto: CreatePaymentPaypalDto) {
    const {
      orderId,
      amount,
      currency,
      provider,
      successUrl,
      cancelUrl,
    } = dto.Payment;

    const { providerOrderId, approveLink } = await this.paypalPaymentGateway.createOrder({
      orderId,
      amount,
      currency,
      successUrl,
      cancelUrl,
    });

    const { paymentId } = await this.createPaymentUseCase.execute({
      Payment: {
        orderId,
        amount,
        currency,
        provider,
        providerOrderId
      },
    });

    return {
      paymentId,
      providerOrderId,
      redirectUrl: approveLink,
    };
  }
}

