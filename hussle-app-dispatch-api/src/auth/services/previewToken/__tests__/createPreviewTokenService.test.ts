import { createPreviewTokenService } from '../createPreviewTokenService';
import { validatePreviewTokenService } from '../validatePreviewTokenService';

describe('createPreviewTokenService', () => {
  it('creates a signed token that validates to same payload fields', () => {
    const token = createPreviewTokenService(
      {
        userId: 'user-1',
        organizationId: 'org-1',
      },
      { jwtSecret: 'test-secret' },
    );

    const decoded = validatePreviewTokenService(token, { jwtSecret: 'test-secret' });

    expect(typeof token).toBe('string');
    expect(decoded).toEqual({ userId: 'user-1', organizationId: 'org-1' });
  });
});
