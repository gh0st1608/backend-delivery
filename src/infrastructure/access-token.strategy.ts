import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy,'access-token') {
  constructor(private readonly config: ConfigService) {
/*     console.log('🟢 AccessTokenStrategy constructor');
    const secret = config.get('JWT_SECRET'); */

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: any) {
    console.log('VALIDATED PAYLOAD', payload);
    return {
      userId: payload.sub,
      name: payload.name,
    };
  }
}
