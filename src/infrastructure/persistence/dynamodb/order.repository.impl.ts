import { Injectable } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { AttributeValue, DynamoDBClient } from '@aws-sdk/client-dynamodb';

import { OrderRepository } from '../../../domain/repository/order.repository';
import { Order } from '../../../domain/order.entity';

import { getAwsCredentials } from '../../helpers/aws.helper';
import { Cursor } from '../../../domain/constants/types';
import { GetByParamsDto } from '../../../application/dto/request/get-by-params.dto';
import { PaginatedResult } from '../../../application/dto/response/response-custom.dto';

import { SaveFailedException } from '../../exceptions/save-failed.exceptions';
import { GetListFailedException } from '../../exceptions/get-list-failed.exceptions';

export type DynamoCursor = Record<string, AttributeValue>;

@Injectable()
export class OrderRepositoryImpl implements OrderRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName = process.env.ORDER_TABLE ?? 'Orders';

  constructor() {
    this.docClient = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: process.env.AWS_REGION ?? 'us-east-1',
        credentials: getAwsCredentials(),
      }),
      {
        marshallOptions: {
          removeUndefinedValues: true,
        },
      },
    );
  }

  // ======================================================
  // SAVE
  // ======================================================

  async save(order: Order): Promise<string> {
    try {
      const primitives = order.toPrimitives();

      await this.docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: primitives,
        }),
      );

      return primitives.orderId;
    } catch (error) {
      console.error(error);
      throw new SaveFailedException();
    }
  }

  // ======================================================
  // FIND BY ID
  // ======================================================

  async getById(orderId: string): Promise<Order | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { orderId },
      }),
    );

    return result.Item ? this.toDomain(result.Item) : null;
  }

  // ======================================================
  // GET LIST (PAGINATED)
  // ======================================================

  async getList(query: GetByParamsDto): Promise<PaginatedResult<Order>> {
  try {
    const limit = Number(query.limit) || 10;
    const cursor = query.cursor as Cursor | undefined;

    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI_ORDER',

        // 🔥 Ahora sí tiene sentido
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': 'ORDER',
        },

        Limit: limit,

        // paginación
        ExclusiveStartKey: cursor
          ? this.decodeCursor(cursor)
          : undefined,

        // false = más recientes primero
        ScanIndexForward: false,
      }),
    );

    const items = result.Items ?? [];

    return {
      items: items.map(item => this.toDomain(item)),
      count: items.length,
      nextCursor: result.LastEvaluatedKey
        ? this.encodeCursor(result.LastEvaluatedKey)
        : undefined,
    };
  } catch (error) {
    console.error(error);
    throw new GetListFailedException();
  }
}


  // ======================================================
  // ÓRDENES DE UN USUARIO
  // ======================================================

  async getListByUser(
    userId: string,
    query: GetByParamsDto,
  ): Promise<PaginatedResult<Order>> {
    try {
      const limit = Number(query.limit) || 10;
      const result = await this.docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'GSI_ORDER',
          KeyConditionExpression: 'GSI1PK = :pk',
          FilterExpression: 'userId = :u',
          ExpressionAttributeValues: {
            ':pk': 'ORDER',
            ':u': userId,
          },
          Limit: limit,
          ExclusiveStartKey: query.cursor
            ? this.decodeCursor(query.cursor as Cursor)
            : undefined,
          ScanIndexForward: false,
        }),
      );

      const items = result.Items ?? [];

      return {
        items: items.map((item) => this.toDomain(item)),
        count: items.length,
        nextCursor: result.LastEvaluatedKey
          ? this.encodeCursor(result.LastEvaluatedKey)
          : undefined,
      };
    } catch (error) {
      console.error(error);
      throw new GetListFailedException();
    }
  }

  // ======================================================
  // PAGADAS SIN REPARTIDOR (reintentos de asignación)
  // ======================================================

  async findPendingAssignment(limit: number): Promise<Order[]> {
    const orders: Order[] = [];
    let cursor: DynamoCursor | undefined;

    do {
      const result = await this.docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'GSI_ORDER',
          KeyConditionExpression: 'GSI1PK = :pk',
          FilterExpression: '#status = :paid AND statusDelivery = :created',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':pk': 'ORDER',
            ':paid': 'PAID',
            ':created': 'CREATED',
          },
          ExclusiveStartKey: cursor,
          // Las más antiguas primero: llevan más tiempo esperando
          ScanIndexForward: true,
        }),
      );

      orders.push(...(result.Items ?? []).map((item) => this.toDomain(item)));
      cursor = result.LastEvaluatedKey as DynamoCursor | undefined;
    } while (cursor && orders.length < limit);

    return orders.slice(0, limit);
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

  private toDomain = (raw: Record<string, any>): Order =>
    Order.fromPrimitives(raw);
}
