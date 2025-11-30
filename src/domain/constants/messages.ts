export enum ServerErrorMessages {
  DYNAMO_DB_ERROR = 'Conexion a dynamoDb fallido.',
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
