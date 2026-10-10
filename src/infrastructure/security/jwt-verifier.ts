import * as jwt from 'jsonwebtoken';
import { AuthenticatedUser } from '../../domain/interfaces/security.interface';

// Las claves PEM se guardan en .env en una sola línea con "\n" escapados
const publicKey = () =>
  (process.env.JWT_PUBLIC_KEY ?? '').replace(/\n/g, '\n').trim();

/**
 * Valida un access token emitido por backend-auth (OWASP JWT Cheat Sheet):
 * firma RS256 con la clave pública, algoritmo fijado, issuer, audience y exp.
 * Lanza si el token no es válido.
 */
export const verifyAccessToken = (token: string): AuthenticatedUser => {
  const payload = jwt.verify(token, publicKey(), {
    algorithms: ['RS256'],
    issuer: process.env.JWT_ISSUER ?? 'foodstore-auth',
    audience: process.env.JWT_AUDIENCE ?? 'foodstore-api',
  }) as jwt.JwtPayload;

  if (!payload.sub) {
    throw new Error('Token sin subject');
  }

  return { userId: payload.sub };
};

export const extractBearerToken = (header?: string): string | null => {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
};
