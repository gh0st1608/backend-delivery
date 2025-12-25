export enum ServerErrorMessages {
  DYNAMO_DB_ERROR = 'Conexion a dynamoDb fallido.',
}

export enum DomainErrorMessages {
  INVALID_CREDENTIALS = 'Credenciales inválidas',
  INVALID_EMAIL = 'Email inválido',
  EXPIRED_VERIFICATION_CODE = 'El código ha expirado',
  INVALID_VERIFICATION_CODE = 'El código ingresado es incorrecto',
  NOT_EXIST_VERIFICATION_CODE = 'No existe ningún código activo para este usuario',
}

export enum InfraErrorMessages{
  SAVE_FAILED = 'Error al guardar item en dynamo',
  UPDATE_FAILED = 'Error al actualizar item en dynamo',
  GET_FAILED = 'Error al obtener item en dynamo'
}

export enum DomainSuccessMessages {
  LOGIN_SUCESS = 'Inicio de sesión exitoso',
  LOGIN_FAILED = 'Inicio de sesión fallido',
  REGISTER_SUCCESS = 'Usuario registrado correctamente',
  EMAIL_VERIFIED = 'Email Validado correctamente',
  SET_PASSWORD_SUCCESS = 'Contraseña actualizado correctamente',
  CREATE_PREFERENCE_SUCCESS = 'Preferencia creado con exito',
  GET_PREFERENCES_SUCCESS = 'Preferencias obtenido con exito',
  GET_USERS_SUCESS = 'Lista de usuarios obtenido con exito',
  GET_USER_SUCESS = 'Usuario obtenido con exito',
  CREATE_USER_SUCESS = 'Usuario creado con exito'
}
