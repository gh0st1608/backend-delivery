// src/infrastructure/adapters/auth.service.impl.ts
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { createHash, randomBytes, randomInt, randomUUID } from 'crypto';
import { AuthService } from '../../domain/services/auth.service';
import { User } from '../../domain/user.entity';
import { JWT_ALGORITHM, jwtConfig } from '../config/jwt.config';

@Injectable()
export class AuthServiceImpl implements AuthService {
  private readonly saltRounds = 10;

  // CSPRNG: el código de verificación no debe ser predecible
  generateVerificationCode(): string {
    return randomInt(1000, 10000).toString();
  }

  async comparePasswords(raw: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(raw, hashed);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  // Access token de vida corta. Solo lleva el identificador opaco (sub):
  // el payload de un JWT es legible, así que no se incluyen datos personales.
  generateAccessToken(user: User): string {
    const { privateKey, issuer, audience, accessTokenTtlSeconds } = jwtConfig();

    return jwt.sign({}, privateKey, {
      algorithm: JWT_ALGORITHM,
      subject: user.properties().userId,
      issuer,
      audience,
      expiresIn: accessTokenTtlSeconds,
      jwtid: randomUUID(),
    });
  }

  // 256 bits de entropía, opaco: no se puede validar ni decodificar sin el servidor
  generateRefreshToken(): string {
    return randomBytes(32).toString('base64url');
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
