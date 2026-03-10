import type { PrismaClient, InvoiceStatus, LoadStatus } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type {
  InvoiceRepoPort,
  InvoiceListFilters,
  InvoiceLoadQueryPort,
} from '../types/invoiceTypes';

const INVOICE_DETAIL_INCLUDE = {
  load: true,
  carrier: true,
} as const;

const INVOICE_LIST_SELECT = {
  id: true,
  loadId: true,
  carrierId: true,
  invoiceNumber: true,
  type: true,
  subtotal: true,
  accessorials: true,
  totalAmount: true,
  paymentTerms: true,
  dueDate: true,
  missingSignedBol: true,
  status: true,
  sentAt: true,
  paidAt: true,
  paidAmount: true,
  createdAt: true,
  load: {
    select: {
      id: true,
      loadNumber: true,
      status: true,
    },
  },
  carrier: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

const buildListWhere = (
  organizationId: string,
  filters: InvoiceListFilters,
) => {
  const where: Record<string, unknown> = {
    load: { organizationId },
  };

  if (filters.status !== undefined && filters.status.length > 0) {
    where['status'] = { in: filters.status };
  }

  if (filters.type !== undefined) {
    where['type'] = filters.type;
  }

  if (filters.overdue === true) {
    where['dueDate'] = { lt: new Date() };
    where['status'] = { in: ['SENT', 'APPROVED'] };
  }

  if (filters.missingBol === true) {
    where['missingSignedBol'] = true;
  }

  return where;
};

export const invoiceRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): InvoiceRepoPort => ({
  create: async (data) =>
    prisma.invoice.create({
      data: {
        loadId: data.loadId,
        carrierId: data.carrierId,
        invoiceNumber: data.invoiceNumber,
        type: data.type,
        subtotal: data.subtotal,
        accessorials: data.accessorials,
        totalAmount: data.totalAmount,
        paymentTerms: data.paymentTerms,
        paymentTermsDays: data.paymentTermsDays,
        dueDate: data.dueDate,
        missingSignedBol: data.missingSignedBol,
        notes: data.notes,
      },
      include: INVOICE_DETAIL_INCLUDE,
    }),

  findById: async (id) =>
    prisma.invoice.findUnique({
      where: { id },
      include: INVOICE_DETAIL_INCLUDE,
    }),

  findByLoadId: async (loadId) =>
    prisma.invoice.findFirst({
      where: { loadId },
      include: INVOICE_DETAIL_INCLUDE,
    }),

  findAll: async (organizationId, filters) =>
    prisma.invoice.findMany({
      where: buildListWhere(organizationId, filters),
      select: INVOICE_LIST_SELECT,
      orderBy: { createdAt: 'desc' },
    }),

  update: async (id, data) =>
    prisma.invoice.update({
      where: { id },
      data,
      include: INVOICE_DETAIL_INCLUDE,
    }),

  updateStatus: async (id, status, extra = {}) =>
    prisma.invoice.update({
      where: { id },
      data: { status, ...extra },
      include: INVOICE_DETAIL_INCLUDE,
    }),

  delete: async (id) => {
    await prisma.invoice.delete({ where: { id } });
  },
});

export const invoiceLoadQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): InvoiceLoadQueryPort => ({
  findLoadById: async (loadId) =>
    prisma.load.findUnique({
      where: { id: loadId },
      select: {
        id: true,
        organizationId: true,
        loadNumber: true,
        carrierId: true,
        vehicleId: true,
        customerRate: true,
        carrierRate: true,
        dispatchFee: true,
        bolSignedAt: true,
        status: true,
        carrier: {
          select: { id: true, name: true, type: true },
        },
        broker: {
          select: { id: true, paymentTerms: true, paymentTermsDays: true },
        },
        accessorialCharges: true,
      },
    }),

  updateLoadStatus: async (loadId, status) => {
    await prisma.load.update({
      where: { id: loadId },
      data: { status: status as LoadStatus },
    });
  },
});
