import { v4 as uuidv4 } from 'uuid';

export interface ProductRequired {
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly stock: number;
}

export interface ProductOptional {
  readonly productId: string;
  readonly category: string;
  readonly sku: string;
  readonly image: string;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export type ProductProperties = ProductRequired & Partial<ProductOptional>;

export type ProductPropertiesUpdate = Partial<
  Pick<ProductRequired, 'name' | 'description' | 'price' | 'stock'> &
    Pick<ProductOptional, 'category' | 'sku' | 'image' | 'active' | 'updatedAt'>
>;

export class Product {
  private productId: string;
  private name: string;
  private description: string;
  private price: number;
  private stock: number;
  private category: string;
  private sku: string;
  private image: string;
  private active: boolean;
  private readonly createdAt: Date;
  private updatedAt: Date | null;
  private deletedAt: Date | null;

  constructor(properties: ProductProperties) {
    this.active = true;
    Object.assign(this, properties);
  }

  properties(): ProductProperties {
    return {
      productId: this.productId,
      name: this.name,
      description: this.description,
      price: this.price,
      stock: this.stock,
      category: this.category,
      sku: this.sku,
      image: this.image,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }

  static create(data: {
    name: string;
    description: string;
    price: number;
    stock: number;
    category?: string;
    sku?: string;
    image?: string;
  }): Product {
    const now = new Date();

    return new Product({
      productId: uuidv4(),
      name: data.name,
      description: data.description,
      price: data.price,
      stock: data.stock,
      category: data.category ?? '',
      sku: data.sku ?? '',
      image: data.image ?? '',
      active: true,
      createdAt: now,
      updatedAt: null,
      deletedAt: null,
    });
  }

  update(properties: ProductPropertiesUpdate): Product {
    this.updatedAt = new Date();
    return Object.assign(this, properties);
  }

  deactivate() {
    this.active = false;
    this.deletedAt = new Date();
  }
}
