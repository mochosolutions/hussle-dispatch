import type {
  Carrier,
  Driver,
  Settlement,
  SettlementItemType,
  SettlementLineItem,
  SettlementStatus,
  Vehicle,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// Entity types
// ---------------------------------------------------------------------------

export interface SettlementWithRelations extends Settlement {
  lineItems: SettlementLineItem[];
  carrier: Carrier;
  driver: Driver | null;
  vehicle: Vehicle | null;
}

export interface SettlementListItem {
  id: string;
  settlementNumber: string;
  status: SettlementStatus;
  periodStart: Date;
  periodEnd: Date;
  grossRevenue: unknown; // Decimal
  dispatchFeeTotal: unknown; // Decimal
  expensesTotal: unknown; // Decimal
  netEarnings: unknown; // Decimal
  totalMiles: number;
  carrier: {
    id: string;
    name: string;
  };
  driver: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Service inputs
// ---------------------------------------------------------------------------

export interface GenerateSettlementInput {
  organizationId: string;
  carrierId: string;
  driverId?: string;
  vehicleId?: string;
  periodStart: Date;
  periodEnd: Date;
}

export interface ApproveSettlementInput {
  organizationId: string;
  settlementId: string;
  userId: string;
}

export interface PaySettlementInput {
  organizationId: string;
  settlementId: string;
  paymentMethod: string;
  paymentReference?: string;
}

export interface DisputeSettlementInput {
  organizationId: string;
  settlementId: string;
  disputeReason: string;
}

export interface ListSettlementsInput {
  organizationId: string;
  status?: SettlementStatus;
  carrierId?: string;
  driverId?: string;
  periodStart?: Date;
  periodEnd?: Date;
  skip: number;
  take: number;
}

export interface CreateAdjustmentInput {
  organizationId: string;
  settlementId: string;
  description: string;
  amount: number;
  date: Date;
}

export interface UpdateAdjustmentInput {
  organizationId: string;
  settlementId: string;
  lineItemId: string;
  description?: string;
  amount?: number;
  date?: Date;
}

export interface DeleteAdjustmentInput {
  organizationId: string;
  settlementId: string;
  lineItemId: string;
}

export interface SendSettlementInput {
  organizationId: string;
  settlementId: string;
}

// ---------------------------------------------------------------------------
// Repo port
// ---------------------------------------------------------------------------

export interface SettlementRepoPort {
  create(data: {
    organizationId: string;
    settlementNumber: string;
    carrierId: string;
    driverId?: string;
    vehicleId?: string;
    periodStart: Date;
    periodEnd: Date;
    grossRevenue: number;
    totalMiles: number;
    dispatchFeeTotal: number;
    expensesTotal: number;
    netEarnings: number;
    snapshotHash?: string;
    lineItems: {
      type: SettlementItemType;
      referenceId?: string;
      description: string;
      miles?: number;
      amount: number;
      date: Date;
    }[];
  }): Promise<SettlementWithRelations>;
  findById(id: string, organizationId: string): Promise<SettlementWithRelations | null>;
  findMany(filters: ListSettlementsInput): Promise<SettlementListItem[]>;
  count(filters: Omit<ListSettlementsInput, 'skip' | 'take'>): Promise<number>;
  update(
    id: string,
    organizationId: string,
    data: Partial<{
      status: SettlementStatus;
      approvedAt: Date;
      approvedByUserId: string;
      paidAt: Date;
      paymentMethod: string;
      paymentReference: string;
      disputeReason: string;
      sentAt: Date;
      sentToEmail: string;
      grossRevenue: number;
      dispatchFeeTotal: number;
      expensesTotal: number;
      netEarnings: number;
      totalMiles: number;
    }>,
  ): Promise<SettlementWithRelations>;
  addLineItem(data: {
    settlementId: string;
    type: SettlementItemType;
    description: string;
    amount: number;
    date: Date;
    referenceId?: string;
    miles?: number;
  }): Promise<SettlementLineItem>;
  updateLineItem(
    lineItemId: string,
    data: Partial<{ description: string; amount: number; date: Date }>,
  ): Promise<SettlementLineItem>;
  deleteLineItem(lineItemId: string): Promise<void>;
  findOverlapping(
    organizationId: string,
    carrierId: string,
    driverId: string | undefined,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<Settlement | null>;
  recalculateTotals(settlementId: string): Promise<SettlementWithRelations>;
}

// ---------------------------------------------------------------------------
// Cross-module query ports
// ---------------------------------------------------------------------------

export interface SettlementLoadQueryPort {
  findDeliveredLoads(
    organizationId: string,
    carrierId: string,
    driverId: string | undefined,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<
    {
      id: string;
      loadNumber: string;
      carrierRate: unknown; // Decimal
      dispatchFee: unknown; // Decimal
      totalMiles: number | null;
      deliveredAt: Date | null;
      accessorialCharges: {
        id: string;
        type: string;
        description: string | null;
        amount: unknown; // Decimal
      }[];
    }[]
  >;
}

export interface CarrierQueryPort {
  findById(carrierId: string, organizationId: string): Promise<Carrier | null>;
}

export interface SettlementExpenseQueryPort {
  findExpenses(
    organizationId: string,
    vehicleId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<
    {
      id: string;
      description: string;
      amount: unknown; // Decimal
      date: Date;
    }[]
  >;
}
