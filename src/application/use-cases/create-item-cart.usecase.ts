import { Inject, Injectable } from '@nestjs/common';
import {
  CartRepository,
  CartRepositorySymbol,
} from '../../domain/repository/cart.repository';
import { ItemCartDto } from '../dto/request/create-item-cart.dto';
import { EventBridgeCartEventPublisher } from '../../infrastructure/eventbridge/eventbridge-cart-event.publisher';
import { Cart } from '../../domain/entities/cart.entity';
import { HttpStatusResponse } from '../../domain/constants/http-code';
import { DomainSuccessMessages } from '../../domain/constants/messages';
import { buildDomainEvent } from '../builder-event';
import { CART_EVENTS } from '../events/cart.events';
import { CartEventPublisherSymbol } from '../../domain/services/cart-event.publisher';

@Injectable()
export class CreateItemCartUseCase {
  constructor(
    @Inject(CartRepositorySymbol)
    private readonly cartRepo: CartRepository,
    @Inject(CartEventPublisherSymbol)
    private readonly publisher: EventBridgeCartEventPublisher,
  ) {}

  async execute(userId: string, dto: ItemCartDto) {
    try {
      const { productId, name, price, quantity } = dto.Cart;
      console.log('dto', dto);
      let cart = await this.cartRepo.getByUserId(userId);
      console.log('cart', cart);
      if (!cart) cart = Cart.create(userId);

      cart.addItem({ productId, name, price, quantity });
      console.log('cart', cart);
      const cartId = await this.cartRepo.save(cart);
      console.log('cartId', cartId);
      const ev = buildDomainEvent(CART_EVENTS.ITEM_ADDED, {
        userId,
        productId,
        quantity,
        total: cart.total(),
      });

      await this.publisher.publishItemAdded(ev);

      return {
        cart: {
          cartId,
        },
        statusCode: HttpStatusResponse.OK,
        message: DomainSuccessMessages.CREATE_ITEM_CART_SUCCESS,
      };
    } catch (error) {
      throw error;
    }
  }
}
