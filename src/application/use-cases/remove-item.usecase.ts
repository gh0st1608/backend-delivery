import { Inject, Injectable } from '@nestjs/common';
import {
  CartRepository,
  CartRepositorySymbol,
} from '../../domain/repository/cart.repository';
import { EventBridgeCartEventPublisher } from '../../infrastructure/eventbridge/eventbridge-cart-event.publisher';
import { HttpStatusResponse } from '../../domain/constants/http-code';
import { DomainSuccessMessages } from '../../domain/constants/messages';
import { buildDomainEvent } from '../builder-event';
import { CART_EVENTS } from '../events/cart.events';
import { CartNotFoundException } from '../exceptions/cart-not-found.exception';
import { CartEventPublisherSymbol } from '../../domain/services/cart-event.publisher';

@Injectable()
export class RemoveItemUseCase {
  constructor(
    @Inject(CartRepositorySymbol) private readonly cartRepo: CartRepository,
    @Inject(CartEventPublisherSymbol)
    private readonly publisher: EventBridgeCartEventPublisher,
  ) {}

  async execute(userId: string, productId: string) {
    try {
      const cart = await this.cartRepo.getByUserId(userId);
      if (!cart) throw CartNotFoundException;
      cart.removeItem(productId);
      const cartId = await this.cartRepo.save(cart);

      const ev = buildDomainEvent(CART_EVENTS.ITEM_REMOVED, {
        userId,
        productId,
        total: cart.total(),
      });

      await this.publisher.publishItemRemoved(ev);

      return {
        cart: {
          cartId,
        },
        statusCode: HttpStatusResponse.OK,
        message: DomainSuccessMessages.REMOVE_ITEM_SUCESS,
      };
    } catch (error) {
      throw error;
    }
  }
}
