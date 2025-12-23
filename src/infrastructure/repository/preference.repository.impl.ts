import { Injectable } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient, AttributeValue } from '@aws-sdk/client-dynamodb';

import { PreferenceRepository } from '../../domain/repository/preference.repository';
import { Preference } from '../../domain/preference.entity';
import { GetByParamsDto } from '../../application/dto/request/get-by-params.dto';
import { PaginatedResult } from '../../application/dto/response/response-custom.dto';
import { Cursor } from '../../domain/types/shared';
import { SaveFailedException } from '../exceptions/save-failed.exceptions';

export type DynamoCursor = Record<string, AttributeValue>;

@Injectable()
export class PreferenceRepositoryImpl implements PreferenceRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName = 'Preferences';

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

  // ======================================================
  // PUBLIC METHODS
  // ======================================================

  async save(preference: Preference): Promise<string> {
    try {

      const primitives = preference.toPrimitives();
      await this.docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: primitives
        }),
      );

      return primitives.preferenceId;
    } catch (error) {
      console.log(error)
      throw new SaveFailedException();
    }
  }

  async getList(query: GetByParamsDto): Promise<PaginatedResult<Preference>> {
    const limit = Number(query.limit) || 10;
    const cursor = query.cursor as Cursor | undefined;

    if (query.userId) {
      return this.getByUser(query.userId, limit, cursor);
    }

    return {
      items: [],
      count: 0,
      nextCursor: undefined,
    };
  }

  // ======================================================
  // QUERY BY USER
  // ======================================================

  private async getByUser(
    userId: string,
    limit: number,
    cursor?: Cursor,
  ): Promise<PaginatedResult<Preference>> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI_USER',
        KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'PREF#CATEGORY#',
        },
        Limit: limit,
        ExclusiveStartKey: this.decodeCursor(cursor),
      }),
    );

    const items = result.Items ?? [];

    return {
      items: items.map(Preference.fromPrimitives),
      count: items.length,
      nextCursor: this.encodeCursor(result.LastEvaluatedKey),
    };
  }

  // ======================================================
  // CURSOR ENCODER / DECODER
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
}
