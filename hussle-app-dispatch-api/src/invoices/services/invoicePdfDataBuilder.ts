import Decimal from 'decimal.js';
import type { InvoiceTemplateData } from '../types/invoiceTemplateTypes';
import type { InvoiceWithRelations, InvoiceLoadQueryPort } from '../types/invoiceTypes';
import type { OrgSettingsQueryPort } from '../types/readinessTypes';
import type { Logger } from '../../shared/utils/logger';

interface PdfDataBuilderDeps {
  loadQuery: InvoiceLoadQueryPort;
  orgSettingsQuery: OrgSettingsQueryPort;
  logger: Logger;
}

const formatDecimal = (value: unknown): string => {
  if (value === null || value === undefined) return '0.00';
  return new Decimal(String(value)).toFixed(2);
};

const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
};

export const buildInvoicePdfData = async (
  invoice: InvoiceWithRelations,
  deps: PdfDataBuilderDeps,
): Promise<InvoiceTemplateData> => {
  const load = await deps.loadQuery.findLoadWithStops(invoice.loadId);

  if (load === null) {
    throw new Error(`Load not found for invoice ${invoice.id}`);
  }

  const orgSettings = await deps.orgSettingsQuery.findByOrganizationId(load.organizationId);

  const carrier = load.carrier;
  const customer = load.customer;

  const carrierCityParts = [carrier?.city, carrier?.state, carrier?.zip].filter(Boolean);
  const customerCityParts = [customer?.city, customer?.state, customer?.zip].filter(Boolean);

  const billingMethod = String(invoice.billingMethod ?? carrier?.billingMethod ?? 'DIRECT');
  const isFactored = billingMethod === 'FACTORED';

  const billToName = isFactored
    ? (carrier?.factoringCompanyName ?? customer?.companyName ?? 'Unknown')
    : (customer?.companyName ?? 'Unknown');
  const billToEmail = isFactored
    ? (carrier?.factoringCompanyEmail ?? null)
    : (customer?.email ?? null);

  const accessorials = load.accessorialCharges.map((charge) => ({
    type: charge.type,
    description: charge.description,
    amount: formatDecimal(charge.amount),
  }));

  const accessorialsTotal = load.accessorialCharges.reduce(
    (sum, charge) => sum.add(new Decimal(String(charge.amount))),
    new Decimal(0),
  );

  return {
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: formatDate(invoice.createdAt),
    dueDate: formatDate(invoice.dueDate),
    paymentTerms: invoice.paymentTerms,
    status: invoice.status,

    carrierName: carrier?.name ?? 'Unknown Carrier',
    carrierAddress: carrier?.address ?? null,
    carrierCityStateZip: carrierCityParts.length > 0 ? carrierCityParts.join(', ') : null,
    carrierPhone: carrier?.phone ?? null,
    carrierEmail: carrier?.email ?? null,
    carrierMcNumber: carrier?.mcNumber ?? null,

    billToName,
    billToAddress: isFactored ? null : (customer?.address ?? null),
    billToCityStateZip: isFactored ? null : (customerCityParts.length > 0 ? customerCityParts.join(', ') : null),
    billToEmail,

    companyLogoUrl: orgSettings?.companyLogoUrl ?? null,

    loadNumber: load.loadNumber,
    externalRefNumber: load.externalRefNumber,
    equipmentType: load.equipmentType,
    commodity: load.commodity,
    weight: load.weight,
    totalMiles: load.totalMiles,

    stops: load.stops
      .sort((a, b) => a.sequence - b.sequence)
      .map((stop) => ({
        type: stop.type,
        facilityName: stop.facilityName,
        city: stop.city,
        state: stop.state,
        appointmentDate: stop.appointmentDate !== null ? formatDate(stop.appointmentDate) : null,
        arrivalTime: stop.arrivalTime !== null ? formatDate(stop.arrivalTime) : null,
        departureTime: stop.departureTime !== null ? formatDate(stop.departureTime) : null,
      })),

    subtotal: formatDecimal(invoice.subtotal),
    accessorials,
    accessorialsTotal: accessorialsTotal.toFixed(2),
    totalAmount: formatDecimal(invoice.totalAmount),

    billingMethod,
    factoringCompanyName: carrier?.factoringCompanyName ?? null,
    factoringNoa: carrier?.factoringNoa ?? null,
    factoringAdvance: invoice.factoringAdvance !== null ? formatDecimal(invoice.factoringAdvance) : null,
    factoringFeeAmount: invoice.factoringFeeAmount !== null ? formatDecimal(invoice.factoringFeeAmount) : null,
    reserveAmount: invoice.reserveAmount !== null ? formatDecimal(invoice.reserveAmount) : null,

    notes: invoice.notes,
  };
};
