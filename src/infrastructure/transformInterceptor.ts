import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    const { method, originalUrl } = request;

    this.logger.log(`[START] ${method} ${originalUrl}`);
    const now = Date.now();

    if (request.body?.Data) {
      request.body = request.body?.Data;
    }

    return next.handle().pipe(
      map((data) => {
        const duration = Date.now() - now;
        this.logger.log(
          `[END] ${method} ${originalUrl} - Duration: ${duration}ms`,
        );
        return {
          Data: data,
        };
      }),
    );
  }
}
