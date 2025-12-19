import { v4 as uuidv4 } from 'uuid';
import { Ingredient, IngredientProperties } from './ingredient.value-object';

export type Cursor = string & { readonly __brand: unique symbol };

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
  readonly ingredients: Ingredient[];
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
  private ingredients: Ingredient[];
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
      ingredients: this.ingredients,
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
    ingredients: IngredientProperties[];
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
      ingredients: data.ingredients.map((i) => new Ingredient(i)),
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

  updateIngredient(
    ingredientName: string,
    data: { quantity?: number; unit?: string },
  ): void {
    const index = this.ingredients.findIndex((i) => i.name === ingredientName);

    const current = this.ingredients[index];

    this.ingredients[index] = new Ingredient({
      name: current.name,
      quantity: data.quantity ?? current.quantity,
      unit: (data.unit as any) ?? current.unit,
    });

    this.updatedAt = new Date();
  }

  addIngredient(ingredient: Ingredient): void {
    this.ingredients.push(ingredient);
    this.updatedAt = new Date();
  }

  removeIngredient(name: string): void {
    this.ingredients = this.ingredients.filter((i) => i.name !== name);
    this.updatedAt = new Date();
  }

  toPrimitives() {
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
      ingredients: this.ingredients.map((i) => i.toPrimitives()),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString() ?? null,
      deletedAt: this.deletedAt?.toISOString() ?? null,
    };
  }

  static fromPrimitives(raw: any): Product {
    return new Product({
      productId: raw.productId,
      name: raw.name,
      description: raw.description,
      price: raw.price,
      stock: raw.stock,
      category: raw.category,
      sku: raw.sku,
      image: raw.image,
      active: raw.active,
      ingredients: raw.ingredients?.map(Ingredient.fromPrimitives) ?? [],
      createdAt: new Date(raw.createdAt),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : null,
      deletedAt: raw.deletedAt ? new Date(raw.deletedAt) : null,
    });
  }

}
