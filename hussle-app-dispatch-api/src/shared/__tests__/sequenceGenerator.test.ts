import { SequenceError } from '../errors';

// ---------------------------------------------------------------------------
// Mock the Prisma singleton before importing the module under test
// ---------------------------------------------------------------------------

const mockExecuteRawUnsafe = jest.fn();
const mockQueryRawUnsafe = jest.fn();

jest.mock('../../config/database', () => ({
  prisma: {
    $executeRawUnsafe: (...args: unknown[]) => mockExecuteRawUnsafe(...args),
    $queryRawUnsafe: (...args: unknown[]) => mockQueryRawUnsafe(...args),
  },
}));

// Import after mock is set up
import { generateSequenceNumber } from '../sequenceGenerator';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeNextval = (n: bigint): [{ nextval: bigint }] => [{ nextval: n }];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generateSequenceNumber', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteRawUnsafe.mockResolvedValue(undefined);
  });

  it('returns a correctly formatted LOAD sequence number', async () => {
    mockQueryRawUnsafe.mockResolvedValue(makeNextval(1n));

    const result = await generateSequenceNumber('LOAD', 'org-123');
    const year = new Date().getFullYear();

    expect(result).toBe(`LD-${year}-000001`);
  });

  it('returns a correctly formatted INVOICE sequence number', async () => {
    mockQueryRawUnsafe.mockResolvedValue(makeNextval(42n));

    const result = await generateSequenceNumber('INVOICE', 'org-abc');
    const year = new Date().getFullYear();

    expect(result).toBe(`INV-${year}-000042`);
  });

  it('zero-pads the sequence number to 6 digits', async () => {
    mockQueryRawUnsafe.mockResolvedValue(makeNextval(7n));

    const result = await generateSequenceNumber('LOAD', 'org-x');

    expect(result).toMatch(/^LD-\d{4}-000007$/);
  });

  it('calls CREATE SEQUENCE IF NOT EXISTS before querying nextval', async () => {
    mockQueryRawUnsafe.mockResolvedValue(makeNextval(1n));

    await generateSequenceNumber('LOAD', 'org-123');

    const createCall = mockExecuteRawUnsafe.mock.calls[0] as string[];
    expect(createCall[0]).toContain('CREATE SEQUENCE IF NOT EXISTS');
    expect(createCall[0]).toContain('seq_load_org_123');
  });

  it('uses orgId-scoped sequence name — different orgs get different sequences', async () => {
    mockQueryRawUnsafe.mockResolvedValue(makeNextval(1n));

    await generateSequenceNumber('LOAD', 'org-aaa');
    await generateSequenceNumber('LOAD', 'org-bbb');

    const call1 = mockExecuteRawUnsafe.mock.calls[0] as string[];
    const call2 = mockExecuteRawUnsafe.mock.calls[1] as string[];
    expect(call1[0]).toContain('seq_load_org_aaa');
    expect(call2[0]).toContain('seq_load_org_bbb');
  });

  it('retries up to 3 times on error then throws SequenceError', async () => {
    mockQueryRawUnsafe.mockRejectedValue(new Error('DB connection error'));

    await expect(generateSequenceNumber('LOAD', 'org-fail')).rejects.toThrow(SequenceError);
    // 3 attempts × 1 executeRaw + 1 queryRaw each = 3 queryRaw calls
    expect(mockQueryRawUnsafe).toHaveBeenCalledTimes(3);
  });

  it('succeeds on a retry after an initial failure', async () => {
    mockQueryRawUnsafe
      .mockRejectedValueOnce(new Error('transient error'))
      .mockResolvedValue(makeNextval(5n));

    const result = await generateSequenceNumber('INVOICE', 'org-retry');
    const year = new Date().getFullYear();

    expect(result).toBe(`INV-${year}-000005`);
    expect(mockQueryRawUnsafe).toHaveBeenCalledTimes(2);
  });

  it('throws SequenceError with SEQUENCE_ERROR code after exhausting retries', async () => {
    mockQueryRawUnsafe.mockRejectedValue(new Error('persistent failure'));

    const error = await generateSequenceNumber('LOAD', 'org-fail').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(SequenceError);
    expect((error as SequenceError).code).toBe('SEQUENCE_ERROR');
    expect((error as SequenceError).statusCode).toBe(500);
  });

  it('formats large sequence numbers beyond 6 digits correctly', async () => {
    mockQueryRawUnsafe.mockResolvedValue(makeNextval(1234567n));

    const result = await generateSequenceNumber('LOAD', 'org-big');

    // Numbers beyond 6 digits should not be truncated
    expect(result).toMatch(/^LD-\d{4}-1234567$/);
  });
});
