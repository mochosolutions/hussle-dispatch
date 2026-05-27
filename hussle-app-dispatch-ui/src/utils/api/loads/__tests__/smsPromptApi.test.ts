import axiosInstance from 'utils/axios';
import { listSmsPrompts, sendSmsPrompt } from '../smsPromptApi';
import type { SmsPromptScheduleResponse } from '../smsPromptApi';

jest.mock('utils/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

const buildPrompt = (
  overrides: Partial<SmsPromptScheduleResponse> = {},
): SmsPromptScheduleResponse => ({
  id: 'p-1',
  loadId: 'load-1',
  driverId: 'driver-1',
  organizationId: 'org-1',
  anchor: 'MANUAL',
  scheduledAt: '2026-04-22T00:00:00.000Z',
  status: 'PENDING',
  sentAt: null,
  twilioMessageSid: null,
  failureReason: null,
  createdAt: '2026-04-22T00:00:00.000Z',
  updatedAt: '2026-04-22T00:00:00.000Z',
  ...overrides,
});

describe('smsPromptApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendSmsPrompt', () => {
    it('POSTs to the correct URL and unwraps data', async () => {
      const prompt = buildPrompt();
      mockedAxios.post.mockResolvedValue({ data: { data: prompt } });

      const result = await sendSmsPrompt('load-1');

      expect(mockedAxios.post).toHaveBeenCalledWith('/loads/load-1/sms-prompts');
      expect(result).toEqual(prompt);
    });
  });

  describe('listSmsPrompts', () => {
    it('GETs with params and returns data and meta', async () => {
      const prompts = [buildPrompt()];
      const meta = { page: 1, limit: 25, total: 1, totalPages: 1, hasMore: false };
      mockedAxios.get.mockResolvedValue({ data: { data: prompts, meta } });

      const result = await listSmsPrompts('load-1', { page: 1, limit: 25 });

      expect(mockedAxios.get).toHaveBeenCalledWith('/loads/load-1/sms-prompts', {
        params: { page: 1, limit: 25 },
      });
      expect(result).toEqual({ data: prompts, meta });
    });

    it('passes empty params by default', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { data: [], meta: { page: 1, limit: 25, total: 0, totalPages: 0, hasMore: false } },
      });

      await listSmsPrompts('load-1');

      expect(mockedAxios.get).toHaveBeenCalledWith('/loads/load-1/sms-prompts', { params: {} });
    });
  });
});
