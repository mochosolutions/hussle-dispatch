import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { expenseRepositoryPrisma } from '../expenseRepositoryPrisma';
import type { ListExpensesInput } from '../../types/expenseTypes';

type MockFn = jest.Mock<(...args: never[]) => Promise<unknown>>;

const mockPrisma = {
  expense: {
    findMany: jest.fn() as MockFn,
    count: jest.fn() as MockFn,
  },
};

const repo = expenseRepositoryPrisma(
  mockPrisma as unknown as Parameters<typeof expenseRepositoryPrisma>[0],
);

const baseInput: ListExpensesInput = {
  organizationId: 'org-1',
  page: 1,
  limit: 25,
  sort: 'date',
  order: 'desc',
};

describe('expenseRepositoryPrisma.findMany — where clause', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.expense.findMany.mockResolvedValue([]);
    mockPrisma.expense.count.mockResolvedValue(0);
  });

  it('omits vehicleId from where clause when input.vehicleId is undefined (org-wide list)', async () => {
    await repo.findMany({ ...baseInput });

    const findManyCall = mockPrisma.expense.findMany.mock.calls[0]?.[0] as
      | { where: Record<string, unknown> }
      | undefined;
    if (!findManyCall) {
      throw new Error('expected findMany to be called');
    }
    expect(findManyCall.where).not.toHaveProperty('vehicleId');
    expect(findManyCall.where).toEqual({
      organizationId: 'org-1',
      deletedAt: null,
    });
  });

  it('includes vehicleId in where clause when provided (per-vehicle list)', async () => {
    await repo.findMany({ ...baseInput, vehicleId: 'veh-1' });

    const findManyCall = mockPrisma.expense.findMany.mock.calls[0]?.[0] as
      | { where: Record<string, unknown> }
      | undefined;
    if (!findManyCall) {
      throw new Error('expected findMany to be called');
    }
    expect(findManyCall.where).toMatchObject({
      organizationId: 'org-1',
      vehicleId: 'veh-1',
      deletedAt: null,
    });
  });
});

describe('expenseRepositoryPrisma.count — where clause', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.expense.count.mockResolvedValue(0);
  });

  it('omits vehicleId from where clause when input.vehicleId is undefined', async () => {
    await repo.count({ organizationId: 'org-1' });

    const countCall = mockPrisma.expense.count.mock.calls[0]?.[0] as
      | { where: Record<string, unknown> }
      | undefined;
    if (!countCall) {
      throw new Error('expected count to be called');
    }
    expect(countCall.where).not.toHaveProperty('vehicleId');
  });

  it('includes vehicleId in where clause when provided', async () => {
    await repo.count({ organizationId: 'org-1', vehicleId: 'veh-1' });

    const countCall = mockPrisma.expense.count.mock.calls[0]?.[0] as
      | { where: Record<string, unknown> }
      | undefined;
    if (!countCall) {
      throw new Error('expected count to be called');
    }
    expect(countCall.where).toMatchObject({
      organizationId: 'org-1',
      vehicleId: 'veh-1',
    });
  });
});
