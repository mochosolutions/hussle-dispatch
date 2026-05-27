/**
 * Audit Log Port — Auth Module
 *
 * Decouples auth from the audit module via dependency inversion.
 * The auth module depends on this interface; the audit module provides the implementation.
 */

export interface CreateAuditLogInput {
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  metadata: Record<string, unknown> | null;
  timestamp?: Date;
}

export interface AuditLogPort {
  create(organizationId: string, input: CreateAuditLogInput): Promise<unknown>;
}
