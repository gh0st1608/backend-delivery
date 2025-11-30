import { Inject, Injectable } from '@nestjs/common';
import {
  CartRepository,
  CartRepositorySymbol,
} from '../../domain/repository/cart.repository';
import { HttpStatusResponse } from '../../domain/constants/http-code';
import { DomainSuccessMessages } from '../../domain/constants/messages';
import { CartNotFoundException } from '../exceptions/cart-not-found.exception';

@Injectable()
export class GetCartUseCase {
  constructor(
    @Inject(CartRepositorySymbol) private readonly cartRepo: CartRepository,
  ) {}

  async execute(userId: string) {
    const cart = await this.cartRepo.getByUserId(userId);
    if (!cart) throw CartNotFoundException;

    return {
      cart: {
        items: cart.listItems(),
        //total: cart.total(),
      },
      statusCode: HttpStatusResponse.OK,
      message: DomainSuccessMessages.GET_CART_SUCESS,
    };
  }
}
