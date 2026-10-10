// CORS por allowlist (OWASP): solo los orígenes web configurados en
// CORS_ORIGINS (separados por coma). Las apps nativas no envían Origin,
// así que no se ven afectadas.
export const corsConfig = (options: { credentials?: boolean } = {}) => {
  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    origin: origins.length > 0 ? origins : false,
    credentials: options.credentials ?? false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Type'],
  };
};
