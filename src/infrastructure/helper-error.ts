// src/infrastructure/helpers/HelperError.ts

import { HttpException, HttpStatus } from '@nestjs/common';
import { ApplicationException } from '../application/exceptions/application.exception';


export class HelperError {
  static async response(exception: any) {
    const isHttp = exception instanceof HttpException;
    const isApp = exception instanceof ApplicationException;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let title = 'Error inesperado';
    let code = 500;
    let statusText = 'INTERNAL_SERVER_ERROR';

    if (isHttp) {
      status = exception.getStatus();
      code = status;
      statusText = HttpStatus[status] || 'ERROR';

      const response = exception.getResponse() as any;
      message = response?.message || exception.message;
      title = HelperError.getTitle(status);
    }

    if (isApp) {
      code = exception.statusCode;
      message = exception.message;
      title = exception.title;
      status = 400; // Puedes mapearlo según el `statusCode` si deseas
      statusText = 'BAD_REQUEST';
    }

    return {
      getStatus: () => status,
      getResponse: () => ({
        Error: {
          code,
          status: statusText,
          dateTime: new Date().toISOString(),
          title,
          message,
        },
        Data: null,
      }),
    };
  }

  private static getTitle(status: number): string {
    switch (status) {
      case 400: return 'Petición incorrecta';
      case 401: return 'No autorizado';
      case 403: return 'Acceso prohibido';
      case 404: return 'No encontrado';
      case 500: return 'Error interno del servidor';
      default: return 'Error inesperado';
    }
  }
}
