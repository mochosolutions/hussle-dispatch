import Decimal from 'decimal.js';
import { createInvoiceService } from '../invoiceService';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../../shared/errors';
import { ROLES } from '../../../config/roles';
import type { InvoiceRepoPort, InvoiceLoadQueryPort } from '../../types/invoiceTypes';
import type { InvoiceWithRelations } from '../../types/invoiceTypes';
import type { Logger } from '../../../shared/utils/logger';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface InvoiceEmailPort {
  sendInvoiceEmail(input: {
    invoiceId: string;
    recipientEmail: string;
    replyToEmail?: string;
    fromEmail: string;
    subject: string;
  }): Promise<void>;
}

const buildMockDeps = () => {
  const invoiceRepo: jest.Mocked<InvoiceRepoPort> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByLoadId: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    findManyByLoadId: jest.fn(),
    delete: jest.fn(),
    countByStatus: jest.fn(),
    findNonVoidByLoadId: jest.fn(),
  };

  const loadQuery: jest.Mocked<InvoiceLoadQueryPort> = {
    findLoadById: jest.fn(),
    updateLoadStatus: jest.fn().mockResolvedValue(undefined),
    findLoadWithStops: jest.fn(),
  };

  const invoiceEmailService: jest.Mocked<InvoiceEmailPort> = {
    sendInvoiceEmail: jest.fn().mockResolvedValue(undefined),
  };

  const logger: jest.Mocked<Logger> = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  return { invoiceRepo, loadQuery, invoiceEmailService, logger };
};

/**
 * Builds a mock InvoiceWithRelations object.
 * Uses Decimal for financial fields to match Prisma's runtime representation.
 * Cast through unknown to satisfy the Prisma-generated type constraints
 * on nested relations without manually populating 30+ Load fields.
 */
const makeInvoice = (
  overrides: Record<string, unknown> = {},
): InvoiceWithRelations => {
  const base = {
    id: 'inv-1',
    loadId: 'load-1',
    organizationId: 'org-1',
    carrierId: 'carrier-1',
    customerId: 'customer-1',
    invoiceNumber: 'INV-001',
    type: 'CUSTOMER',
    subtotal: new Decimal(1000),
    accessorials: new Decimal(200),
    totalAmount: new Decimal(1200),
    paymentTerms: 'NET_30',
    paymentTermsDays: 30,
    dueDate: new Date('2026-04-15'),
    missingSignedBol: false,
    status: 'DRAFT',
    sentAt: null,
    paidAt: null,
    paidAmount: null,
    approvedAt: null,
    approvedByUserId: null,
    paymentMethod: null,
    paymentReference: null,
    notes: null,
    createdAt: new Date('2026-03-01'),
    updatedAt: new Date('2026-03-01'),
    load: {
      id: 'load-1',
      loadNumber: 'LD-001',
      accessorialCharges: [],
    },
    carrier: {
      id: 'carrier-1',
      name: 'Test Carrier',
    },
    customer: null,
    ...overrides,
  };

  return base as unknown as InvoiceWithRelations;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createInvoiceService', () => {
  let deps: ReturnType<typeof buildMockDeps>;

  beforeEach(() => {
    jest.clearAllMocks();
    deps = buildMockDeps();
  });

  // -------------------------------------------------------------------------
  // updateInvoice
  // -------------------------------------------------------------------------

  describe('updateInvoice', () => {
    it('throws NotFoundError when invoice does not exist', async () => {
      // Arrange
      deps.invoiceRepo.findById.mockResolvedValue(null);
      const service = createInvoiceService(deps);

      // Act & Assert
      await expect(
        service.updateInvoice({
          id: 'inv-missing',
          organizationId: 'org-1',
          role: ROLES.ADMIN,
          input: { notes: 'updated' },
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when invoice is not DRAFT', async () => {
      // Arrange
      deps.invoiceRepo.findById.mockResolvedValue(makeInvoice({ status: 'APPROVED' }));
      const service = createInvoiceService(deps);

      // Act & Assert
      await expect(
        service.updateInvoice({
          id: 'inv-1',
          organizationId: 'org-1',
          role: ROLES.ADMIN,
          input: { notes: 'updated' },
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('updates invoice when status is DRAFT', async () => {
      // Arrange
      const draft = makeInvoice({ status: 'DRAFT' });
      const updated = makeInvoice({ status: 'DRAFT', notes: 'updated' });
      deps.invoiceRepo.findById.mockResolvedValue(draft);
      deps.invoiceRepo.update.mockResolvedValue(updated);
      const service = createInvoiceService(deps);

      // Act
      const result = await service.updateInvoice({
        id: 'inv-1',
        organizationId: 'org-1',
        role: ROLES.ADMIN,
        input: { notes: 'updated' },
      });

      // Assert
      expect(deps.invoiceRepo.update).toHaveBeenCalledWith('inv-1', 'org-1', { notes: 'updated' });
      expect(result).toBe(updated);
    });
  });

  // -------------------------------------------------------------------------
  // deleteInvoice
  // -------------------------------------------------------------------------

  describe('deleteInvoice', () => {
    it('throws ForbiddenError when role is not ADMIN', async () => {
      // Arrange
      const service = createInvoiceService(deps);

      // Act & Assert
      await expect(
        service.deleteInvoice({
          id: 'inv-1',
          organizationId: 'org-1',
          role: ROLES.DISPATCHER,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws NotFoundError when invoice does not exist', async () => {
      // Arrange
      deps.invoiceRepo.findById.mockResolvedValue(null);
      const service = createInvoiceService(deps);

      // Act & Assert
      await expect(
        service.deleteInvoice({
          id: 'inv-missing',
          organizationId: 'org-1',
          role: ROLES.ADMIN,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when invoice is not DRAFT', async () => {
      // Arrange
      deps.invoiceRepo.findById.mockResolvedValue(makeInvoice({ status: 'SENT' }));
      const service = createInvoiceService(deps);

      // Act & Assert
      await expect(
        service.deleteInvoice({
          id: 'inv-1',
          organizationId: 'org-1',
          role: ROLES.ADMIN,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('deletes invoice and reverts load status to DELIVERED', async () => {
      // Arrange
      const draft = makeInvoice({ status: 'DRAFT', loadId: 'load-1' });
      deps.invoiceRepo.findById.mockResolvedValue(draft);
      deps.invoiceRepo.delete.mockResolvedValue(undefined);
      const service = createInvoiceService(deps);

      // Act
      await service.deleteInvoice({
        id: 'inv-1',
        organizationId: 'org-1',
        role: ROLES.ADMIN,
      });

      // Assert
      expect(deps.invoiceRepo.delete).toHaveBeenCalledWith('inv-1', 'org-1');
      expect(deps.loadQuery.updateLoadStatus).toHaveBeenCalledWith('load-1', 'DELIVERED');
      expect(deps.logger.info).toHaveBeenCalledWith(
        'Invoice deleted, load reverted to DELIVERED',
        expect.objectContaining({ invoiceId: 'inv-1', loadId: 'load-1' }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // approveInvoice
  // -------------------------------------------------------------------------

  describe('approveInvoice', () => {
    it('throws ForbiddenError when role is not ADMIN', async () => {
      // Arrange
      const service = createInvoiceService(deps);

      // Act & Assert
      await expect(
        service.approveInvoice({
          id: 'inv-1',
          organizationId: 'org-1',
          userId: 'user-1',
          role: ROLES.DISPATCHER,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws ValidationError when invoice is not DRAFT', async () => {
      // Arrange
      deps.invoiceRepo.findById.mockResolvedValue(makeInvoice({ status: 'SENT' }));
      const service = createInvoiceService(deps);

      // Act & Assert
      await expect(
        service.approveInvoice({
          id: 'inv-1',
          organizationId: 'org-1',
          userId: 'user-1',
          role: ROLES.ADMIN,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('sets approvedByUserId and approvedAt when approving DRAFT invoice', async () => {
      // Arrange
      const draft = makeInvoice({ status: 'DRAFT' });
      const approved = makeInvoice({ status: 'APPROVED', approvedByUserId: 'user-1' });
      deps.invoiceRepo.findById.mockResolvedValue(draft);
      deps.invoiceRepo.updateStatus.mockResolvedValue(approved);
      const service = createInvoiceService(deps);

      // Act
      const result = await service.approveInvoice({
        id: 'inv-1',
        organizationId: 'org-1',
        userId: 'user-1',
        role: ROLES.ADMIN,
      });

      // Assert
      expect(deps.invoiceRepo.updateStatus).toHaveBeenCalledWith('inv-1', 'org-1', 'APPROVED', {
        approvedByUserId: 'user-1',
        approvedAt: expect.any(Date),
      });
      expect(result).toBe(approved);
      expect(deps.logger.info).toHaveBeenCalledWith(
        'Invoice approved',
        expect.objectContaining({ invoiceId: 'inv-1', userId: 'user-1' }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // sendInvoice
  // -------------------------------------------------------------------------

  describe('sendInvoice', () => {
    it('throws ValidationError when invoice is not APPROVED', async () => {
      // Arrange
      deps.invoiceRepo.findById.mockResolvedValue(makeInvoice({ status: 'DRAFT' }));
      const service = createInvoiceService(deps);

      // Act & Assert
      await expect(
        service.sendInvoice({
          id: 'inv-1',
          organizationId: 'org-1',
          role: ROLES.ADMIN,
          email: 'recipient@example.com',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('calls invoiceEmailService and re-fetches invoice after send', async () => {
      // Arrange
      const approved = makeInvoice({ status: 'APPROVED' });
      const sent = makeInvoice({ status: 'SENT', sentAt: new Date() });
      deps.invoiceRepo.findById
        .mockResolvedValueOnce(approved)
        .mockResolvedValueOnce(sent);
      const service = createInvoiceService(deps);

      // Act
      const result = await service.sendInvoice({
        id: 'inv-1',
        organizationId: 'org-1',
        role: ROLES.ADMIN,
        email: 'recipient@example.com',
      });

      // Assert
      expect(deps.invoiceEmailService.sendInvoiceEmail).toHaveBeenCalledWith({
        invoiceId: 'inv-1',
        organizationId: 'org-1',
        recipientEmail: 'recipient@example.com',
        fromEmail: 'invoices@fleetcommand.app',
        subject: 'Invoice from Test Carrier \u2014 Load #LD-001',
      });
      expect(deps.invoiceRepo.findById).toHaveBeenCalledTimes(2);
      expect(result).toBe(sent);
      expect(deps.logger.info).toHaveBeenCalledWith(
        'Invoice sent with PDF + attachments',
        expect.objectContaining({ invoiceId: 'inv-1', email: 'recipient@example.com' }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // markPaid
  // -------------------------------------------------------------------------

  describe('markPaid', () => {
    it('throws ValidationError when invoice status is not payable', async () => {
      // Arrange
      deps.invoiceRepo.findById.mockResolvedValue(makeInvoice({ status: 'DRAFT' }));
      const service = createInvoiceService(deps);

      // Act & Assert
      await expect(
        service.markPaid({
          id: 'inv-1',
          organizationId: 'org-1',
          role: ROLES.ADMIN,
          amount: 500,
          method: 'ACH',
          reference: 'REF-001',
          date: '2026-03-20',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('sets PARTIALLY_PAID when cumulative payment is less than total', async () => {
      // Arrange
      const invoice = makeInvoice({
        status: 'SENT',
        totalAmount: new Decimal(1200),
        paidAmount: null,
      });
      const updated = makeInvoice({
        status: 'PARTIALLY_PAID',
        paidAmount: new Decimal(500),
      });
      deps.invoiceRepo.findById.mockResolvedValue(invoice);
      deps.invoiceRepo.updateStatus.mockResolvedValue(updated);
      const service = createInvoiceService(deps);

      // Act
      const result = await service.markPaid({
        id: 'inv-1',
        organizationId: 'org-1',
        role: ROLES.ADMIN,
        amount: 500,
        method: 'ACH',
        reference: 'REF-001',
        date: '2026-03-20',
      });

      // Assert
      expect(deps.invoiceRepo.updateStatus).toHaveBeenCalledWith('inv-1', 'org-1', 'PARTIALLY_PAID', {
        paidAmount: 500,
        paymentMethod: 'ACH',
        paymentReference: 'REF-001',
        paidAt: expect.any(Date),
      });
      expect(deps.loadQuery.updateLoadStatus).not.toHaveBeenCalled();
      expect(result).toBe(updated);
    });

    it('sets PAID and transitions load when cumulative payment meets total', async () => {
      // Arrange
      const invoice = makeInvoice({
        status: 'PARTIALLY_PAID',
        totalAmount: new Decimal(1200),
        paidAmount: new Decimal(700),
      });
      const paid = makeInvoice({
        status: 'PAID',
        paidAmount: new Decimal(1200),
      });
      deps.invoiceRepo.findById.mockResolvedValue(invoice);
      deps.invoiceRepo.updateStatus.mockResolvedValue(paid);
      const service = createInvoiceService(deps);

      // Act
      const result = await service.markPaid({
        id: 'inv-1',
        organizationId: 'org-1',
        role: ROLES.ADMIN,
        amount: 500,
        method: 'CHECK',
        reference: 'CHK-002',
        date: '2026-03-22',
      });

      // Assert
      expect(deps.invoiceRepo.updateStatus).toHaveBeenCalledWith('inv-1', 'org-1', 'PAID', {
        paidAmount: 1200,
        paymentMethod: 'CHECK',
        paymentReference: 'CHK-002',
        paidAt: expect.any(Date),
      });
      expect(deps.loadQuery.updateLoadStatus).toHaveBeenCalledWith('load-1', 'PAID');
      expect(deps.logger.info).toHaveBeenCalledWith(
        'Invoice fully paid, load transitioned to PAID',
        expect.objectContaining({ invoiceId: 'inv-1', loadId: 'load-1' }),
      );
      expect(result).toBe(paid);
    });

    it('sets PAID when single payment covers full amount with no prior payments', async () => {
      // Arrange
      const invoice = makeInvoice({
        status: 'APPROVED',
        totalAmount: new Decimal(1200),
        paidAmount: null,
      });
      const paid = makeInvoice({
        status: 'PAID',
        paidAmount: new Decimal(1200),
      });
      deps.invoiceRepo.findById.mockResolvedValue(invoice);
      deps.invoiceRepo.updateStatus.mockResolvedValue(paid);
      const service = createInvoiceService(deps);

      // Act
      const result = await service.markPaid({
        id: 'inv-1',
        organizationId: 'org-1',
        role: ROLES.ADMIN,
        amount: 1200,
        method: 'WIRE',
        reference: 'WIRE-001',
        date: '2026-03-22',
      });

      // Assert
      expect(deps.invoiceRepo.updateStatus).toHaveBeenCalledWith('inv-1', 'org-1', 'PAID', {
        paidAmount: 1200,
        paymentMethod: 'WIRE',
        paymentReference: 'WIRE-001',
        paidAt: expect.any(Date),
      });
      expect(deps.loadQuery.updateLoadStatus).toHaveBeenCalledWith('load-1', 'PAID');
      expect(result).toBe(paid);
    });
  });
});
