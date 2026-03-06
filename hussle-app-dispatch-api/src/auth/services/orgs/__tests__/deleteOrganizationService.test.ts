import { BadRequestError } from '@mocho/common';
import { deleteOrganizationService } from '../deleteOrganizationService';

describe('deleteOrganizationService', () => {
  it('deletes organization when it exists', async () => {
    const findOrganizationById = jest.fn().mockResolvedValue({ id: 'org-1' });
    const deleteOrganization = jest.fn().mockResolvedValue({ id: 'org-1' });

    const result = await deleteOrganizationService(
      { organizationId: 'org-1' },
      { deleteOrganization, findOrganizationById },
    );

    expect(findOrganizationById).toHaveBeenCalledWith('org-1');
    expect(deleteOrganization).toHaveBeenCalledWith('org-1');
    expect(result?.id).toBe('org-1');
  });

  it('throws BadRequestError when organization does not exist', async () => {
    const findOrganizationById = jest.fn().mockResolvedValue(null);
    const deleteOrganization = jest.fn();

    await expect(
      deleteOrganizationService(
        { organizationId: 'org-1' },
        { deleteOrganization, findOrganizationById },
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
