import { BadRequestError } from '@mocho/common';
import { getInviteByIdService } from '../getInviteByIdService';

describe('getInviteByIdService', () => {
  it('returns invite when repository finds record', async () => {
    const findInviteById = jest.fn().mockResolvedValue({ id: 'invite-1' });

    const result = await getInviteByIdService('invite-1', { findInviteById });

    expect(findInviteById).toHaveBeenCalledWith('invite-1');
    expect(result?.id).toBe('invite-1');
  });

  it('throws BadRequestError when repository fails', async () => {
    const findInviteById = jest.fn().mockRejectedValue(new Error('db failed'));

    await expect(getInviteByIdService('invite-1', { findInviteById })).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });
});
