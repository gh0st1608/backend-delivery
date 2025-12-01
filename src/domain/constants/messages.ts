export enum ServerErrorMessages {
  DYNAMO_DB_ERROR = 'Conexion a dynamoDb fallido.',
}

export enum DomainErrorMessages {
  INVALID_CREDENTIALS = 'Credenciales inválidas',
  ORDER_NOT_FOUND = 'Orden no encontrado',
  STATUS_NOT_SUPPORTED = 'Status no soportado'
}

export enum DomainSuccessMessages {
  GET_ORDER_SUCESS = 'Orden obtenido con éxito',
  DELETE_ORDER_SUCESS = 'Orden eliminado con éxito',
  CREATE_ORDER_SUCCESS = 'Orden creado con éxito',
  UPDATE_ORDER_SUCCESS = 'Orden actualizado con éxito'
}
