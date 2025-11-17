// src/infrastructure/adapters/auth.service.impl.ts

import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { AuthService } from '../../domain/services/auth.service';
import { User } from '../../domain/user.entity';

@Injectable()
export class AuthServiceImpl implements AuthService {
  private readonly saltRounds = 10;
  async comparePasswords(raw: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(raw, hashed);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  generateAccessToken(user: User): string {
    return jwt.sign(
      {
        sub: user.properties().id,
        name: user.properties().name,
        /* roles: user.getRoles(), */
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  generateRefreshToken(user: User): string {
    return jwt.sign(
      { sub: user.properties().id, },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }
}
