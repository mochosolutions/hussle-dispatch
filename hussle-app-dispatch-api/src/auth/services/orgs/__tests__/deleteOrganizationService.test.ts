import { BadRequestError } from '@mocho/common';
import { deleteOrganizationService } from '../deleteOrganizationService';

describe('deleteOrganizationService', () => {
  it('deletes organization and cascades carrier invite token revocation when it exists', async () => {
    const findOrganizationById = jest.fn().mockResolvedValue({ id: 'org-1' });
    const deleteOrganization = jest.fn().mockResolvedValue({ id: 'org-1' });
    const revokeCarrierInviteTokensForOrg = jest.fn().mockResolvedValue(undefined);

    const result = await deleteOrganizationService(
      { organizationId: 'org-1' },
      { deleteOrganization, findOrganizationById, revokeCarrierInviteTokensForOrg },
    );

    expect(findOrganizationById).toHaveBeenCalledWith('org-1');
    expect(deleteOrganization).toHaveBeenCalledWith('org-1');
    expect(revokeCarrierInviteTokensForOrg).toHaveBeenCalledWith('org-1');
    expect(result?.id).toBe('org-1');
  });

  it('throws BadRequestError when organization does not exist', async () => {
    const findOrganizationById = jest.fn().mockResolvedValue(null);
    const deleteOrganization = jest.fn();
    const revokeCarrierInviteTokensForOrg = jest.fn();

    await expect(
      deleteOrganizationService(
        { organizationId: 'org-1' },
        { deleteOrganization, findOrganizationById, revokeCarrierInviteTokensForOrg },
      ),
    ).rejects.toBeInstanceOf(BadRequestError);

    expect(revokeCarrierInviteTokensForOrg).not.toHaveBeenCalled();
  });
});
