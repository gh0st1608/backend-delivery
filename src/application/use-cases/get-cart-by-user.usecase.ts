import { Inject, Injectable } from '@nestjs/common';
import {
  CartRepository,
  CartRepositorySymbol,
} from '../../domain/repository/cart.repository';
import { HttpStatusResponse } from '../../domain/constants/http-code';
import { DomainSuccessMessages } from '../../domain/constants/messages';

@Injectable()
export class GetCartUseCase {
  constructor(
    @Inject(CartRepositorySymbol) private readonly cartRepo: CartRepository,
  ) {}

  async execute(userId: string) {
    try {
      const cart = await this.cartRepo.getByUserId(userId);

      // Un usuario sin carrito tiene un carrito vacío, no un error
      return {
        cart: {
          items: cart ? cart.listItems() : [],
          total: cart ? cart.total() : 0,
        },
        statusCode: HttpStatusResponse.OK,
        message: DomainSuccessMessages.GET_CART_SUCESS,
      };
    } catch (error) {
      throw error;
    }
  }
}
