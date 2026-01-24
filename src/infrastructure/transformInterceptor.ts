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
    const now = Date.now();

    /** ============================
     * HTTP
     ============================ */
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      const { method, originalUrl } = request;

      this.logger.log(`[HTTP][START] ${method} ${originalUrl}`);

      // 🔥 unwrap Data
      if (request.body?.Data) {
        request.body = request.body.Data;
      }

      return next.handle().pipe(
        map((data) => {
          const duration = Date.now() - now;
          this.logger.log(
            `[HTTP][END] ${method} ${originalUrl} - ${duration}ms`,
          );
          return { Data: data };
        }),
      );
    }

    /** ============================
     * WEBSOCKET
     ============================ */
    if (context.getType() === 'ws') {
      const wsContext = context.switchToWs();
      const client = wsContext.getClient();
      const payload = wsContext.getData();

      this.logger.log(
        `[WS][START] client=${client?.id ?? 'unknown'}`,
      );

      // 🔥 unwrap Data (esto es CLAVE)
      if (payload?.Data) {
        wsContext.getData = () => payload.Data;
      }
      console.log('data',payload)
      return next.handle().pipe(
        map((data) => {
          const duration = Date.now() - now;
          this.logger.log(
            `[WS][END] client=${client?.id ?? 'unknown'} - ${duration}ms`,
          );
          
          return { Data: data };
        }),
      );
    }

    // fallback (por seguridad)
    return next.handle();
  }
}
