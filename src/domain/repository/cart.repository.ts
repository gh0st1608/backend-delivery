import { Cart } from '../entities/cart.entity';

export const CartRepositorySymbol = Symbol('CartRepository');

export interface CartRepository {
  getByUserId(userId: string): Promise<Cart | null>;
  save(cart: Cart): Promise<string>;
  delete(userId: string): Promise<void>;
}
