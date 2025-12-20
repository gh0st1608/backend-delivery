export type Cursor = string & { readonly __brand: unique symbol };
export enum Entities {
  PRODUCT = 'product',
  CATEGORY = 'category',
}
