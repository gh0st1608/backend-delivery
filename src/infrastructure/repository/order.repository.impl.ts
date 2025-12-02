import { Injectable } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

import { OrderRepository } from '../../domain/repository/order.repository';
import { Order } from '../../domain/order.entity';

@Injectable()
export class OrderRepositoryImpl implements OrderRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName = process.env.CART_TABLE ?? 'Orders';

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
    });

    this.docClient = DynamoDBDocumentClient.from(client);
  }

  async save(order: Order): Promise<string> {
    const props = order.properties();
    console.log('props', props);
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          ...props,
          createdAt: props.createdAt.toISOString(),
          updatedAt: props.updatedAt?.toISOString() ?? null,
        },
      }),
    );

    return props.orderId;
  }

  async getById(orderId: string): Promise<Order | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { orderId },
      }),
    );

    const orderData = result.Item;
    if (!orderData) return null;

    return new Order({
      orderId: orderData.orderId,
      userId: orderData.userId,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      status: orderData.status,
      createdAt: orderData.createdAt ? new Date(orderData.createdAt) : new Date(),
      updatedAt: orderData.updatedAt ? new Date(orderData.updatedAt) : null,
      deletedAt: orderData.deletedAt ? new Date(orderData.deletedAt) : null,
    });
  }
}
