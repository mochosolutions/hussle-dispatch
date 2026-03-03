export const REFRESH_TTL_SECONDS = 24 * 60 * 60; // 1 day in seconds

export const getJwtSecret = (): string => {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
};

export const JWT_EXPIRES_IN = '1h';
