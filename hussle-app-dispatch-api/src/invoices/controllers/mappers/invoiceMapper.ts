import type { InvoiceStatus, InvoiceType } from '@prisma/client';
import type { Request } from 'express';
import type { InvoiceListFilters } from '../../types/invoiceTypes';
import type {
  ListInvoicesServiceInput,
  GetInvoiceByIdServiceInput,
  UpdateInvoiceServiceInput,
  DeleteInvoiceServiceInput,
  ApproveInvoiceServiceInput,
  SendInvoiceServiceInput,
  MarkPaidServiceInput,
} from '../../types/invoiceServiceTypes';

const getContext = (req: Request) => ({
  organizationId: req.organizationId ?? '',
  role: req.user?.role ?? '',
  userId: req.user?.userId ?? '',
});

const parseStatusFilter = (value: unknown): InvoiceStatus[] | undefined => {
  if (typeof value !== 'string' || value.length === 0) {
    return undefined;
  }
  return value.split(',') as InvoiceStatus[];
};

export const listInvoicesMapper = (req: Request): ListInvoicesServiceInput => {
  const { organizationId, role } = getContext(req);

  const filters: InvoiceListFilters = {
    status: parseStatusFilter(req.query['status']),
    type: typeof req.query['type'] === 'string' ? (req.query['type'] as InvoiceType) : undefined,
    overdue: req.query['overdue'] === 'true',
    missingBol: req.query['missingBol'] === 'true',
  };

  return { organizationId, role, filters };
};

export const getInvoiceByIdMapper = (req: Request): GetInvoiceByIdServiceInput => {
  const { organizationId, role } = getContext(req);
  return { id: req.params['id'] ?? '', organizationId, role };
};

export const updateInvoiceMapper = (req: Request): UpdateInvoiceServiceInput => {
  const { organizationId, role } = getContext(req);
  return {
    id: req.params['id'] ?? '',
    organizationId,
    role,
    input: req.body,
  };
};

export const deleteInvoiceMapper = (req: Request): DeleteInvoiceServiceInput => {
  const { organizationId, role } = getContext(req);
  return { id: req.params['id'] ?? '', organizationId, role };
};

export const approveInvoiceMapper = (req: Request): ApproveInvoiceServiceInput => {
  const { organizationId, role, userId } = getContext(req);
  return { id: req.params['id'] ?? '', organizationId, role, userId };
};

export const sendInvoiceMapper = (req: Request): SendInvoiceServiceInput => {
  const { organizationId, role } = getContext(req);
  const body = req.body as { email: string; ccEmails?: string[] };
  return {
    id: req.params['id'] ?? '',
    organizationId,
    role,
    email: body.email,
    ccEmails: body.ccEmails,
  };
};

export const markPaidMapper = (req: Request): MarkPaidServiceInput => {
  const { organizationId, role } = getContext(req);
  const body = req.body as {
    amount: number;
    method: string;
    reference: string;
    date: string;
  };

  return {
    id: req.params['id'] ?? '',
    organizationId,
    role,
    amount: body.amount,
    method: body.method,
    reference: body.reference,
    date: body.date,
  };
};
