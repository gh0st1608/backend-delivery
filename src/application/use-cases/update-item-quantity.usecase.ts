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
import { CartItemNotFoundException } from '../exceptions/cart-item-not-found.exception';
import { CartEventPublisherSymbol } from '../../domain/services/cart-event.publisher';
import { UpdateItemCartDto } from '../dto/request/update-item-cart.dto';

@Injectable()
export class UpdateItemQuantityUseCase {
  constructor(
    @Inject(CartRepositorySymbol) private readonly cartRepo: CartRepository,
    @Inject(CartEventPublisherSymbol)
    private readonly publisher: EventBridgeCartEventPublisher,
  ) {}

  async execute(userId: string, productId: string, dto: UpdateItemCartDto) {
    try {
      const { quantity } = dto.Cart;
      const cart = await this.cartRepo.getByUserId(userId);
      if (!cart) throw new CartNotFoundException();

      // quantity = 0 elimina el item del carrito
      const updated = cart.updateItemQuantity(productId, quantity);
      if (!updated) throw new CartItemNotFoundException();

      const cartId = await this.cartRepo.save(cart);

      const ev = buildDomainEvent(CART_EVENTS.CART_UPDATED, {
        userId,
        productId,
        quantity,
        total: cart.total(),
      });

      await this.publisher.publishCartUpdated(ev);

      return {
        cart: {
          cartId,
        },
        statusCode: HttpStatusResponse.OK,
        message: DomainSuccessMessages.UPDATE_ITEM_CART_SUCCESS,
      };
    } catch (error) {
      throw error;
    }
  }
}
