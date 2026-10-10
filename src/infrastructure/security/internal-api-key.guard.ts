import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

/**
 * Protege endpoints de administración/servicio a servicio hasta que exista
 * la plataforma de administración con roles. Se envía en "X-Internal-Api-Key".
 */
@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.INTERNAL_API_KEY ?? '';
    const request = context.switchToHttp().getRequest();
    const received = String(request.headers['x-internal-api-key'] ?? '');

    const valid =
      expected.length > 0 &&
      received.length === expected.length &&
      timingSafeEqual(Buffer.from(received), Buffer.from(expected));

    if (!valid) {
      throw new ForbiddenException('Acceso restringido');
    }

    return true;
  }
}
