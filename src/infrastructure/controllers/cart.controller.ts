import { CreateItemCartUseCase } from '../../application/use-cases/create-item-cart.usecase';
import { GetCartUseCase } from '../../application/use-cases/get-cart-by-user.usecase';
import { RemoveItemUseCase } from '../../application/use-cases/remove-item.usecase';
import { ClearCartUseCase } from '../../application/use-cases/clear-cart.usecase';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  ItemCartDto,
  ItemCartPayloadDto,
} from '../../application/dto/request/create-item-cart.dto';

@Controller('cart')
export class CartController {
  constructor(
    private readonly createItemCartUseCase: CreateItemCartUseCase,
    private readonly getCartUseCase: GetCartUseCase,
    private readonly removeItemUseCase: RemoveItemUseCase,
    private readonly clearCartUseCase: ClearCartUseCase,
  ) {}

  @Post(':userId/items')
  async addItem(@Param('userId') userId: string, @Body() body: ItemCartDto) {
    return this.createItemCartUseCase.execute(userId, body);
  }

  @Get(':userId')
  async getByUser(@Param('userId') userId: string) {
    return this.getCartUseCase.execute(userId);
  }

  @Delete('/:userId/items/:productId')
  async deleteItemByUser(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.removeItemUseCase.execute(userId, productId);
  }

  @Delete('/:userId')
  async clearItemByUser(
    @Param('userId') userId: string
  ) {
    return this.clearCartUseCase.execute(userId);
  }
}
