import { RefreshToken } from '../refresh-token.entity';

export interface RefreshTokenRepository {
  save(token: RefreshToken): Promise<void>;
  findByHash(tokenHash: string): Promise<RefreshToken | null>;
  revokeFamily(familyId: string): Promise<void>;
}

export const RefreshTokenRepositorySymbol = Symbol('RefreshTokenRepository');
