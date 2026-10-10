import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { extractBearerToken, verifyAccessToken } from './jwt-verifier';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Token de acceso requerido');
    }

    try {
      // La identidad sale del token validado, nunca de parámetros del cliente
      request.user = verifyAccessToken(token);
      return true;
    } catch {
      // Mensaje genérico: no se detalla por qué falló la validación
      throw new UnauthorizedException('Token de acceso inválido o expirado');
    }
  }
}
