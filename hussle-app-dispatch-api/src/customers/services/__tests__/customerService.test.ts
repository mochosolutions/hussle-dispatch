import { CustomerStatus, CustomerType, NotificationChannel, NotificationTrigger } from '@prisma/client';
import { ConflictError, NotFoundError } from '@/shared/errors';
import { createCustomerService } from '../customerService';
import type { CustomerRepositoryPort, CustomerWithCounts } from '../../types/customerTypes';

const ORG_ID = 'd73084dd-d6e7-4b79-af2b-63d17b4f4349';
const CUSTOMER_ID = '4b8f0dc8-6bb8-4d7f-b1ca-611e7f04f238';

const buildCustomer = (overrides: Partial<CustomerWithCounts> = {}): CustomerWithCounts => ({
  id: CUSTOMER_ID,
  organizationId: ORG_ID,
  type: CustomerType.BROKER,
  companyName: 'Acme Logistics',
  mcNumber: 'MC123456',
  dotNumber: 'DOT123456',
  phone: '555-111-2222',
  email: 'ops@acme.test',
  website: null,
  address: '101 Main St',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  paymentTerms: 'NET_30',
  paymentTermsDays: 30,
  quickPayDiscount: null,
  carrierPacketSentAt: null,
  notes: null,
  status: CustomerStatus.ACTIVE,
  deleted: false,
  deletedAt: null,
  createdAt: new Date('2026-03-01T00:00:00.000Z'),
  updatedAt: new Date('2026-03-01T00:00:00.000Z'),
  _count: {
    loads: 5,
    contacts: 2,
    places: 3,
  },
  ...overrides,
});

const buildMockRepository = (): {
  [K in keyof CustomerRepositoryPort]: jest.Mock;
} => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByIdWithDetails: jest.fn(),
  list: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  countByOrganization: jest.fn(),
  createNotificationSettings: jest.fn(),
});

describe('customerService', () => {
  const mockRepository = buildMockRepository();

  const customerService = createCustomerService({
    customerRepository: mockRepository,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCustomer', () => {
    it('creates customer when input is valid and companyName is unique', async () => {
      const customer = buildCustomer();
      mockRepository.list.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue(customer);

      const result = await customerService.createCustomer({
        organizationId: ORG_ID,
        role: 'admin',
        input: {
          type: CustomerType.BROKER,
          companyName: 'Acme Logistics',
        },
      });

      expect(mockRepository.create).toHaveBeenCalledWith(ORG_ID, {
        type: CustomerType.BROKER,
        companyName: 'Acme Logistics',
      });
      expect(result.id).toBe(CUSTOMER_ID);
      expect(result.companyName).toBe('Acme Logistics');
    });

    it('throws ConflictError when companyName already exists in organization', async () => {
      mockRepository.list.mockResolvedValue([buildCustomer()]);

      await expect(
        customerService.createCustomer({
          organizationId: ORG_ID,
          role: 'admin',
          input: {
            type: CustomerType.BROKER,
            companyName: 'Acme Logistics',
          },
        }),
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it('inserts default EMAIL notification settings for STATUS_CHANGE, CHECK_CALL, DOCUMENT_UPLOADED', async () => {
      const customer = buildCustomer();
      mockRepository.list.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue(customer);
      mockRepository.createNotificationSettings.mockResolvedValue(undefined);

      await customerService.createCustomer({
        organizationId: ORG_ID,
        role: 'admin',
        input: {
          type: CustomerType.BROKER,
          companyName: 'Acme Logistics',
        },
      });

      expect(mockRepository.createNotificationSettings).toHaveBeenCalledWith(CUSTOMER_ID, [
        {
          trigger: NotificationTrigger.STATUS_CHANGE,
          channel: NotificationChannel.EMAIL,
          enabled: true,
        },
        {
          trigger: NotificationTrigger.CHECK_CALL,
          channel: NotificationChannel.EMAIL,
          enabled: true,
        },
        {
          trigger: NotificationTrigger.DOCUMENT_UPLOADED,
          channel: NotificationChannel.EMAIL,
          enabled: true,
        },
      ]);
    });

    it('throws ConflictError for case-insensitive duplicate companyName', async () => {
      mockRepository.list.mockResolvedValue([buildCustomer()]);

      await expect(
        customerService.createCustomer({
          organizationId: ORG_ID,
          role: 'admin',
          input: {
            type: CustomerType.BROKER,
            companyName: 'acme logistics',
          },
        }),
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe('getCustomerById', () => {
    it('returns customer with loads and contacts when found', async () => {
      const customer = { ...buildCustomer(), loads: [], contacts: [] };
      mockRepository.findByIdWithDetails.mockResolvedValue(customer);

      const result = await customerService.getCustomerById({
        id: CUSTOMER_ID,
        organizationId: ORG_ID,
        role: 'admin',
      });

      expect(result.id).toBe(CUSTOMER_ID);
      expect(result._count.loads).toBe(5);
      expect(result.loads).toEqual([]);
      expect(result.contacts).toEqual([]);
      expect(mockRepository.findByIdWithDetails).toHaveBeenCalledWith(CUSTOMER_ID, ORG_ID);
    });

    it('throws NotFoundError when customer does not exist', async () => {
      mockRepository.findByIdWithDetails.mockResolvedValue(null);

      await expect(
        customerService.getCustomerById({
          id: 'nonexistent-id',
          organizationId: ORG_ID,
          role: 'admin',
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('listCustomers', () => {
    it('returns paginated results', async () => {
      const customers = [buildCustomer(), buildCustomer({ id: 'second-id' })];
      mockRepository.list.mockResolvedValue(customers);
      mockRepository.count.mockResolvedValue(2);

      const result = await customerService.listCustomers({
        query: {},
        organizationId: ORG_ID,
        filters: {},
        role: 'admin',
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta).toBeDefined();
      expect(result.meta.total).toBe(2);
      expect(mockRepository.list).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_ID,
          filters: {},
        }),
      );
    });

    it('defaults to createdAt sort for invalid sort field', async () => {
      mockRepository.list.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      await customerService.listCustomers({
        query: { sort: 'invalidField' },
        organizationId: ORG_ID,
        filters: {},
        role: 'admin',
      });

      expect(mockRepository.list).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('updateCustomer', () => {
    it('updates customer when found and input is valid', async () => {
      const customer = buildCustomer();
      const updated = buildCustomer({ companyName: 'Updated Name' });
      mockRepository.findById.mockResolvedValue(customer);
      mockRepository.list.mockResolvedValue([]);
      mockRepository.update.mockResolvedValue(updated);

      const result = await customerService.updateCustomer({
        id: CUSTOMER_ID,
        organizationId: ORG_ID,
        input: { companyName: 'Updated Name' },
        role: 'admin',
      });

      expect(result.companyName).toBe('Updated Name');
      expect(mockRepository.update).toHaveBeenCalledWith(CUSTOMER_ID, ORG_ID, {
        companyName: 'Updated Name',
      });
    });

    it('throws NotFoundError when customer does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        customerService.updateCustomer({
          id: 'nonexistent-id',
          organizationId: ORG_ID,
          input: { companyName: 'New Name' },
          role: 'admin',
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws ConflictError when updating to a duplicate companyName', async () => {
      const customer = buildCustomer();
      const otherCustomer = buildCustomer({ id: 'other-id', companyName: 'Taken Name' });
      mockRepository.findById.mockResolvedValue(customer);
      mockRepository.list.mockResolvedValue([otherCustomer]);

      await expect(
        customerService.updateCustomer({
          id: CUSTOMER_ID,
          organizationId: ORG_ID,
          input: { companyName: 'Taken Name' },
          role: 'admin',
        }),
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it('allows updating companyName to the same value (own record)', async () => {
      const customer = buildCustomer({ companyName: 'Same Name' });
      const updated = buildCustomer({ companyName: 'Same Name' });
      mockRepository.findById.mockResolvedValue(customer);
      mockRepository.list.mockResolvedValue([customer]);
      mockRepository.update.mockResolvedValue(updated);

      const result = await customerService.updateCustomer({
        id: CUSTOMER_ID,
        organizationId: ORG_ID,
        input: { companyName: 'Same Name' },
        role: 'admin',
      });

      expect(result.companyName).toBe('Same Name');
    });

    it('skips uniqueness check when companyName is not provided', async () => {
      const customer = buildCustomer();
      const updated = buildCustomer({ notes: 'Updated notes' });
      mockRepository.findById.mockResolvedValue(customer);
      mockRepository.update.mockResolvedValue(updated);

      await customerService.updateCustomer({
        id: CUSTOMER_ID,
        organizationId: ORG_ID,
        input: { notes: 'Updated notes' },
        role: 'admin',
      });

      expect(mockRepository.list).not.toHaveBeenCalled();
    });
  });

  describe('deleteCustomer', () => {
    it('soft-deletes customer when found', async () => {
      mockRepository.findById.mockResolvedValue(buildCustomer());
      mockRepository.softDelete.mockResolvedValue(undefined);

      await customerService.deleteCustomer({
        id: CUSTOMER_ID,
        organizationId: ORG_ID,
        role: 'admin',
      });

      expect(mockRepository.softDelete).toHaveBeenCalledWith(CUSTOMER_ID, ORG_ID, expect.any(Date));
    });

    it('throws NotFoundError when customer does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        customerService.deleteCustomer({
          id: 'nonexistent-id',
          organizationId: ORG_ID,
          role: 'admin',
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
