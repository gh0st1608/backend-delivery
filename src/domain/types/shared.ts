export type Cursor = string & { readonly __brand: unique symbol };
export enum Entities {
  USER = 'user',
  PREFERENCE = 'preference',
}
