import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from '../domain/interfaces/security.interface';
import { JWT_ALGORITHM, jwtConfig } from './config/jwt.config';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy,'access-token') {
  constructor() {
    const { publicKey, issuer, audience } = jwtConfig();

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: publicKey,
      // Se fija el algoritmo: nunca se confía en el "alg" que trae el token
      algorithms: [JWT_ALGORITHM],
      issuer,
      audience,
      ignoreExpiration: false,
    });
  }

  validate(payload: { sub: string }): AuthenticatedUser {
    return {
      userId: payload.sub,
    };
  }
}
