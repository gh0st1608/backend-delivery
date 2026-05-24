import axios, { AxiosInstance } from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import {
  StoreLocation,
  StoreLocationService,
} from '../../domain/services/store.repository';

@Injectable()
export class ShopHttpClientImpl implements StoreLocationService {
  private readonly logger = new Logger(ShopHttpClientImpl.name);
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.SHOP_MS_BASE_URL ?? 'http://localhost:3002',
      timeout: 3000,
    });
    console.log('SHOP_MS_BASE_URL',process.env.SHOP_MS_BASE_URL)
  }
  
  async getLocation(storeId: string): Promise<StoreLocation> {
    try {
      const { data } = await this.client.get(
        `/stores/${storeId}/location`,
      );
      console.log('data',data)
      return {
        pickupLat: data.Data.Store.lat,
        pickupLng: data.Data.Store.lng,
      };
    } catch (error) {
      this.logger.error(
        `Failed to resolve store location for ${storeId}`,
        error,
      );
      throw error;
    }
  }
}
