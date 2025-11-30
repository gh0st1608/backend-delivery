import { Injectable } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Cart } from '../../domain/entities/cart.entity';
import { CartRepository } from '../../domain/repository/cart.repository';

@Injectable()
export class CartRepositoryImpl implements CartRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName = process.env.CART_TABLE ?? 'Carts';

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

  async getByUserId(userId: string): Promise<Cart | null> {
    const cart = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI_UserId',
        KeyConditionExpression: 'userId = :u',
        ExpressionAttributeValues: {
          ':u': userId,
        },
        Limit: 1,
      }),
    );
    const cartData = cart.Items?.[0];
    if (!cartData) return null;

    return new Cart({
      cartId: cartData.cartId,
      userId: cartData.userId,
      items: cartData.items ?? [],
      createdAt: new Date(cartData.createdAt),
      updatedAt: new Date(cartData.updatedAt),
    });
  }

  async save(cart: Cart): Promise<string> {
    const props = cart.properties();

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          cartId: props.cartId,
          userId: props.userId,
          items: props.items,
          createdAt: props.createdAt.toISOString(),
        },
      }),
    );

    return props.cartId;
  }

  async delete(userId: string): Promise<void> {
    await this.docClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { userId },
      }),
    );
  }
}
