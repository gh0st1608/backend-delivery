import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HelperError } from './helper-error';
import { Response } from 'express';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  async catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const formatted = await HelperError.response(exception);
    const status = formatted.getStatus();
    const body = formatted.getResponse();
    response.status(status).json(body);
  }
}
