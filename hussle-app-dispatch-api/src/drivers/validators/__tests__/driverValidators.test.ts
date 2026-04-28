import { createDriverValidator, updateDriverValidator } from '../driverValidators';

const VALID_UUID = '00000000-0000-4000-8000-000000000001';
const ANOTHER_UUID = '00000000-0000-4000-8000-000000000002';

const buildUpdateInput = (body: Record<string, unknown>) => ({
  body,
  params: { id: VALID_UUID },
});

const buildCreateInput = (overrides: Record<string, unknown> = {}) => ({
  body: {
    carrierId: ANOTHER_UUID,
    firstName: 'Ada',
    lastName: 'Lovelace',
    payType: 'PERCENTAGE',
    payRate: 30,
    ...overrides,
  },
});

describe('createDriverValidator payType/payRate', () => {
  it('passes when payType and payRate are both valid', async () => {
    const input = buildCreateInput({ payType: 'PER_MILE', payRate: 0.55 });

    const result = await createDriverValidator.validate(input, { abortEarly: false });

    expect(result.body.payType).toBe('PER_MILE');
    expect(result.body.payRate).toBe(0.55);
  });

  it.each(['PERCENTAGE', 'PER_MILE', 'PER_HOUR', 'FLAT_RATE'] as const)(
    'passes for payType %s with a valid payRate',
    async (payType) => {
      const input = buildCreateInput({ payType, payRate: 10 });

      const result = await createDriverValidator.validate(input, { abortEarly: false });

      expect(result.body.payType).toBe(payType);
      expect(result.body.payRate).toBe(10);
    },
  );

  it('rejects when payType is missing', async () => {
    const { payType: _omit, ...rest } = buildCreateInput().body;
    const input = { body: rest };

    await expect(
      createDriverValidator.validate(input, { abortEarly: false }),
    ).rejects.toThrow(/payType/);
  });

  it('rejects when payRate is missing', async () => {
    const { payRate: _omit, ...rest } = buildCreateInput().body;
    const input = { body: rest };

    await expect(
      createDriverValidator.validate(input, { abortEarly: false }),
    ).rejects.toThrow(/payRate/);
  });

  it('rejects an invalid payType value', async () => {
    const input = buildCreateInput({ payType: 'INVALID' });

    await expect(
      createDriverValidator.validate(input, { abortEarly: false }),
    ).rejects.toThrow();
  });

  it('rejects a negative payRate', async () => {
    const input = buildCreateInput({ payRate: -1 });

    await expect(
      createDriverValidator.validate(input, { abortEarly: false }),
    ).rejects.toThrow();
  });
});

describe('updateDriverValidator payType/payRate', () => {
  it('passes when payType and payRate are both valid', async () => {
    const input = buildUpdateInput({ payType: 'PER_MILE', payRate: 0.55 });

    const result = await updateDriverValidator.validate(input, { abortEarly: false });

    expect(result.body.payType).toBe('PER_MILE');
    expect(result.body.payRate).toBe(0.55);
  });

  it.each(['PERCENTAGE', 'PER_MILE', 'PER_HOUR', 'FLAT_RATE'] as const)(
    'passes for payType %s with a valid payRate',
    async (payType) => {
      const input = buildUpdateInput({ payType, payRate: 10 });

      const result = await updateDriverValidator.validate(input, { abortEarly: false });

      expect(result.body.payType).toBe(payType);
      expect(result.body.payRate).toBe(10);
    },
  );

  it('rejects an invalid payType value', async () => {
    const input = buildUpdateInput({ payType: 'INVALID' });

    await expect(
      updateDriverValidator.validate(input, { abortEarly: false }),
    ).rejects.toThrow();
  });

  it('passes a partial update without payType or payRate', async () => {
    const input = buildUpdateInput({ notes: 'test' });

    const result = await updateDriverValidator.validate(input, { abortEarly: false });

    expect(result.body.notes).toBe('test');
    expect(result.body.payType).toBeUndefined();
    expect(result.body.payRate).toBeUndefined();
  });
});
