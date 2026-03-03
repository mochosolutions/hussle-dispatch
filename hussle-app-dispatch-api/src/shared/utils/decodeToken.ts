import type { JwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';

/**
 * Decodes a JWT token and returns the payload.
 *
 * @param token - The JWT token to decode.
 * @returns The decoded token payload as a JwtPayload object, or null if decoding fails.
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    // Decode the token without verifying its signature.
    // This is useful for extracting claims, but note that this does not guarantee the token is valid.
    const decoded = jwt.decode(token, { complete: false });

    // Ensure the decoded value is an object (JwtPayload) and not a string.
    if (decoded && typeof decoded === 'object') {
      return decoded;
    }
    return null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}
