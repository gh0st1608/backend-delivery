// src/domain/services/auth.service.ts

import { User } from '../../domain/user.entity';

export interface AuthService {
  hashPassword(password : string) : Promise<string>;
  comparePasswords(raw: string, hashed: string): Promise<boolean>;
  generateAccessToken(user: User): string;
  generateRefreshToken(user: User): string;
}

export const AuthServiceSymbol = Symbol(
  'AuthService',
);

