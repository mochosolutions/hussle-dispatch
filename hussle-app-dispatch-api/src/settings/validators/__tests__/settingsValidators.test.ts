import { updateSettingsSchema } from '../settingsValidators';

const validate = async (body: Record<string, unknown>): Promise<{ ok: boolean; message?: string }> => {
  try {
    await updateSettingsSchema.validate(
      { body, query: {}, params: {} },
      { abortEarly: false, stripUnknown: true },
    );
    return { ok: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { ok: false, message: error.message };
    }
    return { ok: false };
  }
};

describe('updateSettingsSchema — headquarters fields', () => {
  it('passes when both headquarters values are null', async () => {
    const result = await validate({
      headquartersLatitude: null,
      headquartersLongitude: null,
    });
    expect(result.ok).toBe(true);
  });

  it('passes when both headquarters values are numbers', async () => {
    const result = await validate({
      headquartersLatitude: 32.776665,
      headquartersLongitude: -96.796989,
    });
    expect(result.ok).toBe(true);
  });

  it('fails with hq-pair message when only headquartersLatitude is provided', async () => {
    const result = await validate({ headquartersLatitude: 32.5 });
    expect(result.ok).toBe(false);
    expect(result.message).toContain('must be set together or both null');
  });

  it('fails with hq-pair message when one is null and the other is a number', async () => {
    const result = await validate({
      headquartersLatitude: null,
      headquartersLongitude: -96.5,
    });
    expect(result.ok).toBe(false);
    expect(result.message).toContain('must be set together or both null');
  });

  it('fails when headquartersLatitude is below -90', async () => {
    const result = await validate({
      headquartersLatitude: -91,
      headquartersLongitude: 0,
    });
    expect(result.ok).toBe(false);
    expect(result.message).toContain('headquartersLatitude');
  });

  it('fails when headquartersLongitude is above 180', async () => {
    const result = await validate({
      headquartersLatitude: 0,
      headquartersLongitude: 181,
    });
    expect(result.ok).toBe(false);
    expect(result.message).toContain('headquartersLongitude');
  });
});
