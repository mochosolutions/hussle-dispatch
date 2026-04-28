import { ingestValidator } from '../validators/loadBoardValidators';

const validateBody = async (body: unknown): Promise<{ valid: boolean; error?: string }> => {
  try {
    await ingestValidator.validate({ body }, { abortEarly: true });
    return { valid: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { valid: false, error: message };
  }
};

const validDatLoad = {
  matchId: 'M-1',
  origin: { city: 'Atlanta', state: 'GA' },
  destination: { city: 'Dallas', state: 'TX' },
  equipmentTypeCode: 'V',
};

const validRelayLoad = {
  id: 'R-1',
  startLocation: { city: 'Seattle', state: 'WA' },
  endLocation: { city: 'Boise', state: 'ID' },
  loads: [{ weight: 1000 }],
};

describe('ingestValidator', () => {
  it('accepts a valid DAT payload', async () => {
    const result = await validateBody({ source: 'dat', loads: [validDatLoad] });
    expect(result.valid).toBe(true);
  });

  it('accepts a valid Relay payload', async () => {
    const result = await validateBody({ source: 'relay', loads: [validRelayLoad] });
    expect(result.valid).toBe(true);
  });

  it('rejects DAT load missing matchId', async () => {
    const { matchId, ...rest } = validDatLoad;
    void matchId;
    const result = await validateBody({ source: 'dat', loads: [rest] });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('matchId');
  });

  it('rejects DAT load missing origin.state', async () => {
    const result = await validateBody({
      source: 'dat',
      loads: [{ ...validDatLoad, origin: { city: 'Atlanta' } }],
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('state');
  });

  it('rejects DAT load missing destination.state', async () => {
    const result = await validateBody({
      source: 'dat',
      loads: [{ ...validDatLoad, destination: { city: 'Dallas' } }],
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('state');
  });

  it('rejects Relay load missing id', async () => {
    const { id, ...rest } = validRelayLoad;
    void id;
    const result = await validateBody({ source: 'relay', loads: [rest] });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('id');
  });

  it('rejects Relay load missing startLocation.state', async () => {
    const result = await validateBody({
      source: 'relay',
      loads: [{ ...validRelayLoad, startLocation: { city: 'Seattle' } }],
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('state');
  });

  it('rejects Relay record with empty loads array', async () => {
    const result = await validateBody({
      source: 'relay',
      loads: [{ ...validRelayLoad, loads: [] }],
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least one load');
  });

  it('accepts DAT load with extra unknown fields', async () => {
    const result = await validateBody({
      source: 'dat',
      loads: [{ ...validDatLoad, futureField: 'whatever', anotherOne: 42 }],
    });
    expect(result.valid).toBe(true);
  });

  it('rejects payload with invalid source', async () => {
    const result = await validateBody({ source: 'truckstop', loads: [] });
    expect(result.valid).toBe(false);
  });

  it('rejects payload with more than 100 loads', async () => {
    const loads = Array.from({ length: 101 }, () => validDatLoad);
    const result = await validateBody({ source: 'dat', loads });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('100');
  });
});
