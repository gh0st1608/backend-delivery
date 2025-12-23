import { v4 as uuidv4 } from 'uuid';

export interface PreferenceRequired {
  readonly userId: string;
  readonly categoryId: string;
}

export interface PreferenceOptional {
  readonly preferenceId: string;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date;
}

export type PreferenceProperties = PreferenceRequired &
  Partial<PreferenceOptional>;

export class Preference {
  private preferenceId: string;
  private userId: string;
  private categoryId: string;
  private active: boolean;
  private readonly createdAt: Date;
  private updatedAt: Date | null;
  private deletedAt: Date | null;

  constructor(properties: PreferenceProperties) {
    Object.assign(this, {
      active: true,
      ...properties,
    });
  }

  properties(): PreferenceProperties {
    return {
      preferenceId: this.preferenceId,
      userId: this.userId,
      categoryId: this.categoryId,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }

  static create(data: { userId: string; categoryId: string }) {
    const now = new Date();
    return new Preference({
      preferenceId: uuidv4(),
      userId: data.userId,
      categoryId: data.categoryId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  toPrimitives() {
    return {
      GSI1PK: `USER#${this.userId}`,
      GSI1SK: `PREF#CATEGORY#${this.categoryId}`,
      preferenceId: this.preferenceId,
      userId: this.userId,
      categoryId: this.categoryId,
      active: this.active,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString() ?? null,
      deletedAt: this.deletedAt?.toISOString() ?? null,
    };
  }

  static fromPrimitives(item: Record<string, any>): Preference {
    return new Preference({
      preferenceId: item.preferenceId,
      userId: item.userId,
      categoryId: item.categoryId,
      active: item.active,
      createdAt: new Date(item.createdAt),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
      deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
    });
  }
}
