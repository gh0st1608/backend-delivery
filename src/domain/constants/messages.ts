export enum ServerErrorMessages {
  DYNAMO_DB_ERROR = 'Conexion a dynamoDb fallido.',
}

export enum DomainErrorMessages {
  PAYMENT_NOT_FOUND = 'Pago no encontrado',
  PAYMENT_NOT_COMPLETE = 'Pago no compleado',
}

export enum InfraErrorMessages{
  SAVE_FAILED = 'Error al guardar item en dynamo',
  UPDATE_FAILED = 'Error al actualizar item en dynamo',
  GET_FAILED = 'Error al obtener item en dynamo'
}

export enum DomainSuccessMessages {
  GET_PAYMENTS_SUCESS = 'Lista de pagos obtenido con exito',
  GET_PAYMENT_SUCESS = 'Pago obtenido con exito',
  CREATE_PAYMENT_SUCESS = 'Pago creado con exito',
  CONFIRM_PAYMENT_SUCESS = 'Pago confirmado con exito',
  CREATE_PAYMENT_PAYPAL_SUCESS = 'Pago de paypal creado con exito'
}
