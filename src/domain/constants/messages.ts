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

export enum DomainSuccessMessages {
  LOGIN_SUCESS = 'Inicio de sesión exitoso',
  LOGIN_FAILED = 'Inicio de sesión fallido',
  REGISTER_SUCCESS = 'Usuario registrado correctamente',
  EMAIL_VERIFIED = 'Email Validado correctamente',
}
