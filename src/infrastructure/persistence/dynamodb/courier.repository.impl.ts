import { Injectable } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { AttributeValue, DynamoDBClient } from '@aws-sdk/client-dynamodb';

import { Courier } from '../../../domain/courier.entity';
import { CourierRepository } from '../../../domain/repository/courier.repository';
import { SaveFailedException } from '../../exceptions/save-failed.exceptions';
import { GetListFailedException } from '../../exceptions/get-list-failed.exceptions';
import { GetByParamsDto } from '../../../application/dto/request/get-by-params.dto';
import { PaginatedResult } from '../../../application/dto/response/response-custom.dto';
import { getAwsCredentials } from '../../helpers/aws.helper';
import { Cursor } from '../../../domain/constants/types';

export type DynamoCursor = Record<string, AttributeValue>;

@Injectable()
export class CourierRepositoryImpl implements CourierRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName = 'Couriers';

  constructor() {
    this.docClient = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: process.env.REGION ?? 'us-east-1',
        credentials: getAwsCredentials(),
      }),
/*       {
        marshallOptions: {
          removeUndefinedValues: true,
        },
      }, */
    );
  }

  // ======================================================
  // FIND BY ID
  // ======================================================

  async getById(courierId: string): Promise<Courier | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { courierId },
      }),
    );

    return result.Item ? this.toDomain(result.Item) : null;
  }

  // ======================================================
  // GET LIST (PAGINATED)
  // ======================================================

  async getList(query: GetByParamsDto): Promise<PaginatedResult<Courier>> {
    try {
      const limit = Number(query.limit) || 10;
      const cursor = query.cursor as Cursor | undefined;

      const result = await this.docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'GSI_COURIER',
          KeyConditionExpression: 'GSI1PK = :pk',
          ExpressionAttributeValues: {
            ':pk': 'COURIER',
          },
          Limit: limit,
          ExclusiveStartKey: this.decodeCursor(cursor),
          ScanIndexForward: false,
        }),
      );

      const items = result.Items ?? [];

      return {
        items: items.map(this.toDomain),
        count: items.length,
        nextCursor: this.encodeCursor(result.LastEvaluatedKey),
      };
    } catch (error) {
      console.error(error);
      throw new GetListFailedException();
    }
  }

  async findAvailable(
    limit: number,
    maxLocationAgeSeconds: number,
  ): Promise<Courier[]> {
    const items: Courier[] = [];
    let cursor: DynamoCursor | undefined;

    do {
      const result = await this.docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'GSI_COURIER',
          KeyConditionExpression: 'GSI1PK = :pk',
          ExpressionAttributeValues: {
            ':pk': 'COURIER',
          },
          ExclusiveStartKey: cursor,
          ScanIndexForward: false,
        }),
      );

      const batch = (result.Items ?? [])
        .map(this.toDomain)
        .filter((courier) =>
          courier.isAvailableWithFreshLocation(maxLocationAgeSeconds),
        );

      items.push(...batch);
      cursor = result.LastEvaluatedKey as DynamoCursor | undefined;
    } while (cursor && items.length < limit);

    return items.slice(0, limit);
  }

  // ======================================================
  // SAVE
  // ======================================================

  async save(courier: Courier): Promise<string> {
    try {
      const primitives = courier.toPrimitives();

      await this.docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: primitives,
        }),
      );

      return primitives.courierId;
    } catch (error) {
      console.error(error);
      throw new SaveFailedException();
    }
  }

  // ======================================================
  // CURSOR HELPERS
  // ======================================================

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

  // ======================================================
  // MAPPER
  // ======================================================

  private toDomain = (raw: Record<string, any>): Courier => {
    return Courier.fromPrimitives({
      courierId: raw.courierId,
      name: raw.name,
      phone: raw.phone,
      vehicleType: raw.vehicleType,
      status: raw.status,
      currentOrderId: raw.currentOrderId ?? null,
      currentLat: raw.currentLat ?? null,
      currentLng: raw.currentLng ?? null,
      lastLocationAt: raw.lastLocationAt ? new Date(raw.lastLocationAt) : null,
      createdAt: new Date(raw.createdAt),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : null,
      deletedAt: raw.deletedAt ? new Date(raw.deletedAt) : null,
    });
  };
}
