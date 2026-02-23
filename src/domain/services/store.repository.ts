export interface StoreLocation {
  pickupLat: number;
  pickupLng: number;
}

export interface StoreLocationService {
  getLocation(storeId: string): Promise<StoreLocation>;
}

export const StoreLocationServiceSymbol = Symbol('StoreLocationService');
