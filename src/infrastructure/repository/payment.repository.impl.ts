import { Injectable } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient, AttributeValue } from '@aws-sdk/client-dynamodb';
import { PaymentRepository } from '../../domain/repository/payment.repository';
import { Payment } from '../../domain/payment.entity';
import { Cursor, PaymentProvider } from '../../domain/types/shared';
import { SaveFailedException } from '../exceptions/save-failed.exceptions';
import { GetByParamsDto } from '../../application/dto/request/get-by-params.dto';
import { PaginatedResult } from '../../application/dto/response/response-custom.dto';
import { GetListFailedException } from '../exceptions/get-list-failed.exceptions';
import { getAwsCredentials } from '../helpers/aws.helper';

export type DynamoCursor = Record<string, AttributeValue>;

@Injectable()
export class PaymentRepositoryImpl implements PaymentRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName = 'Payments';

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

  async save(payment: Payment): Promise<string> {
    try {
      const primitives = payment.toPrimitives();

      await this.docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: primitives,
        }),
      );

      return primitives.paymentId;
    } catch (error) {
      console.error(error);
      throw new SaveFailedException();
    }
  }

  async findByProviderOrderId(
  provider: PaymentProvider,
  token: string,
): Promise<Payment | null> {
  const result = await this.docClient.send(
    new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI_PROVIDER_TOKEN',
      KeyConditionExpression: 'GSI2PK = :pk AND GSI2SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `TOKEN#${token}`,
        ':sk': `PROVIDER#${provider}`,
      },
      Limit: 1,
    }),
  );

  if (!result.Items || result.Items.length === 0) {
    return null;
  }

  return this.toDomain(result.Items[0]);
}

  // ======================================================
  // FIND BY PAYMENT ID
  // ======================================================

  async findByPaymentId(paymentId: string): Promise<Payment | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { paymentId },
      }),
    );

    return result.Item ? this.toDomain(result.Item) : null;
  }

    async getList(query: GetByParamsDto): Promise<PaginatedResult<Payment>> {
    try {
      const limit = Number(query.limit) || 10;
      const cursor = query.cursor as Cursor | undefined;
      const result = await this.docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'GSI_PAYMENT',
          KeyConditionExpression: 'GSI1PK = :pk',
          ExpressionAttributeValues: {
            ':pk': 'PAYMENT',
          },
          Limit: limit,
          ExclusiveStartKey: this.decodeCursor(cursor),
          ScanIndexForward: false, // opcional: newest first
        }),
      );

      const items = result.Items ?? [];

      return {
        items: items.map(Payment.fromPrimitives),
        count: items.length,
        nextCursor: this.encodeCursor(result.LastEvaluatedKey),
      };
    } catch (error) {
      console.log(error);
      throw new GetListFailedException();
    }
  }

  // ======================================================
  // UPDATE
  // ======================================================

  async update(payment: Payment): Promise<string> {
    try {
      const primitives = payment.toPrimitives();

      await this.docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: primitives,
        }),
      );

      return primitives.paymentId
    } catch (error) {
      console.error(error);
      throw new SaveFailedException();
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

  private toDomain = (raw: Record<string, any>): Payment => {
    return Payment.fromPrimitives({
      paymentId: raw.paymentId,
      orderId: raw.orderId,
      amount: raw.amount,
      currency: raw.currency,
      status: raw.status,
      provider: raw.provider,
      createdAt: new Date(raw.createdAt),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : null,
      deletedAt: raw.deletedAt ? new Date(raw.deletedAt) : null,
    });
  };
}
