import { Injectable } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';
import { Product } from '../../domain/product.entity';
import { ProductRepository } from '../../domain/repository/product.repository';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetProductsDto } from '../../application/dto/request/get-products-by-params.dto';

@Injectable()
export class ProductRepositoryImpl implements ProductRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName = 'Products';

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

  async getList(query: GetProductsDto): Promise<{
    items: Product[];
    nextCursor: string;
  }> {
    try {
      const limit = query.limit ?? 10;

      // Decode del cursor (ExclusiveStartKey)
      let exclusiveStartKey = undefined;
      if (query.cursor) {
        exclusiveStartKey = JSON.parse(
          Buffer.from(query.cursor, 'base64').toString('utf8'),
        );
      }

      const scanParams: any = {
        TableName: this.tableName,
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey,
      };

      // Si quieres búsqueda por texto, se activa Scan + FilterExpression
      if (query.search) {
        scanParams.FilterExpression = 'contains (#name, :search)';
        scanParams.ExpressionAttributeNames = {
          '#name': 'name',
        };
        scanParams.ExpressionAttributeValues = {
          ':search': query.search,
        };
      }

      const result = await this.docClient.send(new ScanCommand(scanParams));

      const items = (result.Items ?? []).map(
        (item) =>
          new Product({
            productId: item.productId,
            name: item.name,
            description: item.description,
            price: item.price,
            stock: item.stock,
            category: item.category,
            active: item.active,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          }),
      );

      let nextCursor = undefined;

      if (result.LastEvaluatedKey) {
        nextCursor = Buffer.from(
          JSON.stringify(result.LastEvaluatedKey),
        ).toString('base64');
      }

      return {
        items,
        nextCursor,
      };
    } catch (error) {
      throw error;
    }
  }

  async getById(id: string): Promise<Product | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { productId: id },
      }),
    );
    try {
      const data = result.Item;
      if (!data) return null;

      return new Product({
        productId: data.productId,
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        category: data.category,
        //photo: data.photo,
        active: data.active,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      });
    } catch (error) {
      throw error;
    }
  }

  async save(product: Product): Promise<string> {
    try {
      const props = product.properties();

      const command = new PutCommand({
        TableName: this.tableName,
        Item: {
          productId: props.productId,
          name: props.name,
          description: props.description,
          price: props.price,
          stock: props.stock,
          category: props.category,
          //photo: props.photo,
          active: props.active,
          createdAt: props.createdAt?.toISOString(),
          updatedAt: props.updatedAt?.toISOString() ?? new Date().toISOString(),
        },
      });

      await this.docClient.send(command);
      return props.productId;
    } catch (error) {
      throw error;
    }
  }
}
