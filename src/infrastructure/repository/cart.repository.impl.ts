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

import { getAwsCredentials } from '../helpers/aws.helper';

import { SaveFailedException } from '../exceptions/save-failed.exceptions';
import { GetByUserFailedException } from '../exceptions/get-by-user-failed.exceptions';
import { DeleteFailedException } from '../exceptions/delete-failed.exceptions';

@Injectable()
export class CartRepositoryImpl implements CartRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName = process.env.CART_TABLE ?? 'Carts';

  constructor() {
    this.docClient = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: process.env.AWS_REGION ?? 'us-east-1',
        credentials: getAwsCredentials(),
      }),
    );
  }

  // ======================================================
  // GET CART BY USER
  // ======================================================

  async getByUserId(userId: string): Promise<Cart | null> {
    try {
      const result = await this.docClient.send(
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

      const cart = result.Items?.[0];
      if (!cart) return null;

      return this.toDomain(cart);
    } catch (error) {
      console.error(error);
      throw new GetByUserFailedException();
    }
  }

  // ======================================================
  // SAVE CART
  // ======================================================

  async save(cart: Cart): Promise<string> {
    try {
      const primitives = cart.properties();

      await this.docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: {
            cartId: primitives.cartId,
            userId: primitives.userId,
            items: primitives.items,
            createdAt: primitives.createdAt.toISOString(),
            updatedAt: primitives.updatedAt?.toISOString() ?? null,
          },
        }),
      );

      return primitives.cartId;
    } catch (error) {
      console.error(error);
      throw new SaveFailedException();
    }
  }

  // ======================================================
  // DELETE CART
  // ======================================================

  async delete(userId: string): Promise<void> {
    try {
      await this.docClient.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: {
            userId,
          },
        }),
      );
    } catch (error) {
      console.error(error);
      throw new DeleteFailedException();
    }
  }

  // ======================================================
  // MAPPER
  // ======================================================

  private toDomain(raw: Record<string, any>): Cart {
    return new Cart({
      cartId: raw.cartId,
      userId: raw.userId,
      items: raw.items ?? [],
      createdAt: new Date(raw.createdAt),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(raw.createdAt),
    });
  }
}