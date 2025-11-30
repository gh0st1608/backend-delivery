import { v4 as uuidv4 } from 'uuid';

// =======================================================
// REQUIRED
// =======================================================

export interface CartRequired {
  readonly userId: string;
  readonly items: CartItemProps[];
}

// =======================================================
// OPTIONAL
// =======================================================

export interface CartOptional {
  readonly cartId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date | null;
  readonly deletedAt: Date | null;
}

export type CartProperties = CartRequired & Partial<CartOptional>;

// =======================================================
// UPDATE PARTIALS
// =======================================================

export type CartPropertiesUpdate = Partial<
  Pick<CartRequired, 'items'> & Pick<CartOptional, 'updatedAt' | 'deletedAt'>
>;

// =======================================================
// CART ITEM
// =======================================================

export interface CartItemProps {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export class CartItem {
  constructor(
    public readonly productId: string,
    public name: string,
    public price: number,
    public quantity: number,
  ) {}

  increase(q = 1) {
    this.quantity += q;
  }

  decrease(q = 1) {
    this.quantity = Math.max(0, this.quantity - q);
  }

  toJSON() {
    return {
      productId: this.productId,
      name: this.name,
      price: this.price,
      quantity: this.quantity,
    };
  }
}

// =======================================================
// CART ROOT ENTITY
// =======================================================

export class Cart {
  private readonly cartId: string;
  private readonly userId: string;
  private items: CartItem[];
  private readonly createdAt: Date;
  private updatedAt: Date | null;
  private deletedAt: Date | null;

  constructor(properties: CartProperties) {
    Object.assign(this, properties);

    // Normaliza items
    this.items = (properties.items ?? []).map(
      (i) => new CartItem(i.productId, i.name, i.price, i.quantity),
    );

    // Defaults
    this.cartId = properties.cartId ?? uuidv4();
    this.userId = properties.userId;
    this.createdAt = properties.createdAt ?? new Date();
    this.updatedAt = properties.updatedAt ?? null;
    this.deletedAt = properties.deletedAt ?? null;
  }

  // =======================================================
  // FACTORY
  // =======================================================

  static create(userId: string): Cart {
    return new Cart({
      cartId: uuidv4(),
      userId,
      items: [],
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null,
    });
  }

  // =======================================================
  // BEHAVIOR
  // =======================================================

  addItem(item: CartItemProps) {
    const exists = this.items.find((i) => i.productId === item.productId);

    if (exists) {
      exists.increase(item.quantity);
    } else {
      this.items.push(
        new CartItem(item.productId, item.name, item.price, item.quantity),
      );
    }

    this.touch();
  }

  removeItem(productId: string) {
    this.items = this.items.filter((i) => i.productId !== productId);
    this.touch();
  }

  clear() {
    this.items = [];
    this.touch();
  }

  listItems() {
    return this.items.map((i) => i.toJSON());
  }

  total() {
    return this.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  }

  deactivate() {
    this.deletedAt = new Date();
  }

  private touch() {
    this.updatedAt = new Date();
  }

  // =======================================================
  // PROPERTIES
  // =======================================================

  properties(): Required<CartProperties> {
    return {
      cartId: this.cartId,
      userId: this.userId,
      items: this.items.map((i) => i.toJSON()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }

  update(props: CartPropertiesUpdate) {
    this.updatedAt = new Date();
    return Object.assign(this, props);
  }
}
