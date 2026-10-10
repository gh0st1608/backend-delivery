// Configuración centralizada de tokens (OWASP JWT Cheat Sheet):
// - RS256: solo auth tiene la clave privada; el resto de servicios valida con la pública.
// - Algoritmo fijado al verificar (evita ataques "alg: none" / confusión HS/RS).
// - iss y aud obligatorios.

// Las claves PEM se guardan en .env en una sola línea con "\n" escapados
const normalizePem = (value?: string): string =>
  (value ?? '').replace(/\\n/g, '\n').trim();

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const JWT_ALGORITHM = 'RS256' as const;

export const jwtConfig = () => ({
  privateKey: normalizePem(process.env.JWT_PRIVATE_KEY),
  publicKey: normalizePem(process.env.JWT_PUBLIC_KEY),
  issuer: process.env.JWT_ISSUER ?? 'foodstore-auth',
  audience: process.env.JWT_AUDIENCE ?? 'foodstore-api',
  accessTokenTtlSeconds: toNumber(process.env.ACCESS_TOKEN_TTL_SECONDS, 900),
  refreshTokenTtlSeconds: toNumber(
    process.env.REFRESH_TOKEN_TTL_SECONDS,
    7 * 24 * 60 * 60,
  ),
  // Vida máxima de una sesión aunque se siga rotando el refresh token
  refreshFamilyMaxSeconds: toNumber(
    process.env.REFRESH_TOKEN_FAMILY_MAX_SECONDS,
    30 * 24 * 60 * 60,
  ),
});

export const refreshCookieConfig = () => ({
  name: 'fs_rt',
  path: '/auth',
  secure: process.env.REFRESH_COOKIE_SECURE !== 'false',
  sameSite: (process.env.REFRESH_COOKIE_SAMESITE ?? 'strict') as
    | 'strict'
    | 'lax'
    | 'none',
});
