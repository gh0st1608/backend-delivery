import { CreateItemCartUseCase } from '../../application/use-cases/create-item-cart.usecase';
import { GetCartUseCase } from '../../application/use-cases/get-cart-by-user.usecase';
import { RemoveItemUseCase } from '../../application/use-cases/remove-item.usecase';
import { ClearCartUseCase } from '../../application/use-cases/clear-cart.usecase';
import { UpdateItemQuantityUseCase } from '../../application/use-cases/update-item-quantity.usecase';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ItemCartDto } from '../../application/dto/request/create-item-cart.dto';
import { UpdateItemCartDto } from '../../application/dto/request/update-item-cart.dto';
import { JwtAuthGuard } from '../security/jwt-auth.guard';
import { CurrentUser } from '../security/current-user.decorator';
import { AuthenticatedUser } from '../../domain/interfaces/security.interface';

// El carrito siempre es el del usuario autenticado ("me"): el cliente nunca
// envía su userId, así no puede leer ni modificar carritos ajenos (IDOR/BOLA).
@UseGuards(JwtAuthGuard)
@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly createItemCartUseCase: CreateItemCartUseCase,
    private readonly getCartUseCase: GetCartUseCase,
    private readonly removeItemUseCase: RemoveItemUseCase,
    private readonly clearCartUseCase: ClearCartUseCase,
    private readonly updateItemQuantityUseCase: UpdateItemQuantityUseCase,
  ) {}

  @Post('carts/me/items')
  async addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ItemCartDto,
  ) {
    return this.createItemCartUseCase.execute(user.userId, body);
  }

  @Get('carts/me')
  async getByUser(@CurrentUser() user: AuthenticatedUser) {
    return this.getCartUseCase.execute(user.userId);
  }

  @Patch('carts/me/items/:productId')
  async updateItemQuantity(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId') productId: string,
    @Body() body: UpdateItemCartDto,
  ) {
    return this.updateItemQuantityUseCase.execute(user.userId, productId, body);
  }

  @Delete('carts/me/items/:productId')
  async deleteItemByUser(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId') productId: string,
  ) {
    return this.removeItemUseCase.execute(user.userId, productId);
  }

  @Delete('carts/me')
  async clearItemByUser(@CurrentUser() user: AuthenticatedUser) {
    return this.clearCartUseCase.execute(user.userId);
  }
}
