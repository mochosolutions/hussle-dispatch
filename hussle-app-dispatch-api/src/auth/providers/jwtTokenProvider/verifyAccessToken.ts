import jwt from 'jsonwebtoken';

// JWT_SECRET is required — startup validation in localserver.ts ensures it is set.
// We read it at call time so tests can set process.env.JWT_SECRET before import.
const getJwtSecret = (): string => {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
};

const isDecodedPayload = (
  value: unknown
): value is { userId: string; tokenId: string } =>
  typeof value === 'object' && value !== null && 'userId' in value && 'tokenId' in value;

export const verifyAccessToken = async (token: string): Promise<{ userId: string; tokenId: string } | null> => {
  try {
    const decoded: unknown = jwt.verify(token, getJwtSecret());
    if (!isDecodedPayload(decoded)) {
      return null;
    }
    const { userId, tokenId } = decoded;
    return { userId, tokenId };
  } catch {
    return null;
  }
};
