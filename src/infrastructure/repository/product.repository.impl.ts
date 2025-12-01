import { Injectable } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

import { Product } from '../../domain/product.entity';
import { ProductRepository } from '../../domain/repository/product.repository';
import { GetProductsDto } from '../../application/dto/request/get-products-by-params.dto';

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
    );
  }

  // ===========================================================================
  // PUBLIC METHODS
  // ===========================================================================

  async getList(query: GetProductsDto) {
    const limit = Number(query.limit) || 10;
    const cursor = this.decodeCursor(query.cursor);

    if (query.search) {
      return this.scanWithSearch(query.search, limit, cursor);
    }

    return this.scanWithoutSearch(limit, cursor);
  }

  async getById(id: string): Promise<any | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { productId: id },
      }),
    );

    return result.Item ?? null;
  }

  async save(product: Product): Promise<string> {
    const props = product.properties();

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          ...props,
          createdAt: props.createdAt?.toISOString(),
          updatedAt: props.updatedAt?.toISOString() ?? new Date().toISOString(),
        },
      }),
    );

    return props.productId;
  }

  // ===========================================================================
  // PRIVATE: SCAN METHODS (MINIMAL)
  // ===========================================================================

  private async scanWithoutSearch(limit: number, cursor: any) {
    const result = await this.docClient.send(
      new ScanCommand({
        TableName: this.tableName,
        Limit: limit,
        ExclusiveStartKey: cursor,
      }),
    );

    return {
      items: result.Items ?? [],
      nextCursor: this.encodeCursor(result.LastEvaluatedKey),
    };
  }

  private async scanWithSearch(search: string, limit: number, cursor: any) {
    const result = await this.docClient.send(
      new ScanCommand({
        TableName: this.tableName,
        ExclusiveStartKey: cursor,
        FilterExpression: 'contains (#name, :s)',
        ExpressionAttributeNames: { '#name': 'name' },
        ExpressionAttributeValues: { ':s': search },
      }),
    );

    const items = result.Items ?? [];
    const { page, hasNextPage } = this.applyPagination(items, limit);

    return {
      items: page,
      nextCursor: hasNextPage
        ? this.encodeCursor(result.LastEvaluatedKey)
        : undefined,
    };
  }

  // ===========================================================================
  // UTILITIES (SE CONSERVAN)
  // ===========================================================================

  private decodeCursor(cursor?: string) {
    try {
      return cursor
        ? JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'))
        : undefined;
    } catch {
      return undefined;
    }
  }

  private encodeCursor(key?: any) {
    return key
      ? Buffer.from(JSON.stringify(key)).toString('base64')
      : undefined;
  }

  private applyPagination(items: any[], limit: number) {
    return {
      page: items.slice(0, limit),
      hasNextPage: items.length > limit,
    };
  }
}
