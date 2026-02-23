import { Injectable } from '@nestjs/common';
import { PaypalPaymentGateway } from '../../domain/services/paypal.gateway';
import axios from 'axios';
import {
  CaptureOrderPaypalApiResponse,
  CaptureOrderResponse,
  CreateOrderPaypalApiRequest,
  CreateOrderPaypalApiResponse,
  CreateOrderRequest,
  CreateOrderResponse,
} from '../interfaces/paypal.interface';
import { PaypalConfigProvider } from '../config/paypal.provider';

@Injectable()
export class PaypalPaymentGatewayImpl implements PaypalPaymentGateway {
  constructor(private readonly paypalConfig: PaypalConfigProvider) {}

  async createOrder(
    paypalOrder: CreateOrderRequest,
  ): Promise<CreateOrderResponse> {
    const accessToken = await this.getAccessToken();
    const { baseUrl } = this.paypalConfig.getConfig();
    const payload: CreateOrderPaypalApiRequest = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: paypalOrder.orderId,
          amount: {
            currency_code: paypalOrder.currency,
            value: paypalOrder.amount.toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: paypalOrder.successUrl,
        cancel_url: paypalOrder.cancelUrl,
      },
    };

    const {
      data: { status, id, links },
    } = await axios.post<CreateOrderPaypalApiResponse>(
      `${baseUrl}/v2/checkout/orders`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const approveLink = links.find((l) => l.rel === 'approve').href;

    // 🔒 Retornas SOLO tu contrato
    return {
      providerOrderId: id,
      status,
      approveLink,
    };
  }

  async captureOrder(token: string): Promise<CaptureOrderResponse> {
    const accessToken = await this.getAccessToken();
    const { baseUrl } = this.paypalConfig.getConfig();

    const {
      data: { status, id, payer, purchase_units },
    } = await axios.post<CaptureOrderPaypalApiResponse>(
      `${baseUrl}/v2/checkout/orders/${token}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const paymentsCaptured = purchase_units[0].payments.captures[0];
    const orderId = purchase_units[0].reference_id;

    return {
      providerOrderId: id,
      providerReferenceOrderId: orderId,
      providerOrderStatus: status,
      providerPaymentId: paymentsCaptured.id,
      providerPaymentStatus: paymentsCaptured.status,
      payerEmail: payer.email_address,
      payerId: payer.payer_id,
    };
  }

  // ======================================================
  // PRIVATE
  // ======================================================

  private async getAccessToken(): Promise<string> {
    const { baseUrl, clientId, clientSecret } = this.paypalConfig.getConfig();

    const response = await axios.post(
      `${baseUrl}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        auth: {
          username: clientId,
          password: clientSecret,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    return response.data.access_token;
  }
}
