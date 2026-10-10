import { Injectable } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { RefreshToken } from '../../domain/refresh-token.entity';
import { RefreshTokenRepository } from '../../domain/repository/refresh-token.repository';
import { SaveFailedException } from '../exceptions/save-failed.exceptions';
import { UpdateFailedException } from '../exceptions/update-failed.exceptions';
import { getAwsCredentials } from '../helpers/aws.helper';

/**
 * Tabla RefreshTokens
 *  - PK: tokenHash (S)
 *  - GSI_FAMILY: familyId (S)  → revocar toda una sesión
 *  - TTL: atributo "ttl"
 */
@Injectable()
export class RefreshTokenRepositoryImpl implements RefreshTokenRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName = process.env.REFRESH_TOKEN_TABLE ?? 'RefreshTokens';

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

  async save(token: RefreshToken): Promise<void> {
    try {
      await this.docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: token.toPrimitives(),
        }),
      );
    } catch (error) {
      console.error(error);
      throw new SaveFailedException();
    }
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { tokenHash },
        ConsistentRead: true,
      }),
    );

    return result.Item ? RefreshToken.fromPrimitives(result.Item) : null;
  }

  async revokeFamily(familyId: string): Promise<void> {
    try {
      let cursor: Record<string, any> | undefined;
      const revokedAt = new Date().toISOString();

      do {
        const result = await this.docClient.send(
          new QueryCommand({
            TableName: this.tableName,
            IndexName: 'GSI_FAMILY',
            KeyConditionExpression: 'familyId = :f',
            ExpressionAttributeValues: { ':f': familyId },
            ExclusiveStartKey: cursor,
          }),
        );

        for (const item of result.Items ?? []) {
          if (item.revokedAt) continue;

          await this.docClient.send(
            new UpdateCommand({
              TableName: this.tableName,
              Key: { tokenHash: item.tokenHash },
              UpdateExpression: 'SET revokedAt = :r',
              ExpressionAttributeValues: { ':r': revokedAt },
            }),
          );
        }

        cursor = result.LastEvaluatedKey;
      } while (cursor);
    } catch (error) {
      console.error(error);
      throw new UpdateFailedException();
    }
  }
}
