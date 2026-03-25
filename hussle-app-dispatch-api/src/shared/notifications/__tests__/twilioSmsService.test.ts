import { createTwilioSmsService } from '../twilioSmsService';

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const twilioConfig = {
  accountSid: 'AC1234567890abcdef1234567890abcdef',
  authToken: 'test-auth-token',
  fromNumber: '+15551234567',
};

describe('createTwilioSmsService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sends SMS via Twilio REST API when response is ok', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ sid: 'SM1234' }),
    };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const smsService = createTwilioSmsService(twilioConfig, mockLogger);

    await smsService.sendSms({ to: '+15559876543', body: 'Test message' });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain(twilioConfig.accountSid);
    expect(url).toContain('Messages.json');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toMatch(/^Basic /);
    expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(options.body).toContain('To=%2B15559876543');
    expect(options.body).toContain(`From=%2B${twilioConfig.fromNumber.slice(1)}`);
    expect(options.body).toContain('Body=Test+message');
    expect(mockLogger.info).toHaveBeenCalledWith('Twilio SMS sent', expect.objectContaining({
      to: '+15559876543',
      sid: 'SM1234',
    }));
  });

  it('throws and logs error when Twilio API returns non-ok response', async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      text: jest.fn().mockResolvedValue('{"message":"Invalid phone number"}'),
    };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const smsService = createTwilioSmsService(twilioConfig, mockLogger);

    await expect(
      smsService.sendSms({ to: 'invalid', body: 'Test' }),
    ).rejects.toThrow('Twilio SMS failed: 400');

    expect(mockLogger.error).toHaveBeenCalledWith('Twilio SMS delivery failed', expect.objectContaining({
      to: 'invalid',
      status: 400,
    }));
  });

  it('encodes Basic auth header from accountSid and authToken', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ sid: 'SM5678' }),
    };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const smsService = createTwilioSmsService(twilioConfig, mockLogger);
    await smsService.sendSms({ to: '+15559876543', body: 'Hi' });

    const expectedAuth = Buffer.from(
      `${twilioConfig.accountSid}:${twilioConfig.authToken}`,
    ).toString('base64');

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.headers.Authorization).toBe(`Basic ${expectedAuth}`);
  });
});
