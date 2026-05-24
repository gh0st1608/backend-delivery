import { v4 as uuidv4 } from 'uuid';

// =======================================================
// REQUIRED
// =======================================================

export interface CourierRequired {
  readonly name: string;
  readonly phone: string;
  readonly vehicleType: CourierVehicleType;
  readonly status: CourierStatus;
}

// =======================================================
// OPTIONAL
// =======================================================

export interface CourierOptional {
  readonly courierId: string;
  readonly currentOrderId: string | null;
  readonly currentLat: number | null;
  readonly currentLng: number | null;
  readonly lastLocationAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date | null;
  readonly deletedAt: Date | null;
}

export type CourierProperties =
  CourierRequired & Partial<CourierOptional>;

// =======================================================
// UPDATE PARTIALS
// =======================================================

export type CourierPropertiesUpdate = Partial<
  Pick<CourierRequired, 'status'> &
  Pick<CourierOptional, 'currentLat' | 'currentLng' | 'lastLocationAt' | 'updatedAt' | 'deletedAt'>
>;

// =======================================================
// ENUMS
// =======================================================

export type CourierStatus =
  | 'AVAILABLE'
  | 'BUSY'
  | 'OFFLINE';

export type CourierVehicleType =
  | 'BIKE'
  | 'MOTO'
  | 'CAR';

// =======================================================
// COURIER ROOT ENTITY
// =======================================================

export class Courier {
  private readonly courierId: string;
  private readonly name: string;
  private readonly phone: string;
  private readonly vehicleType: CourierVehicleType;
  private status: CourierStatus;

  private currentOrderId: string | null;
  private currentLat: number | null;
  private currentLng: number | null;
  private lastLocationAt: Date | null;

  private readonly createdAt: Date;
  private updatedAt: Date | null;
  private deletedAt: Date | null;

  constructor(properties: CourierProperties) {
    Object.assign(this, properties);

    this.courierId = properties.courierId ?? uuidv4();
    this.name = properties.name;
    this.phone = properties.phone;
    this.vehicleType = properties.vehicleType;
    this.status = properties.status;

    this.currentOrderId = properties.currentOrderId ?? null;
    this.currentLat = properties.currentLat ?? null;
    this.currentLng = properties.currentLng ?? null;
    this.lastLocationAt = properties.lastLocationAt ?? null;

    this.createdAt = properties.createdAt ?? new Date();
    this.updatedAt = properties.updatedAt ?? null;
    this.deletedAt = properties.deletedAt ?? null;
  }

  // =======================================================
  // FACTORY
  // =======================================================

  static create(
    name: string,
    phone: string,
    vehicleType: CourierVehicleType,
  ): Courier {
    return new Courier({
      courierId: uuidv4(),
      name,
      phone,
      vehicleType,
      status: 'OFFLINE',
      currentOrderId: null,
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null,
    });
  }

  // =======================================================
  // BEHAVIOR
  // =======================================================

  activate() {
    this.status = 'AVAILABLE';
    this.touch();
  }

  assignOrder(orderId?: string) {
    this.status = 'BUSY';
    this.currentOrderId = orderId ?? this.currentOrderId;
    this.touch();
  }

  release() {
    this.status = 'AVAILABLE';
    this.currentOrderId = null;
    this.touch();
  }

  deactivate() {
    this.status = 'OFFLINE';
    this.currentOrderId = null;
    this.touch();
  }

  updateLocation(lat: number, lng: number) {
    this.currentLat = lat;
    this.currentLng = lng;
    this.lastLocationAt = new Date();
    this.touch();
  }

  private touch() {
    this.updatedAt = new Date();
  }

  softDelete() {
    this.deletedAt = new Date();
  }

  isAvailableWithFreshLocation(maxLocationAgeSeconds: number): boolean {
    if (this.status !== 'AVAILABLE') {
      return false;
    }

    if (this.currentLat === null || this.currentLng === null || !this.lastLocationAt) {
      return false;
    }

    const maxAgeMs = maxLocationAgeSeconds * 1000;
    const locationAgeMs = Date.now() - this.lastLocationAt.getTime();

    return locationAgeMs <= maxAgeMs;
  }

  // =======================================================
  // PROPERTIES SNAPSHOT
  // =======================================================

  properties(): Required<CourierProperties> {
    return {
      courierId: this.courierId,
      name: this.name,
      phone: this.phone,
      vehicleType: this.vehicleType,
      status: this.status,
      currentOrderId: this.currentOrderId,
      currentLat: this.currentLat,
      currentLng: this.currentLng,
      lastLocationAt: this.lastLocationAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }

  update(props: CourierPropertiesUpdate) {
    this.updatedAt = new Date();
    return Object.assign(this, props);
  }

    toPrimitives() {
    return {
      GSI1PK: `COURIER`,
      GSI1SK: `METADATA`,
      courierId: this.courierId,
      name: this.name,
      phone: this.phone,
      vehicleType: this.vehicleType,
      status: this.status,
      currentOrderId: this.currentOrderId,
      currentLat: this.currentLat,
      currentLng: this.currentLng,
      lastLocationAt: this.lastLocationAt?.toISOString() ?? null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString() ?? null,
      deletedAt: this.deletedAt?.toISOString() ?? null,
    };
  }

  static fromPrimitives(item: Record<string, any>): Courier {
    return new Courier({
      courierId: item.courierId,
      name: item.name,
      phone: item.phone,
      vehicleType: item.vehicleType,
      status: item.status,
      currentOrderId: item.currentOrderId ?? null,
      currentLat: item.currentLat,
      currentLng: item.currentLng,
      lastLocationAt: item.lastLocationAt ? new Date(item.lastLocationAt) : null,
      createdAt: new Date(item.createdAt),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
      deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
    });
  }
}
