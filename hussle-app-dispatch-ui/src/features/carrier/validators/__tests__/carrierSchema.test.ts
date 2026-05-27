import { carrierEditSchema } from '../carrierSchema';

describe('carrierEditSchema', () => {
  const base = {
    name: 'Acme Trucking',
    phone: '5551234567',
  };

  it('rejects EXTERNAL_CARRIER with resolved fee of 0 (PERCENTAGE)', async () => {
    const isValid = await carrierEditSchema.isValid({
      ...base,
      type: 'EXTERNAL_CARRIER',
      dispatchFeeType: 'PERCENTAGE',
      companyMarginPercent: 0,
      dispatchFeeAmount: 0,
    });
    expect(isValid).toBe(false);
  });

  it('rejects EXTERNAL_CARRIER with resolved fee of 0 (FLAT)', async () => {
    const isValid = await carrierEditSchema.isValid({
      ...base,
      type: 'EXTERNAL_CARRIER',
      dispatchFeeType: 'FLAT',
      companyMarginPercent: 0,
      dispatchFeeAmount: 0,
    });
    expect(isValid).toBe(false);
  });

  it('accepts EXTERNAL_CARRIER with percent > 0', async () => {
    const isValid = await carrierEditSchema.isValid({
      ...base,
      type: 'EXTERNAL_CARRIER',
      dispatchFeeType: 'PERCENTAGE',
      companyMarginPercent: 10,
      dispatchFeeAmount: 0,
    });
    expect(isValid).toBe(true);
  });

  it('accepts EXTERNAL_CARRIER with flat amount > 0', async () => {
    const isValid = await carrierEditSchema.isValid({
      ...base,
      type: 'EXTERNAL_CARRIER',
      dispatchFeeType: 'FLAT',
      companyMarginPercent: 0,
      dispatchFeeAmount: 150,
    });
    expect(isValid).toBe(true);
  });

  it('accepts COMPANY_ASSET with fee of 0', async () => {
    const isValid = await carrierEditSchema.isValid({
      ...base,
      type: 'COMPANY_ASSET',
      dispatchFeeType: 'PERCENTAGE',
      companyMarginPercent: 0,
      dispatchFeeAmount: 0,
    });
    expect(isValid).toBe(true);
  });

  it('accepts LEASED_CARRIER with fee of 0', async () => {
    const isValid = await carrierEditSchema.isValid({
      ...base,
      type: 'LEASED_CARRIER',
      dispatchFeeType: 'PERCENTAGE',
      companyMarginPercent: 0,
      dispatchFeeAmount: 0,
    });
    expect(isValid).toBe(true);
  });

  it('emits inline error on the percentage field when external and percent = 0', async () => {
    await expect(
      carrierEditSchema.validate(
        {
          ...base,
          type: 'EXTERNAL_CARRIER',
          dispatchFeeType: 'PERCENTAGE',
          companyMarginPercent: 0,
        },
        { abortEarly: true },
      ),
    ).rejects.toMatchObject({ path: 'companyMarginPercent' });
  });

  it('emits inline error on the flat amount field when external and amount = 0', async () => {
    await expect(
      carrierEditSchema.validate(
        {
          ...base,
          type: 'EXTERNAL_CARRIER',
          dispatchFeeType: 'FLAT',
          dispatchFeeAmount: 0,
        },
        { abortEarly: true },
      ),
    ).rejects.toMatchObject({ path: 'dispatchFeeAmount' });
  });
});
