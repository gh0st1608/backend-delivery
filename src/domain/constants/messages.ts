export enum InfraErrorMessages{
  SERVER_WEBSOCKET_NOT_FOUND = 'Servidor socket no encontrado',
  DYNAMO_DB_ERROR = 'Conexion a dynamoDb fallido.',
  SAVE_FAILED = 'Error al guardar item en dynamo',
  UPDATE_FAILED = 'Error al actualizar item en dynamo',
  GET_FAILED = 'Error al obtener item en dynamo',
  DELETE_FAILED = 'Error al eliminar item en dynamo'
}
export enum DomainErrorMessages {
  INVALID_CREDENTIALS = 'Credenciales inválidas',
  CART_NOT_FOUND = 'Carrito no encontrado',
}

export enum DomainSuccessMessages {
  GET_CART_SUCESS = 'Carrito obtenido con éxito',
  REMOVE_ITEM_SUCESS = 'Item eliminado con éxito',
  CREATE_ITEM_CART_SUCCESS = 'Item Carrito agregado con éxito',
  CLEAR_ITEMS_CART_SUCCESS = 'Carrito vaciado con éxito',
}
