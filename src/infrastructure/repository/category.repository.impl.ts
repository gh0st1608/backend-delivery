import { Injectable } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient, AttributeValue } from '@aws-sdk/client-dynamodb';

import { Cursor } from '../../domain/types/shared';
import { Category } from '../../domain/category.entity';
import { PaginatedResult } from '../../application/dto/response/response-custom.dto';
import { CategoryRepository } from '../../domain/repository/category.repository';
import { GetByParamsDto } from '../../application/dto/request/get-by-params.dto';

export type DynamoCursor = Record<string, AttributeValue>;

@Injectable()
export class CategoryRepositoryImpl implements CategoryRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName = 'Categories';

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
  // PUBLIC METHODS
  // ===========================================================================

  async getList(query: GetByParamsDto): Promise<PaginatedResult<Category>> {
    const limit = Number(query.limit) || 10;
    const cursor = this.decodeCursor(query.cursor as Cursor);

    if (query.search) {
      return this.scanWithSearch(query.search, limit, cursor);
    }

    return this.scanWithoutSearch(limit, cursor);
  }

  async getById(id: string): Promise<Category | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { categoryId: id },
      }),
    );

    return result.Item ? this.toDomain(result.Item) : null;
  }

  async save(category: Category): Promise<string> {
    const primitives = category.toPrimitives();

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: primitives,
      }),
    );

    return primitives.categoryId;
  }

  // ===========================================================================
  // PRIVATE: SCAN METHODS
  // ===========================================================================

  private async scanWithoutSearch(
    limit: number,
    cursor?: DynamoCursor,
  ): Promise<PaginatedResult<Category>> {
    const result = await this.docClient.send(
      new ScanCommand({
        TableName: this.tableName,
        Limit: limit,
        ExclusiveStartKey: cursor,
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
    cursor?: DynamoCursor,
  ): Promise<PaginatedResult<Category>> {
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

  private toDomain = (raw: Record<string, any>): Category => {
    return Category.fromPrimitives({
      categoryId: raw.categoryId,
      name: raw.name,
      description: raw.description,
      image: raw.image,
      active: raw.active,
      createdAt: new Date(raw.createdAt),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : null,
      deletedAt: raw.deletedAt ? new Date(raw.deletedAt) : null,
    });
  };
}
