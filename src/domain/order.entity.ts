import { v4 as uuidv4 } from 'uuid';

// =======================================================
// REQUIRED (NO TOCADO)
// =======================================================

export interface OrderRequired {
  readonly userId: string;
  readonly pickupLat: number;
  readonly pickupLng: number;
  readonly dropoffLat: number;
  readonly dropoffLng: number;
  readonly items: OrderItemProps[];
  readonly totalAmount: number;
  readonly status: OrderStatus;
}

// =======================================================
// OPTIONAL (NO TOCADO)
// =======================================================

export interface OrderOptional {
  readonly orderId: string;
  readonly courierId: string | null;
  readonly status: string;
  readonly statusDelivery: string;
  readonly createdAt: Date;
  readonly updatedAt: Date | null;
  readonly deletedAt: Date | null;
}

export type OrderProperties = OrderRequired & Partial<OrderOptional>;

export type OrderPropertiesUpdate = Partial<
  Pick<OrderRequired, 'status'> & Pick<OrderOptional, 'updatedAt' | 'deletedAt'>
>;

// =======================================================
// STATUS
// =======================================================

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'

export type OrderDeliveryStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'PREPARING'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELED';

export type DeliveryPhase = 'TO_PICKUP' | 'TO_DROPOFF' | 'DELIVERED';
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

  toPrimitives(): OrderItemProps {
    return {
      productId: this.productId,
      name: this.name,
      price: this.price,
      quantity: this.quantity,
    };
  }

  static fromPrimitives(props: OrderItemProps): OrderItem {
    return new OrderItem(
      props.productId,
      props.name,
      props.price,
      props.quantity,
    );
  }
}

// =======================================================
// ORDER ENTITY
// =======================================================

export class Order {
  private readonly orderId: string;
  private readonly userId: string;
  private courierId: string | null;
  private readonly pickupLat: number;
  private readonly pickupLng: number;
  private readonly dropoffLat: number;
  private readonly dropoffLng: number;
  private items: OrderItem[];
  private totalAmount: number;
  private status: OrderStatus;
  private statusDelivery: OrderDeliveryStatus;
  private readonly createdAt: Date;
  private updatedAt: Date | null;
  private deletedAt: Date | null;

  constructor(properties: OrderProperties) {
    this.orderId = properties.orderId ?? uuidv4();
    this.userId = properties.userId;
    this.courierId = properties.courierId ?? null;
    this.pickupLat = properties.pickupLat;
    this.pickupLng = properties.pickupLng;
    this.dropoffLat = properties.dropoffLat;
    this.dropoffLng = properties.dropoffLng;

    this.items = (properties.items ?? []).map(OrderItem.fromPrimitives);

    this.totalAmount = properties.totalAmount;
    this.status = properties.status;
    this.statusDelivery = (properties.statusDelivery ??
      'CREATED') as OrderDeliveryStatus;

    this.createdAt = properties.createdAt ?? new Date();
    this.updatedAt = properties.updatedAt ?? null;
    this.deletedAt = properties.deletedAt ?? null;
  }

  // =======================================================
  // FACTORY
  // =======================================================

  static create(
    userId: string,
    pickupLat: number,
    pickupLng: number,
    dropoffLat: number,
    dropoffLng: number,
    items: OrderItemProps[],
  ): Order {
    const itemInstances = items.map(OrderItem.fromPrimitives);

    const total = itemInstances.reduce((sum, item) => sum + item.subtotal(), 0);

    return new Order({
      userId,
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
      items,
      totalAmount: total,
      status: 'PENDING',
      statusDelivery: 'CREATED',
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null,
    });
  }

  // =======================================================
  // FROM PRIMITIVES (RECONSTRUCCIÓN DESDE DB)
  // =======================================================

  static fromPrimitives(raw: any): Order {
    return new Order({
      orderId: raw.orderId,
      userId: raw.userId,
      courierId: raw.courierId,
      pickupLat: raw.pickupLat,
      pickupLng: raw.pickupLng,
      dropoffLat: raw.dropoffLat,
      dropoffLng: raw.dropoffLng,
      items: raw.items,
      totalAmount: raw.totalAmount,
      status: raw.status,
      statusDelivery: raw.statusDelivery,
      createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : null,
      deletedAt: raw.deletedAt ? new Date(raw.deletedAt) : null,
    });
  }

  // =======================================================
  // TO PRIMITIVES (PARA DYNAMO)
  // =======================================================

  toPrimitives() {
    return {
      GSI1PK: `ORDER`,
      GSI1SK: this.createdAt.toISOString(),
      orderId: this.orderId,
      userId: this.userId,
      courierId: this.courierId,
      pickupLat: this.pickupLat,
      pickupLng: this.pickupLng,
      dropoffLat: this.dropoffLat,
      dropoffLng: this.dropoffLng,
      items: this.items.map((i) => i.toPrimitives()),
      totalAmount: this.totalAmount,
      status: this.status,
      statusDelivery: this.statusDelivery,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString() ?? null,
      deletedAt: this.deletedAt?.toISOString() ?? null,
    };
  }

  // =======================================================
  // BEHAVIOR
  // =======================================================
  markAsDelivered() {
    this.status = 'PAID';
    this.statusDelivery = 'DELIVERED';
    this.touch();
  }

  markAsAssigned(){
    this.status = 'PENDING'
    this.statusDelivery = 'ASSIGNED';
    this.touch();
  }

  markAsPreparing(){
    this.status = 'PENDING'
    this.statusDelivery = 'PREPARING';
    this.touch();
  }

  markAsPickedUp(){
    this.status = 'PENDING'
    this.statusDelivery = 'PICKED_UP';
    this.touch();
  }

  markAsOnTheWay(){
    this.status = 'PENDING'
    this.statusDelivery = 'ON_THE_WAY';
    this.touch();
  }

  assignCourier(courierId: string) {
    this.courierId = courierId;
    this.statusDelivery = 'ASSIGNED';
    this.touch();
  }

  deactivate() {
    this.deletedAt = new Date();
  }

  update(props: OrderPropertiesUpdate) {
    this.updatedAt = new Date();
    Object.assign(this, props);
  }

  getPickupLocation() {
    return {
      lat: this.pickupLat,
      lng: this.pickupLng,
    };
  }

  getDropoffLocation() {
    return {
      lat: this.dropoffLat,
      lng: this.dropoffLng,
    };
  }

  getDeliveryStatus(): OrderDeliveryStatus {
    return this.statusDelivery;
  }

  getCurrentPhase(): DeliveryPhase {
    switch (this.statusDelivery) {
      case 'ASSIGNED':
      case 'PREPARING':
        return 'TO_PICKUP';

      case 'PICKED_UP':
      case 'ON_THE_WAY':
        return 'TO_DROPOFF';

      default:
        return 'DELIVERED';
    }
  }

  private touch() {
    this.updatedAt = new Date();
  }
}
