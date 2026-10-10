import axios, { AxiosInstance } from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import {
  StoreLocation,
  StoreLocationService,
} from '../../domain/services/store.repository';
import {
  CatalogProduct,
  CatalogService,
} from '../../domain/services/catalog.service';

@Injectable()
export class ShopHttpClientImpl implements StoreLocationService, CatalogService {
  private readonly logger = new Logger(ShopHttpClientImpl.name);
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.SHOP_MS_BASE_URL ?? 'http://localhost:3002',
      timeout: 3000,
    });
  }

  async getLocation(storeId: string): Promise<StoreLocation> {
    try {
      const { data } = await this.client.get(
        `/stores/${encodeURIComponent(storeId)}/location`,
      );

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

  async getProduct(productId: string): Promise<CatalogProduct | null> {
    try {
      const { data } = await this.client.get(
        `/products/${encodeURIComponent(productId)}`,
      );
      const product = data?.Data?.product;
      if (!product) return null;

      return {
        productId: product.productId,
        name: product.name,
        priceClp: Number(product.price),
        storeId: product.storeId,
        stock: Number(product.stock ?? 0),
        active: product.active !== false,
      };
    } catch (error: any) {
      // Producto inexistente: shop responde un error 4xx
      if (error?.response?.status && error.response.status < 500) return null;

      this.logger.error(`Failed to fetch product ${productId}`, error);
      throw error;
    }
  }
}
