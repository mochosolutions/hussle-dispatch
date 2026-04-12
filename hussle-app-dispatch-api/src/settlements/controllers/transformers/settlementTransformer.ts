import type { SettlementWithRelations, SettlementListItem } from '../../types/settlementTypes';

interface LineItemResponse {
  id: string;
  type: string;
  referenceId: string | null;
  description: string;
  miles: number | null;
  amount: string;
  date: string;
}

interface SettlementDetailResponse {
  id: string;
  settlementNumber: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  grossRevenue: string;
  totalMiles: number;
  dispatchFeeTotal: string;
  expensesTotal: string;
  netEarnings: string;
  approvedAt: string | null;
  approvedByUserId: string | null;
  paidAt: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  disputeReason: string | null;
  sentAt: string | null;
  sentToEmail: string | null;
  createdAt: string;
  updatedAt: string;
  carrier: { id: string; name: string };
  driver: { id: string; firstName: string; lastName: string } | null;
  vehicle: { id: string; unitNumber: string } | null;
  lineItems: LineItemResponse[];
}

interface SettlementListItemResponse {
  id: string;
  settlementNumber: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  grossRevenue: string;
  dispatchFeeTotal: string;
  expensesTotal: string;
  netEarnings: string;
  totalMiles: number;
  carrier: { id: string; name: string };
  driver: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
}

export const toSettlementDetailResponse = (
  settlement: SettlementWithRelations,
): SettlementDetailResponse => ({
  id: settlement.id,
  settlementNumber: settlement.settlementNumber,
  status: settlement.status,
  periodStart: settlement.periodStart.toISOString(),
  periodEnd: settlement.periodEnd.toISOString(),
  grossRevenue: String(settlement.grossRevenue),
  totalMiles: settlement.totalMiles,
  dispatchFeeTotal: String(settlement.dispatchFeeTotal),
  expensesTotal: String(settlement.expensesTotal),
  netEarnings: String(settlement.netEarnings),
  approvedAt: settlement.approvedAt?.toISOString() ?? null,
  approvedByUserId: settlement.approvedByUserId,
  paidAt: settlement.paidAt?.toISOString() ?? null,
  paymentMethod: settlement.paymentMethod,
  paymentReference: settlement.paymentReference,
  disputeReason: settlement.disputeReason,
  sentAt: settlement.sentAt?.toISOString() ?? null,
  sentToEmail: settlement.sentToEmail,
  createdAt: settlement.createdAt.toISOString(),
  updatedAt: settlement.updatedAt.toISOString(),
  carrier: {
    id: settlement.carrier.id,
    name: settlement.carrier.name,
  },
  driver: settlement.driver !== null
    ? {
        id: settlement.driver.id,
        firstName: settlement.driver.firstName,
        lastName: settlement.driver.lastName,
      }
    : null,
  vehicle: settlement.vehicle !== null
    ? {
        id: settlement.vehicle.id,
        unitNumber: settlement.vehicle.unitNumber,
      }
    : null,
  lineItems: settlement.lineItems.map((item) => ({
    id: item.id,
    type: item.type,
    referenceId: item.referenceId,
    description: item.description,
    miles: item.miles,
    amount: String(item.amount),
    date: item.date.toISOString(),
  })),
});

export const toSettlementListResponse = (
  items: SettlementListItem[],
): SettlementListItemResponse[] =>
  items.map((item) => ({
    id: item.id,
    settlementNumber: item.settlementNumber,
    status: item.status,
    periodStart: item.periodStart.toISOString(),
    periodEnd: item.periodEnd.toISOString(),
    grossRevenue: String(item.grossRevenue),
    dispatchFeeTotal: String(item.dispatchFeeTotal),
    expensesTotal: String(item.expensesTotal),
    netEarnings: String(item.netEarnings),
    totalMiles: item.totalMiles,
    carrier: item.carrier,
    driver: item.driver,
    createdAt: item.createdAt.toISOString(),
  }));
