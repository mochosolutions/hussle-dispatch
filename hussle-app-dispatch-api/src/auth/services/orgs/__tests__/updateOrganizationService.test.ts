import { BadRequestError } from '@mocho/common';
import { updateOrganizationService } from '../updateOrganizationService';

describe('updateOrganizationService', () => {
  it('updates organization when it exists', async () => {
    const findOrganizationById = jest.fn().mockResolvedValue({ id: 'org-1' });
    const updateOrganization = jest.fn().mockResolvedValue({ id: 'org-1', name: 'Updated Org' });

    const result = await updateOrganizationService(
      { id: 'org-1', name: 'Updated Org' },
      { updateOrganization, findOrganizationById },
    );

    expect(findOrganizationById).toHaveBeenCalledWith('org-1');
    expect(updateOrganization).toHaveBeenCalledWith('org-1', { name: 'Updated Org' });
    expect(result?.name).toBe('Updated Org');
  });

  it('throws BadRequestError when organization does not exist', async () => {
    const findOrganizationById = jest.fn().mockResolvedValue(null);
    const updateOrganization = jest.fn();

    await expect(
      updateOrganizationService(
        { id: 'org-1', name: 'Updated Org' },
        { updateOrganization, findOrganizationById },
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
