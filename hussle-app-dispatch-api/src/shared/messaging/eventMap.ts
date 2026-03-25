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
  };
  'load.delivered': { loadId: string; status: string };
  'load.canceled': { loadId: string; status: string };
  'load.tonu': { loadId: string; status: string };
  'accessorial.created': { loadId: string; accessorialId: string };
  'accessorial.updated': { loadId: string; accessorialId: string };
  'accessorial.deleted': { loadId: string; accessorialId: string };
  'load.checkcall.logged': {
    loadId: string;
    organizationId: string;
    loadNumber: string;
    checkCallId: string;
    customerId: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
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
}
