// ---------------------------------------------------------------------------
// Invoice readiness evaluation types
// ---------------------------------------------------------------------------

export interface ReadinessCheckResult {
  readiness: 'NOT_READY' | 'AWAITING_DOCUMENTS' | 'READY' | 'INVOICE_CREATED';
  hasRateCon: boolean;
  hasSignedBol: boolean;
  hasPod: boolean;
  isDelivered: boolean;
  hasExistingInvoice: boolean;
}

export interface InvoiceReadinessPort {
  evaluateReadiness(loadId: string): Promise<ReadinessCheckResult>;
  updateLoadReadiness(loadId: string, readiness: string): Promise<void>;
}

export interface OrgSettingsQueryPort {
  findByOrganizationId(organizationId: string): Promise<{
    invoiceWorkflow: string;
    sesFromEmail: string | null;
    companyLogoUrl: string | null;
  } | null>;
}
