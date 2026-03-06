import { BadRequestError } from '@mocho/common';
import { getInvitesService } from '../getInvitesService';

describe('getInvitesService', () => {
  it('returns invites for organization', async () => {
    const findAllInvites = jest.fn().mockResolvedValue([{ id: 'invite-1' }]);

    const result = await getInvitesService('org-1', { findAllInvites });

    expect(findAllInvites).toHaveBeenCalledWith({ organizationId: 'org-1' });
    expect(result).toHaveLength(1);
  });

  it('throws BadRequestError when repository fails', async () => {
    const findAllInvites = jest.fn().mockRejectedValue(new Error('db failed'));

    await expect(getInvitesService('org-1', { findAllInvites })).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });
});
