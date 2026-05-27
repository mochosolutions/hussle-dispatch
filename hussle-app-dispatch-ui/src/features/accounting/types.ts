// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ---------------------------------------------------------------------------
// Settlement types
// ---------------------------------------------------------------------------

export interface SettlementListItem {
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
  carrierName: string;
  driverName: string | null;
  createdAt: string;
}

export interface SettlementLineItem {
  id: string;
  type: string;
  description: string;
  loadNumber: string | null;
  amount: string;
  date: string;
}

export interface SettlementDetail extends SettlementListItem {
  lineItems: SettlementLineItem[];
  carrierId: string;
  driverId: string | null;
  vehicleId: string | null;
  vehicleUnitNumber: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  disputeReason: string | null;
  sentAt: string | null;
  approvedAt: string | null;
  paidAt: string | null;
}

export interface GenerateSettlementInput {
  carrierId: string;
  driverId?: string;
  vehicleId?: string;
  periodStart: string;
  periodEnd: string;
}

export interface PaySettlementInput {
  paymentMethod: string;
  paymentReference?: string;
}

export interface DisputeSettlementInput {
  disputeReason: string;
}

export interface CreateAdjustmentInput {
  description: string;
  amount: number;
  date: string;
}

// ---------------------------------------------------------------------------
// Settlement filters
// ---------------------------------------------------------------------------

export interface SettlementFilters {
  status?: string;
  carrierId?: string;
  periodStart?: string;
  periodEnd?: string;
  search?: string;
}

// ---------------------------------------------------------------------------
// IFTA types
// ---------------------------------------------------------------------------

export interface IftaStateEntry {
  state: string;
  milesDriven: number;
  fuelGallons: number;
  fuelCost: number;
}

export interface IftaVehicleTotals {
  totalMiles: number;
  totalGallons: number;
  totalFuelCost: number;
  averageMpg: number;
}

export interface IftaVehicleEntry {
  vehicleId: string;
  unitNumber: string;
  states: IftaStateEntry[];
  totals: IftaVehicleTotals;
}

export interface IftaReportResponse {
  year: number;
  quarter: number;
  periodStart: string;
  periodEnd: string;
  vehicles: IftaVehicleEntry[];
  fleetTotals: IftaVehicleTotals;
}

// ---------------------------------------------------------------------------
// Expense types
// ---------------------------------------------------------------------------

export interface ExpenseListItem {
  id: string;
  category: string;
  description: string | null;
  amount: string;
  date: string;
  vehicleId: string;
  vehicleUnitNumber: string | null;
  state: string | null;
  gallons: string | null;
  fuelType: string | null;
}

export interface CreateExpenseInput {
  category: string;
  amount: number;
  date: string;
  vehicleId: string;
  description?: string;
  gallons?: number;
  state?: string;
  pricePerGallon?: number;
  fuelType?: string;
}
