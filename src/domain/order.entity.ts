import { v4 as uuidv4 } from 'uuid';

// =======================================================
// REQUIRED
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
// OPTIONAL
// =======================================================

export interface OrderOptional {
  readonly orderId: string;
  readonly storeId: string;
  readonly courierId: string | null;
  readonly status: string;
  readonly statusDelivery: string;
  // Montos: CLP es la moneda que ve el cliente; USD es lo que cobra PayPal.
  // El tipo de cambio queda congelado al crear la orden.
  readonly currency: 'CLP';
  readonly subtotalClp: number;
  readonly deliveryFeeClp: number;
  readonly totalClp: number;
  readonly exchangeRateUsdClp: number;
  readonly exchangeRateSource: string;
  readonly totalUsd: number;
  readonly paymentId: string | null;
  readonly paidAt: Date | null;
  readonly assignmentAttempts: number;
  readonly lastAssignmentAttemptAt: Date | null;
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

// price: precio unitario en CLP tomado del catálogo (no del cliente)
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
// MONEY
// =======================================================

// CLP no tiene decimales; USD se redondea a centavos (mínimo 0.01)
export const convertClpToUsd = (amountClp: number, usdClp: number): number =>
  Math.max(0.01, Math.round((amountClp / usdClp) * 100) / 100);

// =======================================================
// ORDER ENTITY
// =======================================================

export class Order {
  private readonly orderId: string;
  private readonly userId: string;
  private readonly storeId: string;
  private courierId: string | null;

  private readonly pickupLat: number;
  private readonly pickupLng: number;
  private readonly dropoffLat: number;
  private readonly dropoffLng: number;

  private items: OrderItem[];

  private totalAmount: number;
  private currency: 'CLP';
  private subtotalClp: number;
  private deliveryFeeClp: number;
  private totalClp: number;
  private exchangeRateUsdClp: number;
  private exchangeRateSource: string;
  private totalUsd: number;

  private status: OrderStatus;
  private statusDelivery: OrderDeliveryStatus;

  private paymentId: string | null;
  private paidAt: Date | null;

  private assignmentAttempts: number;
  private lastAssignmentAttemptAt: Date | null;

  private readonly createdAt: Date;
  private updatedAt: Date | null;
  private deletedAt: Date | null;

  constructor(properties: OrderProperties) {
    this.orderId = properties.orderId ?? uuidv4();
    this.userId = properties.userId;
    this.storeId = properties.storeId ?? '';
    this.courierId = properties.courierId ?? null;

    this.pickupLat = properties.pickupLat;
    this.pickupLng = properties.pickupLng;
    this.dropoffLat = properties.dropoffLat;
    this.dropoffLng = properties.dropoffLng;

    this.items = (properties.items ?? []).map(OrderItem.fromPrimitives);

    this.totalAmount = properties.totalAmount;
    this.currency = 'CLP';
    this.subtotalClp = properties.subtotalClp ?? properties.totalAmount;
    this.deliveryFeeClp = properties.deliveryFeeClp ?? 0;
    this.totalClp = properties.totalClp ?? properties.totalAmount;
    this.exchangeRateUsdClp = properties.exchangeRateUsdClp ?? 0;
    this.exchangeRateSource = properties.exchangeRateSource ?? '';
    this.totalUsd = properties.totalUsd ?? 0;

    this.status = properties.status;
    this.statusDelivery = (properties.statusDelivery ??
      'CREATED') as OrderDeliveryStatus;

    this.paymentId = properties.paymentId ?? null;
    this.paidAt = properties.paidAt ?? null;

    this.assignmentAttempts = properties.assignmentAttempts ?? 0;
    this.lastAssignmentAttemptAt = properties.lastAssignmentAttemptAt ?? null;

    this.createdAt = properties.createdAt ?? new Date();
    this.updatedAt = properties.updatedAt ?? null;
    this.deletedAt = properties.deletedAt ?? null;
  }

  // =======================================================
  // FACTORY
  // =======================================================

  static create(data: {
    userId: string;
    storeId: string;
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
    items: OrderItemProps[];
    deliveryFeeClp: number;
    exchangeRateUsdClp: number;
    exchangeRateSource: string;
  }): Order {
    const itemInstances = data.items.map(OrderItem.fromPrimitives);
    const subtotalClp = itemInstances.reduce(
      (sum, item) => sum + item.subtotal(),
      0,
    );
    const totalClp = subtotalClp + data.deliveryFeeClp;

    return new Order({
      userId: data.userId,
      storeId: data.storeId,
      pickupLat: data.pickupLat,
      pickupLng: data.pickupLng,
      dropoffLat: data.dropoffLat,
      dropoffLng: data.dropoffLng,
      items: data.items,
      totalAmount: totalClp,
      currency: 'CLP',
      subtotalClp,
      deliveryFeeClp: data.deliveryFeeClp,
      totalClp,
      exchangeRateUsdClp: data.exchangeRateUsdClp,
      exchangeRateSource: data.exchangeRateSource,
      totalUsd: convertClpToUsd(totalClp, data.exchangeRateUsdClp),
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
      storeId: raw.storeId,
      courierId: raw.courierId,
      pickupLat: raw.pickupLat,
      pickupLng: raw.pickupLng,
      dropoffLat: raw.dropoffLat,
      dropoffLng: raw.dropoffLng,
      items: raw.items,
      totalAmount: raw.totalAmount,
      subtotalClp: raw.subtotalClp,
      deliveryFeeClp: raw.deliveryFeeClp,
      totalClp: raw.totalClp,
      exchangeRateUsdClp: raw.exchangeRateUsdClp,
      exchangeRateSource: raw.exchangeRateSource,
      totalUsd: raw.totalUsd,
      status: raw.status,
      statusDelivery: raw.statusDelivery,
      paymentId: raw.paymentId ?? null,
      paidAt: raw.paidAt ? new Date(raw.paidAt) : null,
      assignmentAttempts: raw.assignmentAttempts ?? 0,
      lastAssignmentAttemptAt: raw.lastAssignmentAttemptAt
        ? new Date(raw.lastAssignmentAttemptAt)
        : null,
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
      storeId: this.storeId,
      courierId: this.courierId,

      pickupLat: this.pickupLat,
      pickupLng: this.pickupLng,
      dropoffLat: this.dropoffLat,
      dropoffLng: this.dropoffLng,

      items: this.items.map((i) => i.toPrimitives()),

      totalAmount: this.totalAmount,
      currency: this.currency,
      subtotalClp: this.subtotalClp,
      deliveryFeeClp: this.deliveryFeeClp,
      totalClp: this.totalClp,
      exchangeRateUsdClp: this.exchangeRateUsdClp,
      exchangeRateSource: this.exchangeRateSource,
      totalUsd: this.totalUsd,

      status: this.status,
      statusDelivery: this.statusDelivery,

      paymentId: this.paymentId,
      paidAt: this.paidAt?.toISOString() ?? null,

      assignmentAttempts: this.assignmentAttempts,
      lastAssignmentAttemptAt:
        this.lastAssignmentAttemptAt?.toISOString() ?? null,

      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString() ?? null,
      deletedAt: this.deletedAt?.toISOString() ?? null,
    };
  }

  // =======================================================
  // BEHAVIOR
  // =======================================================

  markAsPaid(paymentId: string) {
    this.status = 'PAID';
    this.paymentId = paymentId;
    this.paidAt = new Date();
    this.touch();
  }

  markAsDelivered() {
    this.status = 'PAID';
    this.statusDelivery = 'DELIVERED';
    this.touch();
  }

  markAsAssigned(){
    this.statusDelivery = 'ASSIGNED';
    this.touch();
  }

  markAsPreparing(){
    this.statusDelivery = 'PREPARING';
    this.touch();
  }

  markAsPickedUp(){
    this.statusDelivery = 'PICKED_UP';
    this.touch();
  }

  markAsOnTheWay(){
    this.statusDelivery = 'ON_THE_WAY';
    this.touch();
  }

  assignCourier(courierId: string) {
    this.courierId = courierId;
    this.statusDelivery = 'ASSIGNED';
    this.touch();
  }

  registerAssignmentAttempt() {
    this.assignmentAttempts += 1;
    this.lastAssignmentAttemptAt = new Date();
    this.touch();
  }

  deactivate() {
    this.deletedAt = new Date();
  }

  update(props: OrderPropertiesUpdate) {
    this.updatedAt = new Date();
    Object.assign(this, props);
  }

  // =======================================================
  // QUERIES
  // =======================================================

  isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }

  isPaid(): boolean {
    return this.status === 'PAID';
  }

  hasCourier(): boolean {
    return !!this.courierId;
  }

  // Pagada, sin repartidor y aún dentro del máximo de intentos
  needsCourierAssignment(maxAttempts: number): boolean {
    return (
      this.isPaid() &&
      !this.hasCourier() &&
      this.statusDelivery === 'CREATED' &&
      this.assignmentAttempts < maxAttempts
    );
  }

  // El cliente confirma la recepción solo si ya hay un repartidor en curso
  canBeConfirmedByCustomer(): boolean {
    return (
      this.isPaid() &&
      ['ASSIGNED', 'PREPARING', 'PICKED_UP', 'ON_THE_WAY'].includes(
        this.statusDelivery,
      )
    );
  }

  getTotalUsd(): number {
    return this.totalUsd;
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
      case 'CREATED':
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
