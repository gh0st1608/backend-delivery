// src/application/exceptions/application.exception.ts

export abstract class InfrastructureException extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly message: string,
    public readonly title: string = 'Error de infraestructura', // puedes sobrescribirlo
  ) {
    super(message);
  }
}
