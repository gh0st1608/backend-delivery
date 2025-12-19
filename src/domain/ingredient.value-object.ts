export type IngredientUnit = 'g' | 'kg' | 'ml' | 'l' | 'unit';

export interface IngredientRequired {
  readonly name: string;
  readonly quantity: number;
  readonly unit: IngredientUnit;
}

export interface IngredientOptional {
  readonly image: string;
}

export type IngredientProperties = IngredientRequired &
  Partial<IngredientOptional>;

export class Ingredient {
  readonly name: string;
  readonly quantity: number;
  readonly unit: IngredientUnit;
  readonly image: string;

  constructor(props: IngredientProperties) {
    Object.assign(this, props);
  }

  toPrimitives() {
    return {
      name: this.name,
      quantity: this.quantity,
      unit: this.unit,
      image: this.image,
    };
  }

  static fromPrimitives(raw: any): Ingredient {
    return new Ingredient({
      name: raw.name,
      quantity: raw.quantity,
      unit: raw.unit,
      image: raw.image,
    });
  }
}
