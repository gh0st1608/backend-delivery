import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  OrderForPayment,
  OrderGateway,
} from '../../domain/services/order.gateway';

@Injectable()
export class OrderHttpClientImpl implements OrderGateway {
  private readonly logger = new Logger(OrderHttpClientImpl.name);
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.ORDER_MS_BASE_URL ?? 'http://localhost:3004/order',
      timeout: 5000,
    });
  }

  async getOrder(
    orderId: string,
    accessToken: string,
  ): Promise<OrderForPayment | null> {
    try {
      const { data } = await this.client.get(`/${encodeURIComponent(orderId)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const order = data?.Data?.order;
      if (!order) return null;

      return {
        orderId: order.orderId,
        userId: order.userId,
        status: order.status,
        totalUsd: Number(order.totalUsd),
        totalClp: Number(order.totalClp),
        exchangeRateUsdClp: Number(order.exchangeRateUsdClp),
      };
    } catch (error: any) {
      // 404 = no existe o no es del usuario
      if (error?.response?.status && error.response.status < 500) return null;

      this.logger.error(`No se pudo obtener la orden ${orderId}`, error);
      throw error;
    }
  }
}
