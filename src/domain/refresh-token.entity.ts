// Refresh token opaco (OWASP):
// - Solo se persiste su hash SHA-256, nunca el valor.
// - Cada uso rota el token (se crea uno nuevo en la misma familia).
// - Si se presenta un token ya rotado o revocado se asume robo y se revoca
//   toda la familia (detección de reutilización).
export interface RefreshTokenProperties {
  tokenHash: string;
  familyId: string;
  userId: string;
  expiresAt: Date;
  familyExpiresAt: Date;
  createdAt: Date;
  revokedAt?: Date | null;
  replacedByHash?: string | null;
}

export class RefreshToken {
  private tokenHash: string;
  private familyId: string;
  private userId: string;
  private expiresAt: Date;
  private familyExpiresAt: Date;
  private createdAt: Date;
  private revokedAt: Date | null;
  private replacedByHash: string | null;

  constructor(properties: RefreshTokenProperties) {
    Object.assign(this, {
      revokedAt: null,
      replacedByHash: null,
      ...properties,
    });
  }

  static create(data: {
    tokenHash: string;
    familyId: string;
    userId: string;
    ttlSeconds: number;
    familyExpiresAt: Date;
  }): RefreshToken {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + data.ttlSeconds * 1000);

    return new RefreshToken({
      tokenHash: data.tokenHash,
      familyId: data.familyId,
      userId: data.userId,
      createdAt: now,
      // Nunca más allá de la vida máxima de la sesión
      expiresAt:
        expiresAt > data.familyExpiresAt ? data.familyExpiresAt : expiresAt,
      familyExpiresAt: data.familyExpiresAt,
    });
  }

  properties(): RefreshTokenProperties {
    return {
      tokenHash: this.tokenHash,
      familyId: this.familyId,
      userId: this.userId,
      expiresAt: this.expiresAt,
      familyExpiresAt: this.familyExpiresAt,
      createdAt: this.createdAt,
      revokedAt: this.revokedAt,
      replacedByHash: this.replacedByHash,
    };
  }

  isExpired(now = new Date()): boolean {
    return this.expiresAt <= now || this.familyExpiresAt <= now;
  }

  // Ya usado (rotado) o revocado: volver a presentarlo es una reutilización
  isConsumed(): boolean {
    return !!this.revokedAt || !!this.replacedByHash;
  }

  rotate(newTokenHash: string): void {
    this.replacedByHash = newTokenHash;
    this.revokedAt = new Date();
  }

  toPrimitives() {
    return {
      tokenHash: this.tokenHash,
      familyId: this.familyId,
      userId: this.userId,
      expiresAt: this.expiresAt.toISOString(),
      familyExpiresAt: this.familyExpiresAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
      revokedAt: this.revokedAt?.toISOString() ?? null,
      replacedByHash: this.replacedByHash,
      // TTL de DynamoDB: el registro se borra solo cuando ya no sirve
      ttl: Math.floor(this.familyExpiresAt.getTime() / 1000) + 24 * 60 * 60,
    };
  }

  static fromPrimitives(raw: Record<string, any>): RefreshToken {
    return new RefreshToken({
      tokenHash: raw.tokenHash,
      familyId: raw.familyId,
      userId: raw.userId,
      expiresAt: new Date(raw.expiresAt),
      familyExpiresAt: new Date(raw.familyExpiresAt),
      createdAt: new Date(raw.createdAt),
      revokedAt: raw.revokedAt ? new Date(raw.revokedAt) : null,
      replacedByHash: raw.replacedByHash ?? null,
    });
  }
}
