import { listExpensesValidator } from '../expenseValidators';

const VALID_UUID = '00000000-0000-4000-8000-000000000001';

describe('listExpensesValidator — vehicleId is optional', () => {
  it('passes when vehicleId is omitted (org-wide list)', async () => {
    const input = { query: { page: 1, limit: 25 } };

    const result = await listExpensesValidator.validate(input, { abortEarly: false });

    expect(result.query.vehicleId).toBeUndefined();
  });

  it('passes when vehicleId is a valid UUID (per-vehicle list)', async () => {
    const input = { query: { vehicleId: VALID_UUID, page: 1, limit: 25 } };

    const result = await listExpensesValidator.validate(input, { abortEarly: false });

    expect(result.query.vehicleId).toBe(VALID_UUID);
  });

  it('fails when vehicleId is provided but not a valid UUID', async () => {
    const input = { query: { vehicleId: 'not-a-uuid' } };

    await expect(
      listExpensesValidator.validate(input, { abortEarly: false }),
    ).rejects.toThrow(/vehicleId must be a valid uuid/);
  });
});
