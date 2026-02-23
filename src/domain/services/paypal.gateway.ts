import { CaptureOrderResponse, CreateOrderRequest, CreateOrderResponse } from '../../infrastructure/interfaces/paypal.interface'

export interface PaypalPaymentGateway {
  createOrder(order: CreateOrderRequest): Promise<CreateOrderResponse>;
  captureOrder(token: string): Promise<CaptureOrderResponse>;
}

export const PaypalPaymentGatewaySymbol = Symbol('PaypalPaymentGateway');