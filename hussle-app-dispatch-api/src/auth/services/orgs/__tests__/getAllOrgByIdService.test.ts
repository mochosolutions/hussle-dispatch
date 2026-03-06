import { BadRequestError } from '@mocho/common';
import { getAllOrgByIdService } from '../getAllOrgByIdService';

describe('getAllOrgByIdService', () => {
  it('returns organization when found', async () => {
    const findById = jest.fn().mockResolvedValue({ id: 'org-1' });

    const result = await getAllOrgByIdService({ id: 'org-1' }, { findById });

    expect(findById).toHaveBeenCalledWith('org-1');
    expect(result?.id).toBe('org-1');
  });

  it('throws BadRequestError when organization not found', async () => {
    const findById = jest.fn().mockResolvedValue(null);

    await expect(getAllOrgByIdService({ id: 'missing-org' }, { findById })).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });
});
