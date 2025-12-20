import { v4 as uuidv4 } from 'uuid';

// =======================================================
// PROPERTIES
// =======================================================

export interface CategoryRequired {
  readonly name: string;
  readonly description: string;
}

export interface CategoryOptional {
  readonly categoryId: string;
  readonly image: string;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export type CategoryProperties = CategoryRequired & Partial<CategoryOptional>;

export type CategoryPropertiesUpdate = Partial<
  Pick<CategoryRequired, 'name' | 'description'> &
    Pick<CategoryOptional, 'image' | 'active' | 'updatedAt'>
>;

// =======================================================
// ENTITY
// =======================================================

export class Category {
  private categoryId: string;
  private name: string;
  private description: string;
  private image: string;
  private active: boolean;
  private readonly createdAt: Date;
  private updatedAt: Date | null;
  private deletedAt: Date | null;

  constructor(properties: CategoryProperties) {
    this.active = true;
    Object.assign(this, properties);
  }

  // =======================================================
  // GETTERS
  // =======================================================

  properties(): CategoryProperties {
    return {
      categoryId: this.categoryId,
      name: this.name,
      description: this.description,
      image: this.image,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }

  // =======================================================
  // FACTORIES
  // =======================================================

  static create(data: {
    name: string;
    description: string;
    image?: string;
  }): Category {
    const now = new Date();

    return new Category({
      categoryId: uuidv4(),
      name: data.name,
      description: data.description,
      image: data.image ?? '',
      active: true,
      createdAt: now,
      updatedAt: null,
      deletedAt: null,
    });
  }

  // =======================================================
  // BEHAVIOR
  // =======================================================

  update(properties: CategoryPropertiesUpdate): Category {
    this.updatedAt = new Date();
    return Object.assign(this, properties);
  }

  deactivate(): void {
    this.active = false;
    this.deletedAt = new Date();
  }

  // =======================================================
  // SERIALIZATION
  // =======================================================

  toPrimitives() {
    return {
      categoryId: this.categoryId,
      name: this.name,
      description: this.description,
      image: this.image,
      active: this.active,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString() ?? null,
      deletedAt: this.deletedAt?.toISOString() ?? null,
    };
  }

  static fromPrimitives(raw: any): Category {
    return new Category({
      categoryId: raw.categoryId,
      name: raw.name,
      description: raw.description,
      image: raw.image,
      active: raw.active,
      createdAt: new Date(raw.createdAt),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : null,
      deletedAt: raw.deletedAt ? new Date(raw.deletedAt) : null,
    });
  }
}
