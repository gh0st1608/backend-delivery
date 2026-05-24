export enum InfraErrorMessages {
  SERVER_WEBSOCKET_NOT_FOUND = 'Servidor socket no encontrado',
  DYNAMO_DB_ERROR = 'Conexion a dynamoDb fallido.',
  SAVE_FAILED = 'Error al guardar item en dynamo',
  UPDATE_FAILED = 'Error al actualizar item en dynamo',
  GET_FAILED = 'Error al obtener item en dynamo',
}

export enum DomainErrorMessages {
  INVALID_CREDENTIALS = 'Credenciales invalidas',
  ORDER_NOT_FOUND = 'Orden no encontrado',
  COURIER_NOT_FOUND = 'Courier no encontrado',
  STATUS_NOT_SUPPORTED = 'Status no soportado',
}

export enum DomainSuccessMessages {
  GET_ORDER_STATUS_SUCESS = 'Status de orden obtenido con exito',
  GET_ORDER_SUCESS = 'Orden obtenido con exito',
  DELETE_ORDER_SUCESS = 'Orden eliminado con exito',
  CREATE_ORDER_SUCCESS = 'Orden creado con exito',
  UPDATE_ORDER_SUCCESS = 'Orden actualizado con exito',
  CREATE_COURIER_SUCESS = 'Courier creado con exito',
  GET_COURIER_SUCESS = 'Courier obtenido con exito',
  UPDATE_COURIER_SUCCESS = 'Courier actualizado con exito',
}
