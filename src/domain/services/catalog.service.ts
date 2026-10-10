export interface CatalogProduct {
  productId: string;
  name: string;
  priceClp: number;
  storeId: string;
  stock: number;
  active: boolean;
}

// Fuente de verdad de precios: el pedido nunca confía en el precio que envía el cliente
export interface CatalogService {
  getProduct(productId: string): Promise<CatalogProduct | null>;
}

export const CatalogServiceSymbol = Symbol('CatalogService');
