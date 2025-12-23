import { Injectable } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient, AttributeValue } from '@aws-sdk/client-dynamodb';

import { Product } from '../../domain/product.entity';
import { Cursor } from '../../domain/types/shared';
import { PaginatedResult } from '../../application/dto/response/response-custom.dto';
import { ProductRepository } from '../../domain/repository/product.repository';
import { GetByParamsDto } from '../../application/dto/request/get-by-params.dto';

export type DynamoCursor = Record<string, AttributeValue>;

@Injectable()
export class ProductRepositoryImpl implements ProductRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName = 'Products';

  constructor() {
    this.docClient = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: process.env.REGION ?? 'us-east-1',
        credentials: {
          accessKeyId: process.env.ACCESS_KEY_ID!,
          secretAccessKey: process.env.SECRET_ACCESS_KEY!,
        },
      }),
      {
        marshallOptions: {
          removeUndefinedValues: true,
        },
      },
    );
  }

  // ===========================================================================
  // PUBLIC METHODS (solo usan Cursor)
  // ===========================================================================

  async getList(query: GetByParamsDto): Promise<PaginatedResult<Product>> {
    const limit = Number(query.limit) || 10;
    const cursor = query.cursor as Cursor | undefined;

    if (query.categoryId) {
      console.log('entro al getbycategory')
      return this.getByCategory(query.categoryId, limit, cursor);
    }

    if (query.search) {
      return this.scanWithSearch(query.search, limit, cursor);
    }

    return this.scanWithoutSearch(limit, cursor);
  }

  async getById(id: string): Promise<Product | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { productId: id },
      }),
    );

    return result.Item ? this.toDomain(result.Item) : null;
  }

  async getByCategory(
    categoryId: string,
    limit: number,
    cursor?: Cursor,
  ): Promise<PaginatedResult<Product>> {
    try {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI_CATEGORY',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `CATEGORY#${categoryId}`,
        },
        Limit: limit,
        ExclusiveStartKey: this.decodeCursor(cursor),
      }),
    );

    const items = result.Items ?? [];

    return {
      items: items.map(this.toDomain),
      count: items.length,
      nextCursor: this.encodeCursor(result.LastEvaluatedKey),
    };
    }catch(error){
      console.log(error)
      throw error
    }
  }

  async save(product: Product): Promise<string> {
    const primitives = product.toPrimitives();

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: primitives,
      }),
    );

    return primitives.productId;
  }

  // ===========================================================================
  // PRIVATE SCAN METHODS (usan DynamoCursor)
  // ===========================================================================

  private async scanWithoutSearch(
    limit: number,
    cursor?: Cursor,
  ): Promise<PaginatedResult<Product>> {
    const result = await this.docClient.send(
      new ScanCommand({
        TableName: this.tableName,
        Limit: limit,
        ExclusiveStartKey: this.decodeCursor(cursor),
      }),
    );

    const items = result.Items ?? [];

    return {
      items: items.map(this.toDomain),
      count: items.length,
      nextCursor: this.encodeCursor(result.LastEvaluatedKey),
    };
  }

  private async scanWithSearch(
    search: string,
    limit: number,
    cursor?: Cursor,
  ): Promise<PaginatedResult<Product>> {
    const result = await this.docClient.send(
      new ScanCommand({
        TableName: this.tableName,
        ExclusiveStartKey: this.decodeCursor(cursor),
        FilterExpression: 'contains (#name, :s)',
        ExpressionAttributeNames: { '#name': 'name' },
        ExpressionAttributeValues: { ':s': search },
      }),
    );

    const items = result.Items ?? [];
    const page = items.slice(0, limit);

    return {
      items: page.map(this.toDomain),
      count: items.length,
      nextCursor:
        items.length > limit
          ? this.encodeCursor(result.LastEvaluatedKey)
          : undefined,
    };
  }

  // ===========================================================================
  // CURSOR ENCODER / DECODER
  // ===========================================================================

  private decodeCursor(cursor?: Cursor): DynamoCursor | undefined {
    if (!cursor) return undefined;

    return JSON.parse(
      Buffer.from(cursor, 'base64').toString('utf8'),
    ) as DynamoCursor;
  }

  private encodeCursor(cursor?: DynamoCursor): Cursor | undefined {
    if (!cursor) return undefined;

    return Buffer.from(JSON.stringify(cursor)).toString('base64') as Cursor;
  }

  // ===========================================================================
  // MAPPER
  // ===========================================================================

  private toDomain(raw: Record<string, any>): Product {
    return Product.fromPrimitives({
      productId: raw.productId,
      name: raw.name,
      description: raw.description,
      price: raw.price,
      stock: raw.stock,
      category: raw.category,
      sku: raw.sku,
      image: raw.image,
      categoryId: raw.categoryId,
      ingredients: raw.ingredients,
      active: raw.active,
      createdAt: new Date(raw.createdAt),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : null,
      deletedAt: raw.deletedAt ? new Date(raw.deletedAt) : null,
    });
  }
}
