//https://developer.paypal.com/docs/api/orders/v2/#orders_create
export interface CreateOrderPaypalApiRequest {
  intent: 'CAPTURE';
  purchase_units: {
    reference_id: string;
    amount: {
      currency_code: string;
      value: string;
    };
  }[];
  application_context: {
    return_url: string;
    cancel_url: string;
  };
}

export interface CreateOrderPaypalApiResponse {
  id: string;
  status: string;
  payment_source: {
    paypal: Object;
  };
  links: {
    href: string;
    rel: string;
    method: string;
  }[];
}

export interface CaptureOrderPaypalApiResponse {
  id: string;
  status: string;
  purchase_units: Array<{
    reference_id: string;
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }>;
    };
  }>;
  payer: {
    email_address: string;
    payer_id: string;
  };
}

export interface CreateOrderRequest {
  orderId: string;
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateOrderResponse {
  providerOrderId: string;
  status: string;
  approveLink: string;
}

export interface CaptureOrderResponse {
  providerOrderId: string;
  providerReferenceOrderId: string;
  providerOrderStatus: string;
  providerPaymentId: string;
  providerPaymentStatus: string;
  payerEmail: string;
  payerId: string;
}

export interface PaypalConfig {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
}
