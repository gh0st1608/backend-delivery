import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { HelperError } from "./helper-error";
import { Response } from 'express';

// src/infrastructure/filters/http-error.filter.ts
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  async catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const formatted = await HelperError.response(exception);
    const status = formatted.getStatus(); // es un número
    const body = formatted.getResponse(); // es el objeto que quieres devolver

    response.status(status).json(body); // ✅ correcto
  }
}
