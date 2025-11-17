import { Injectable } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { User } from '../../domain/user.entity';
import { UserRepository } from '../../domain/repository/user.repository';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

@Injectable()
export class UserRepositoryImpl implements UserRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName = 'Users';

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
    });

    this.docClient = DynamoDBDocumentClient.from(client);
  }

  async findByEmail(email: string): Promise<User | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'EmailIndex', // GSI que definimos en Terraform
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    });

    const result = await this.docClient.send(command);

    const userData = result.Items?.[0];
    if (!userData) return null;

    return new User({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      password: userData.password,
      roles: userData.roles,
    });
  }

  async save(user: User): Promise<void> {
    const props = user.properties();
    console.log('props',props)

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        userId: props.id, // ← debe coincidir con el hash_key de la tabla
        email: props.email,
        name: props.name,
        password: props.password,
        roles: props.roles,
      },
    });

    await this.docClient.send(command);
  }
}
