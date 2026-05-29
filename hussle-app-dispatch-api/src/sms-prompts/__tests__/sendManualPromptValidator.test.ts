import { sendManualPromptValidator } from '../validators/smsPromptValidators';

const PARAMS = { loadId: '550e8400-e29b-41d4-a716-446655440000' };

describe('sendManualPromptValidator', () => {
  it('accepts request with no body field (default composed message)', async () => {
    await expect(
      sendManualPromptValidator.validate({ params: PARAMS, body: {}, query: {} }),
    ).resolves.toBeDefined();
  });

  it('accepts request with custom body up to 640 chars', async () => {
    await expect(
      sendManualPromptValidator.validate({
        params: PARAMS,
        body: { body: 'A'.repeat(640) },
        query: {},
      }),
    ).resolves.toBeDefined();
  });

  it('rejects body over 640 chars', async () => {
    await expect(
      sendManualPromptValidator.validate({
        params: PARAMS,
        body: { body: 'A'.repeat(641) },
        query: {},
      }),
    ).rejects.toThrow(/640/);
  });

  it('rejects empty string body', async () => {
    await expect(
      sendManualPromptValidator.validate({
        params: PARAMS,
        body: { body: '' },
        query: {},
      }),
    ).rejects.toThrow();
  });

  it('rejects whitespace-only body (trimmed to empty)', async () => {
    await expect(
      sendManualPromptValidator.validate({
        params: PARAMS,
        body: { body: '   \n  ' },
        query: {},
      }),
    ).rejects.toThrow();
  });
});
