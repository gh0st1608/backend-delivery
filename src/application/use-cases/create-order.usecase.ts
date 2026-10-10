// src/application/create-order.application.ts
import { Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto } from '../dto/request/create-order.dto';
import { Order, OrderItemProps } from '../../domain/order.entity';
import {
  OrderRepository,
  OrderRepositorySymbol,
} from '../../domain/repository/order.repository';
import {
  StoreLocationService,
  StoreLocationServiceSymbol,
} from '../../domain/services/store.repository';
import {
  CatalogService,
  CatalogServiceSymbol,
} from '../../domain/services/catalog.service';
import {
  ExchangeRateService,
  ExchangeRateServiceSymbol,
} from '../../domain/services/exchange-rate.service';
import {
  SettingsRepository,
  SettingsRepositorySymbol,
} from '../../domain/repository/settings.repository';
import { OrderValidationException } from '../exceptions/order-validation.exception';
import { DomainErrorMessages } from '../../domain/constants/messages';

export interface CreateOrderResult {
  orderId: string;
  currency: 'CLP';
  subtotalClp: number;
  deliveryFeeClp: number;
  totalClp: number;
  exchangeRateUsdClp: number;
  totalUsd: number;
}

/**
 * Crea la orden en estado PENDING (pendiente de pago).
 * El repartidor NO se asigna aquí: se asigna cuando llega el evento
 * PaymentApproved (ver HandlePaymentApprovedUseCase).
 */
@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(OrderRepositorySymbol)
    private readonly orderRepository: OrderRepository,
    @Inject(StoreLocationServiceSymbol)
    private readonly storeLocationService: StoreLocationService,
    @Inject(CatalogServiceSymbol)
    private readonly catalogService: CatalogService,
    @Inject(ExchangeRateServiceSymbol)
    private readonly exchangeRateService: ExchangeRateService,
    @Inject(SettingsRepositorySymbol)
    private readonly settingsRepository: SettingsRepository,
  ) {}

  async execute(userId: string, dto: CreateOrderDto): Promise<CreateOrderResult> {
    const { storeId, items, deliveryLat, deliveryLng } = dto.Order;

    // Precios desde el catálogo: el cliente no puede alterar el monto
    const orderItems = await this.resolveItems(storeId, items);

    const [{ pickupLat, pickupLng }, settings, rate] = await Promise.all([
      this.storeLocationService.getLocation(storeId),
      this.settingsRepository.getDeliverySettings(),
      this.exchangeRateService.getUsdClp(),
    ]);

    const order = Order.create({
      userId,
      storeId,
      pickupLat,
      pickupLng,
      dropoffLat: deliveryLat,
      dropoffLng: deliveryLng,
      items: orderItems,
      deliveryFeeClp: settings.pricing.deliveryFeeClp,
      exchangeRateUsdClp: rate.usdClp,
      exchangeRateSource: rate.source,
    });

    const orderId = await this.orderRepository.save(order);
    const totals = order.toPrimitives();

    return {
      orderId,
      currency: 'CLP',
      subtotalClp: totals.subtotalClp,
      deliveryFeeClp: totals.deliveryFeeClp,
      totalClp: totals.totalClp,
      exchangeRateUsdClp: totals.exchangeRateUsdClp,
      totalUsd: totals.totalUsd,
    };
  }

  private async resolveItems(
    storeId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<OrderItemProps[]> {
    // Un mismo producto repetido se agrupa en una sola línea
    const quantities = new Map<string, number>();
    for (const { productId, quantity } of items) {
      quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
    }

    const products = await Promise.all(
      [...quantities.keys()].map((id) => this.catalogService.getProduct(id)),
    );

    return products.map((product, index) => {
      const productId = [...quantities.keys()][index];
      const quantity = quantities.get(productId)!;

      if (!product || !product.active) {
        throw new OrderValidationException(
          DomainErrorMessages.PRODUCT_NOT_AVAILABLE,
        );
      }

      if (product.storeId !== storeId) {
        throw new OrderValidationException(DomainErrorMessages.MIXED_STORES);
      }

      if (product.stock < quantity) {
        throw new OrderValidationException(
          DomainErrorMessages.INSUFFICIENT_STOCK,
        );
      }

      return {
        productId: product.productId,
        name: product.name,
        price: product.priceClp,
        quantity,
      };
    });
  }
}
