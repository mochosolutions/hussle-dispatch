// ---------------------------------------------------------------------------
// Dashboard types
// ---------------------------------------------------------------------------

export interface DashboardKpis {
  activeLoads: {
    total: number;
    byStatus: Record<string, number>;
  };
  weeklyRevenue: number;
  monthlyRevenue: number;
  dispatchFees: number;
  partnerSplit: number;
  overdueInvoices: {
    count: number;
    total: number;
  };
}

export interface WeeklyGrossItem {
  vehicleId: string;
  unitNumber: string;
  driverName: string | null;
  revenue: number;
  target: number;
  loadCount: number;
}

export type AttentionCategory =
  | 'EXCEPTIONS'
  | 'OVERDUE_INVOICES'
  | 'MISSING_RATE_CON'
  | 'MISSING_BOL'
  | 'EXPIRING_INSURANCE'
  | 'UNCONFIRMED_PICKUPS';

export interface AttentionItem {
  id: string;
  category: AttentionCategory;
  title: string;
  subtitle: string | null;
  linkTo: string;
  severity: 'error' | 'warning' | 'info';
  createdAt: string;
}

export const ATTENTION_CATEGORY_LABELS: Record<AttentionCategory, string> = {
  EXCEPTIONS: 'Exceptions',
  OVERDUE_INVOICES: 'Overdue Invoices',
  MISSING_RATE_CON: 'Missing Rate Con',
  MISSING_BOL: 'Missing BOL',
  EXPIRING_INSURANCE: 'Expiring Insurance',
  UNCONFIRMED_PICKUPS: 'Unconfirmed Pickups',
};
