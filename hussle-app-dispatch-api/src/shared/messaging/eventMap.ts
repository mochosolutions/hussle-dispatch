/**
 * Single source of truth mapping event names to typed payloads.
 * Adding a new event = one entry in this interface.
 */
export interface EventMap {
  'organization.created': {
    orgId: string;
    orgName: string;
    orgRole: string;
    userId: string;
    userEmail: string;
    customMetadata: Record<string, unknown>;
  };
  'load.status.changed': {
    loadId: string;
    organizationId: string;
    loadNumber: string;
    fromStatus: string | null;
    toStatus: string;
    customerId: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    contactCcEmails: string[];
  };
  'load.delivered': { loadId: string; organizationId: string; status: string };
  'load.canceled': { loadId: string; organizationId: string; status: string };
  'load.tonu': { loadId: string; organizationId: string; status: string };
  'accessorial.created': { loadId: string; organizationId: string; accessorialId: string };
  'accessorial.updated': { loadId: string; organizationId: string; accessorialId: string };
  'accessorial.deleted': { loadId: string; organizationId: string; accessorialId: string };
  'load.checkcall.logged': {
    loadId: string;
    organizationId: string;
    loadNumber: string;
    checkCallId: string;
    customerId: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    contactCcEmails: string[];
    location: string | null;
    status: string | null;
    eta: string | null;
  };
  'document.confirmed': {
    documentId: string;
    entityType: string;
    entityId: string;
    documentType: string;
    organizationId: string;
  };
  'invoice.draft.created': {
    invoiceId: string;
    loadId: string;
    organizationId: string;
    invoiceNumber: string;
  };
  'vehicle.expense.changed': {
    vehicleId: string;
    organizationId: string;
  };
  'vehicle.expense.created': {
    vehicleId: string;
    organizationId: string;
    expenseId: string;
  };
  'carrier.invited': {
    carrierId: string;
    organizationId: string;
    carrierName: string;
    carrierEmail: string;
    carrierPhone?: string | null;
    inviteToken: string;
    invitedByUserId: string;
  };
  'carrier.onboarding.completed': {
    carrierId: string;
    organizationId: string;
    carrierName: string;
  };
  'carrier.onboarding.approved': {
    carrierId: string;
    organizationId: string;
    carrierName: string;
    carrierEmail: string;
    carrierPhone?: string | null;
    minimumRatePerMile: number;
    approvedByUserId: string;
  };
  'carrier.onboarding.rejected': {
    carrierId: string;
    organizationId: string;
    carrierName: string;
    carrierEmail: string;
    carrierPhone?: string | null;
    rejectionReason: string;
    rejectedByUserId: string;
  };
  'invitation.created': {
    inviteId: string;
    organizationId: string;
    orgName: string;
    recipientEmail: string;
    inviteeFirstName: string;
    inviteeLastName: string;
    inviterName: string;
    role: string;
    inviteToken: string;
    expiresAt: string;
  };
  'expense.created': {
    expenseId: string;
    vehicleId: string;
    organizationId: string;
    category: string;
  };
  'expense.updated': {
    expenseId: string;
    vehicleId: string;
    organizationId: string;
  };
  'expense.deleted': {
    expenseId: string;
    vehicleId: string;
    organizationId: string;
  };
  'recurring-expense.generated': {
    vehicleId: string;
    organizationId: string;
    count: number;
  };
  'settlement.draft.created': {
    settlementId: string;
    organizationId: string;
    carrierId: string;
    settlementNumber: string;
  };
  'settlement.approved': {
    settlementId: string;
    organizationId: string;
  };
  'settlement.paid': {
    settlementId: string;
    organizationId: string;
  };
  'settlement.disputed': {
    settlementId: string;
    organizationId: string;
  };
  'settlement.generate': {
    organizationId: string;
    carrierId: string;
    driverId?: string;
    vehicleId?: string;
    periodStart: string;
    periodEnd: string;
  };
  'load.stops.changed': {
    loadId: string;
    organizationId: string;
  };
  'load.detention.detected': {
    loadId: string;
    organizationId: string;
    loadNumber: string;
    stopId: string;
    stopSequence: number;
    facilityName: string | null;
    city: string | null;
    state: string | null;
    waitHours: number;
    billableHours: number;
    rate: number;
    amount: number;
  };
  'sms.prompt.due': {
    smsPromptScheduleId: string;
    loadId: string;
    organizationId: string;
    anchor: 'DISPATCHED' | 'PRE_PICKUP' | 'POST_PICKUP' | 'TRANSIT_INTERVAL' | 'MANUAL';
  };
  'sms.prompt.canceled': {
    smsPromptScheduleId: string;
    loadId: string;
    reason: string;
  };
}
