import { v4 as uuidv4 } from 'uuid';

// =======================================================
// REQUIRED
// =======================================================

export interface OrderRequired {
  readonly userId: string;
  readonly items: OrderItemProps[];
  readonly totalAmount: number;
  readonly status: OrderStatus;
}

// =======================================================
// OPTIONAL
// =======================================================

export interface OrderOptional {
  readonly orderId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date | null;
  readonly deletedAt: Date | null;
}

export type OrderProperties = OrderRequired & Partial<OrderOptional>;

// =======================================================
// UPDATE PARTIALS
// =======================================================

export type OrderPropertiesUpdate = Partial<
  Pick<OrderRequired, 'status'> &
  Pick<OrderOptional, 'updatedAt' | 'deletedAt'>
>;

// =======================================================
// ORDER STATUS
// =======================================================

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'SHIPPED'
  | 'DELIVERED';

// =======================================================
// ORDER ITEM
// =======================================================

export interface OrderItemProps {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export class OrderItem {
  constructor(
    public readonly productId: string,
    public readonly name: string,
    public readonly price: number,
    public readonly quantity: number,
  ) {}

  subtotal() {
    return this.price * this.quantity;
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
// ORDER ROOT ENTITY
// =======================================================

export class Order {
  private readonly orderId: string;
  private readonly userId: string;
  private items: OrderItem[];
  private totalAmount: number;
  private status: OrderStatus;
  private readonly createdAt: Date;
  private updatedAt: Date | null;
  private deletedAt: Date | null;

  constructor(properties: OrderProperties) {
    Object.assign(this, properties);

    // Normalize items
    this.items = (properties.items ?? []).map(
      i => new OrderItem(i.productId, i.name, i.price, i.quantity),
    );

    this.orderId = properties.orderId ?? uuidv4();
    this.userId = properties.userId;
    this.totalAmount = properties.totalAmount;
    this.status = properties.status;

    this.createdAt = properties.createdAt ?? new Date();
    this.updatedAt = properties.updatedAt ?? null;
    this.deletedAt = properties.deletedAt ?? null;
  }

  // =======================================================
  // FACTORY
  // =======================================================

  static create(userId: string, items: OrderItemProps[]): Order {
    const itemInstances = items.map(
      i => new OrderItem(i.productId, i.name, i.price, i.quantity),
    );

    const total = itemInstances.reduce(
      (sum, item) => sum + item.subtotal(),
      0,
    );

    return new Order({
      orderId: uuidv4(),
      userId,
      items: itemInstances,
      totalAmount: total,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null,
    });
  }

  // =======================================================
  // BEHAVIOR
  // =======================================================

  markAsPaid() {
    this.status = 'PAID';
    this.touch();
  }

  markAsFailed() {
    this.status = 'FAILED';
    this.touch();
  }

  cancel() {
    this.status = 'CANCELLED';
    this.touch();
  }

  ship() {
    this.status = 'SHIPPED';
    this.touch();
  }

  deliver() {
    this.status = 'DELIVERED';
    this.touch();
  }

  private touch() {
    this.updatedAt = new Date();
  }

  deactivate() {
    this.deletedAt = new Date();
  }

  listItems() {
    return this.items.map(i => i.toJSON());
  }

  getTotal() {
    return this.totalAmount;
  }

  // =======================================================
  // PROPERTIES SNAPSHOT
  // =======================================================

  properties(): Required<OrderProperties> {
    return {
      orderId: this.orderId,
      userId: this.userId,
      items: this.items.map(i => i.toJSON()),
      totalAmount: this.totalAmount,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }

  update(props: OrderPropertiesUpdate) {
    this.updatedAt = new Date();
    return Object.assign(this, props);
  }
}
