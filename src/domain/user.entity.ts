import { v4 as uuidv4 } from 'uuid';

export interface UserRequired {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly roles: string;
}

export interface UserOptional {
  readonly userId: string;
  readonly lastname: string;
  readonly verificationCode: string;
  readonly verificationCodeExpiresAt: number;
  readonly photo: string;
  readonly onboardingRequired: boolean;
  readonly active: boolean;
  readonly refreshToken: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date;
}

export type UserProperties = UserRequired & Partial<UserOptional>;

export type UserPropertiesUpdate = Partial<
  Omit<UserRequired, ''> &
    Pick<
      UserOptional,
      | 'lastname'
      | 'verificationCode'
      | 'verificationCodeExpiresAt'
      | 'photo'
      | 'active'
      | 'refreshToken'
      | 'onboardingRequired'
      | 'updatedAt'
    >
>;

export class User {
  private userId: string;
  private name: string;
  private lastname: string;
  private readonly email: string;
  private password: string;
  private verificationCode: string;
  private verificationCodeExpiresAt: number;
  private photo: string;
  private onboardingRequired: boolean;
  private roles: string;
  private active: boolean;
  private refreshToken: string;
  private readonly createdAt: Date;
  private updatedAt: Date | null;
  private deletedAt: Date | null;

  constructor(properties: UserProperties) {
    this.active = true;
    this.onboardingRequired = true; // 🔑 default seguro
    Object.assign(this, properties);
  }

  properties(): UserProperties {
    return {
      userId: this.userId,
      name: this.name,
      lastname: this.lastname,
      email: this.email,
      password: this.password,
      roles: this.roles,
      photo: this.photo,
      onboardingRequired: this.onboardingRequired,
      active: this.active,
      refreshToken: this.refreshToken,
      verificationCode: this.verificationCode,
      verificationCodeExpiresAt: this.verificationCodeExpiresAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }

  // ======================================================
  // FACTORY
  // ======================================================

  static create(data: {
    name: string;
    email: string;
    password: string;
    roles: string;
    lastname?: string;
    photo?: string;
  }): User {
    const now = new Date();

    return new User({
      userId: uuidv4(),
      name: data.name,
      email: data.email,
      password: data.password,
      roles: data.roles,
      lastname: data.lastname ?? '',
      photo: data.photo ?? '',
      onboardingRequired: true,
      active: true,
      refreshToken: '',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  // ======================================================
  // UPDATE (CONTROLADO)
  // ======================================================

  update(properties: UserPropertiesUpdate): User {
    return Object.assign(this, {
      ...properties,
      updatedAt: new Date(),
    });
  }

  // ======================================================
  // SERIALIZATION (DYNAMO)
  // ======================================================

  toPrimitives() {
    return {
      PK: `USER#${this.userId}`,
      SK: 'METADATA',
      GSI1PK: 'USER',
      GSI1SK: `CREATED_AT#${this.createdAt.toISOString()}`,
      userId: this.userId,
      name: this.name,
      lastname: this.lastname,
      email: this.email,
      password: this.password,
      roles: this.roles,
      photo: this.photo,
      onboardingRequired: this.onboardingRequired,
      active: this.active,
      refreshToken: this.refreshToken,
      verificationCode: this.verificationCode,
      verificationCodeExpiresAt: this.verificationCodeExpiresAt,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString() ?? null,
      deletedAt: this.deletedAt?.toISOString() ?? null,
    };
  }

  static fromPrimitives(item: Record<string, any>): User {
    return new User({
      userId: item.userId,
      name: item.name,
      lastname: item.lastname,
      email: item.email,
      password: item.password,
      roles: item.roles,
      photo: item.photo,
      onboardingRequired: item.onboardingRequired ?? true,
      active: item.active ?? true,
      refreshToken: item.refreshToken,
      verificationCode: item.verificationCode,
      verificationCodeExpiresAt: item.verificationCodeExpiresAt,
      createdAt: new Date(item.createdAt),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
      deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
    });
  }

  // ======================================================
  // GETTERS ÚTILES
  // ======================================================

  hasPreferencesSelected(): boolean {
    return this.onboardingRequired;
  }
}
