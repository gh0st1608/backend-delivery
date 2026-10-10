export interface OrderForPayment {
  orderId: string;
  userId: string;
  status: string;
  totalUsd: number;
  totalClp: number;
  exchangeRateUsdClp: number;
}

// El monto a cobrar siempre sale de la orden, nunca del cliente
export interface OrderGateway {
  // accessToken del usuario: order valida que la orden le pertenezca
  getOrder(orderId: string, accessToken: string): Promise<OrderForPayment | null>;
}

export const OrderGatewaySymbol = Symbol('OrderGateway');
