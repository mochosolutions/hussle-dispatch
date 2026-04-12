import Decimal from 'decimal.js';
import type { SettlementWithRelations } from '../types/settlementTypes';
import type { SettlementTemplateData } from '../templates/SettlementPdfTemplate';

const ROUNDING = Decimal.ROUND_HALF_EVEN;

const formatDecimal = (value: unknown): string => {
  if (value === null || value === undefined) return '0.00';
  return new Decimal(String(value)).toDecimalPlaces(2, ROUNDING).toFixed(2);
};

const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
};

export const buildSettlementPdfData = (
  settlement: SettlementWithRelations,
): SettlementTemplateData => {
  const revenueItems = settlement.lineItems
    .filter((li) => li.type === 'LOAD_REVENUE')
    .map((li) => ({
      loadNumber: li.description.replace('Load ', ''),
      route: '—',
      miles: li.miles,
      deliveryDate: formatDate(li.date),
      amount: formatDecimal(li.amount),
    }));

  const dispatchFeeItems = settlement.lineItems
    .filter((li) => li.type === 'DISPATCH_FEE')
    .map((li) => ({
      description: li.description,
      amount: formatDecimal(li.amount),
    }));

  const expenseItems = settlement.lineItems
    .filter((li) => li.type === 'EXPENSE')
    .map((li) => ({
      description: li.description,
      date: formatDate(li.date),
      amount: formatDecimal(li.amount),
    }));

  const accessorialItems = settlement.lineItems
    .filter((li) => li.type === 'ACCESSORIAL')
    .map((li) => ({
      description: li.description,
      amount: formatDecimal(li.amount),
    }));

  const adjustmentItems = settlement.lineItems
    .filter((li) => li.type === 'ADJUSTMENT')
    .map((li) => ({
      description: li.description,
      date: formatDate(li.date),
      amount: formatDecimal(li.amount),
    }));

  const accessorialsTotal = settlement.lineItems
    .filter((li) => li.type === 'ACCESSORIAL')
    .reduce((sum, li) => sum.plus(new Decimal(String(li.amount))), new Decimal(0));

  const adjustmentsTotal = settlement.lineItems
    .filter((li) => li.type === 'ADJUSTMENT')
    .reduce((sum, li) => sum.plus(new Decimal(String(li.amount))), new Decimal(0));

  const totalMiles = settlement.totalMiles;
  const grossRev = new Decimal(String(settlement.grossRevenue));
  const totalDeductions = new Decimal(String(settlement.dispatchFeeTotal)).plus(
    new Decimal(String(settlement.expensesTotal)),
  );
  const net = new Decimal(String(settlement.netEarnings));

  const revenuePerMile =
    totalMiles > 0
      ? grossRev.dividedBy(totalMiles).toDecimalPlaces(2, ROUNDING).toFixed(2)
      : null;
  const costPerMile =
    totalMiles > 0
      ? totalDeductions.dividedBy(totalMiles).toDecimalPlaces(2, ROUNDING).toFixed(2)
      : null;
  const netPerMile =
    totalMiles > 0 ? net.dividedBy(totalMiles).toDecimalPlaces(2, ROUNDING).toFixed(2) : null;

  const driverName = settlement.driver
    ? `${settlement.driver.firstName} ${settlement.driver.lastName}`
    : null;

  return {
    settlementNumber: settlement.settlementNumber,
    periodStart: formatDate(settlement.periodStart),
    periodEnd: formatDate(settlement.periodEnd),
    carrierName: settlement.carrier.name,
    driverName,
    vehicleUnit: settlement.vehicle?.unitNumber ?? null,
    revenueItems,
    dispatchFeeItems,
    expenseItems,
    accessorialItems,
    adjustmentItems,
    grossRevenue: formatDecimal(settlement.grossRevenue),
    dispatchFeeTotal: formatDecimal(settlement.dispatchFeeTotal),
    expensesTotal: formatDecimal(settlement.expensesTotal),
    accessorialsTotal: formatDecimal(accessorialsTotal),
    adjustmentsTotal: formatDecimal(adjustmentsTotal),
    netEarnings: formatDecimal(settlement.netEarnings),
    totalMiles,
    revenuePerMile,
    costPerMile,
    netPerMile,
  };
};
