import { Injectable } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  UpdateCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

import { User } from '../../domain/user.entity';
import { UserRepository } from '../../domain/repository/user.repository';
import { UserPropertiesUpdate } from '../../domain/user.entity';
import { SaveFailedException } from '../exceptions/save-failed.exceptions';
import { UpdateFailedException } from '../exceptions/update-failed.exceptions';
import { GetByParamsDto } from '../../application/dto/request/get-by-params.dto';
import { PaginatedResult } from '../../application/dto/response/response-custom.dto';
import { Cursor } from '../../domain/types/shared';
import { DynamoCursor } from './preference.repository.impl';
import { GetListFailedException } from '../exceptions/get-list-failed.exceptions';

@Injectable()
export class UserRepositoryImpl implements UserRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName = 'Users';

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
  // FIND BY EMAIL
  // ======================================================

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email,
        },
        Limit: 1,
      }),
    );

    const item = result.Items?.[0];
    if (!item) return null;

    return User.fromPrimitives(item);
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { userId: id },
      }),
    );

    return result.Item ? this.toDomain(result.Item) : null;
  }

  async getList(query: GetByParamsDto): Promise<PaginatedResult<User>> {
    try {
      const limit = Number(query.limit) || 10;
      const cursor = query.cursor as Cursor | undefined;
      const result = await this.docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'GSI_USER',
          KeyConditionExpression: 'GSI1PK = :pk',
          ExpressionAttributeValues: {
            ':pk': 'USER',
          },
          Limit: limit,
          ExclusiveStartKey: this.decodeCursor(cursor),
          ScanIndexForward: false, // opcional: newest first
        }),
      );

      const items = result.Items ?? [];

      return {
        items: items.map(User.fromPrimitives),
        count: items.length,
        nextCursor: this.encodeCursor(result.LastEvaluatedKey),
      };
    } catch (error) {
      console.log(error);
      throw new GetListFailedException();
    }
  }

  // ======================================================
  // SAVE
  // ======================================================

  async save(user: User): Promise<string> {
    try {
      const primitives = user.toPrimitives();
      await this.docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: primitives,
        }),
      );

      return primitives.userId
    } catch (error) {
      console.error(error);
      throw new SaveFailedException();
    }
  }

  // ======================================================
  // UPDATE (GENÉRICO)
  // ======================================================

  async update(userId: string, data: UserPropertiesUpdate): Promise<void> {
    const entries = Object.entries({
      ...data,
      updatedAt: new Date().toISOString(),
    });

    if (!entries.length) return;

    const updateExpressions: string[] = [];
    const attributeNames: Record<string, string> = {};
    const attributeValues: Record<string, any> = {};

    for (const [key, value] of entries) {
      updateExpressions.push(`#${key} = :${key}`);
      attributeNames[`#${key}`] = key;
      attributeValues[`:${key}`] = value;
    }

    try {
      await this.docClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: {
            PK: `USER#${userId}`,
            SK: 'METADATA',
          },
          UpdateExpression: `SET ${updateExpressions.join(', ')}`,
          ExpressionAttributeNames: attributeNames,
          ExpressionAttributeValues: attributeValues,
        }),
      );
    } catch (error) {
      console.error(error);
      throw new UpdateFailedException();
    }
  }

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

  private toDomain = (raw: Record<string, any>): User => {
    return User.fromPrimitives({
      userId: raw.userId,
      name: raw.name,
      lastname: raw.lastname,
      email: raw.email,
      password: raw.password,
      roles: raw.roles,
      photo: raw.photo,
      onboardingRequired: raw.onboardingRequired,
      active: raw.active,
      refreshToken: raw.refreshToken,
      verificationCode: raw.verificationCode,
      verificationCodeExpiresAt: raw.verificationCodeExpiresAt,
      createdAt: new Date(raw.createdAt),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : null,
      deletedAt: raw.deletedAt ? new Date(raw.deletedAt) : null,
    });
  };
}
