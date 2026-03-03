import jwt from 'jsonwebtoken';

// JWT_SECRET is required — startup validation in localserver.ts ensures it is set.
const getJwtSecret = (): string => {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
};

export const signJwt = (payload: object): string =>
  jwt.sign(payload, getJwtSecret(), { expiresIn: '1h' });
