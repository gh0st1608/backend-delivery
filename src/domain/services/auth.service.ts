// src/domain/services/auth.service.ts
import { User } from '../../domain/user.entity';

export interface AuthService {
  generateVerificationCode(): string;
  hashPassword(password: string): Promise<string>;
  comparePasswords(raw: string, hashed: string): Promise<boolean>;
  generateAccessToken(user: User): string;
  // Refresh token opaco (no es un JWT) y su hash para persistirlo
  generateRefreshToken(): string;
  hashToken(token: string): string;
}

export const AuthServiceSymbol = Symbol('AuthService');
