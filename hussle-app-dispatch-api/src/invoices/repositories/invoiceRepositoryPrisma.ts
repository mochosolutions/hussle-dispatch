import type { PrismaClient, InvoiceStatus, LoadStatus } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import { NotFoundError } from '@/shared/errors/commonErrors';
import type {
  InvoiceRepoPort,
  InvoiceListFilters,
  InvoiceLoadQueryPort,
} from '../types/invoiceTypes';

const INVOICE_DETAIL_INCLUDE = {
  load: {
    include: {
      accessorialCharges: true,
      stops: {
        orderBy: { sequence: 'asc' as const },
        select: {
          id: true,
          type: true,
          sequence: true,
          facilityName: true,
          city: true,
          state: true,
          appointmentStart: true,
          appointmentEnd: true,
        },
      },
    },
  },
  carrier: true,
  customer: true,
} as const;

const INVOICE_LIST_SELECT = {
  id: true,
  loadId: true,
  carrierId: true,
  customerId: true,
  invoiceNumber: true,
  type: true,
  subtotal: true,
  accessorials: true,
  totalAmount: true,
  paymentTerms: true,
  paymentTermsDays: true,
  dueDate: true,
  missingSignedBol: true,
  status: true,
  sentAt: true,
  paidAt: true,
  paidAmount: true,
  approvedAt: true,
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
  customer: {
    select: {
      id: true,
      companyName: true,
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
        customerId: data.customerId,
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

  findById: async (id, organizationId) =>
    prisma.invoice.findFirst({
      where: { id, load: { organizationId } },
      include: INVOICE_DETAIL_INCLUDE,
    }),

  findByLoadId: async (loadId, organizationId) =>
    prisma.invoice.findFirst({
      where: { loadId, load: { organizationId } },
      include: INVOICE_DETAIL_INCLUDE,
    }),

  findManyByLoadId: async (loadId, organizationId) =>
    prisma.invoice.findMany({
      where: { loadId, load: { organizationId } },
      include: INVOICE_DETAIL_INCLUDE,
    }),

  findAll: async (organizationId, filters) =>
    prisma.invoice.findMany({
      where: buildListWhere(organizationId, filters),
      select: INVOICE_LIST_SELECT,
      orderBy: { createdAt: 'desc' },
    }),

  update: async (id, organizationId, data) => {
    const invoice = await prisma.invoice.findFirst({
      where: { id, load: { organizationId } },
    });
    if (!invoice) {
      throw new NotFoundError(`Invoice with id ${id} not found`);
    }
    return prisma.invoice.update({
      where: { id },
      data,
      include: INVOICE_DETAIL_INCLUDE,
    });
  },

  updateStatus: async (id, organizationId, status, extra = {}) => {
    const invoice = await prisma.invoice.findFirst({
      where: { id, load: { organizationId } },
    });
    if (!invoice) {
      throw new NotFoundError(`Invoice with id ${id} not found`);
    }
    return prisma.invoice.update({
      where: { id },
      data: { status, ...extra },
      include: INVOICE_DETAIL_INCLUDE,
    });
  },

  delete: async (id, organizationId) => {
    const invoice = await prisma.invoice.findFirst({
      where: { id, load: { organizationId } },
    });
    if (!invoice) {
      throw new NotFoundError(`Invoice with id ${id} not found`);
    }
    await prisma.invoice.delete({ where: { id } });
  },

  countByStatus: async (organizationId, status) =>
    prisma.invoice.count({
      where: {
        load: { organizationId },
        status: status as InvoiceStatus,
      },
    }),

  findNonVoidByLoadId: async (loadId, organizationId) =>
    prisma.invoice.findFirst({
      where: {
        loadId,
        load: { organizationId },
        status: { not: 'VOID' as InvoiceStatus },
      },
      include: INVOICE_DETAIL_INCLUDE,
    }),
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
        customerId: true,
        vehicleId: true,
        customerRate: true,
        carrierRate: true,
        dispatchFee: true,
        bolSignedAt: true,
        status: true,
        carrier: {
          select: { id: true, name: true, type: true },
        },
        customer: {
          select: { id: true, companyName: true, paymentTerms: true, paymentTermsDays: true },
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

  findLoadWithStops: async (loadId) =>
    prisma.load.findUnique({
      where: { id: loadId },
      select: {
        id: true,
        organizationId: true,
        loadNumber: true,
        externalRefNumber: true,
        equipmentType: true,
        totalMiles: true,
        customerRate: true,
        carrierRate: true,
        status: true,
        carrier: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            phone: true,
            email: true,
            mcNumber: true,
            billingMethod: true,
            factoringCompanyName: true,
            factoringCompanyEmail: true,
            factoringSubmissionMethod: true,
            factoringAdvanceRate: true,
            factoringFeePercent: true,
            factoringNoa: true,
            outboundEmailMode: true,
            replyToEmail: true,
          },
        },
        customer: {
          select: {
            id: true,
            companyName: true,
            email: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            paymentTerms: true,
            paymentTermsDays: true,
          },
        },
        stops: {
          select: {
            type: true,
            sequence: true,
            facilityName: true,
            city: true,
            state: true,
            appointmentStart: true,
            appointmentEnd: true,
            arrivalTime: true,
            departureTime: true,
            commodity: true,
            weight: true,
            pieceCount: true,
            isHazmat: true,
            isTarp: true,
          },
          orderBy: { sequence: 'asc' },
        },
        accessorialCharges: {
          select: {
            id: true,
            type: true,
            description: true,
            amount: true,
            approvalStatus: true,
          },
        },
      },
    }),
});
