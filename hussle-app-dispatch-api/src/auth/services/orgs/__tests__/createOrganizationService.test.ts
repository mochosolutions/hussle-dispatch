import { BadRequestError } from '@mocho/common';
import { createOrganizationService } from '../createOrganizationService';

describe('createOrganizationService', () => {
  it('creates organization', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'org-1', name: 'Acme' });

    const result = await createOrganizationService(
      {
        name: 'Acme',
        slug: 'acme',
        email: 'org@example.com',
        role: 'broker',
        vertical: 'staffing',
      },
      { create },
    );

    expect(create).toHaveBeenCalled();
    expect(result?.id).toBe('org-1');
  });

  it('throws BadRequestError when create fails', async () => {
    const create = jest.fn().mockRejectedValue(new Error('database write failed'));

    await expect(
      createOrganizationService(
        {
          name: 'Acme',
          slug: 'acme',
          email: 'org@example.com',
          role: 'broker',
          vertical: 'staffing',
        },
        { create },
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
