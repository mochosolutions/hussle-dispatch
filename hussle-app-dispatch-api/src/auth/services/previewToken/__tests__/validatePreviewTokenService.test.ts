import jwt from 'jsonwebtoken';
import { validatePreviewTokenService } from '../validatePreviewTokenService';

describe('validatePreviewTokenService', () => {
  it('returns null for invalid token', () => {
    const result = validatePreviewTokenService('bad.token.value', { jwtSecret: 'test-secret' });

    expect(result).toBeNull();
  });

  it('returns null when token payload purpose is not preview', () => {
    const token = jwt.sign(
      {
        userId: 'user-1',
        organizationId: 'org-1',
        purpose: 'auth',
      },
      'test-secret',
    );

    const result = validatePreviewTokenService(token, { jwtSecret: 'test-secret' });

    expect(result).toBeNull();
  });
});
