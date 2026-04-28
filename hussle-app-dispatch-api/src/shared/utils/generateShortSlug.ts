import { randomBytes } from 'crypto';

const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const SLUG_LENGTH = 8;
const ALPHABET_SIZE = ALPHABET.length;

// Rejection sampling: discard byte values >= floor(256 / 62) * 62 (= 248)
// to avoid modulo bias across the 62-character alphabet.
const MAX_UNBIASED_BYTE = Math.floor(256 / ALPHABET_SIZE) * ALPHABET_SIZE;

export const generateShortSlug = (): string => {
  const result: string[] = [];

  while (result.length < SLUG_LENGTH) {
    const buffer = randomBytes(SLUG_LENGTH * 2);
    for (let i = 0; i < buffer.length && result.length < SLUG_LENGTH; i += 1) {
      const byte = buffer[i];
      if (byte === undefined || byte >= MAX_UNBIASED_BYTE) {
        continue;
      }
      result.push(ALPHABET[byte % ALPHABET_SIZE] ?? '');
    }
  }

  return result.join('');
};
