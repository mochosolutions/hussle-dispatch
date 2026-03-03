/**
 * Audit Logging Types
 *
 * Types, interfaces, and port definitions for audit logging infrastructure.
 * Audit logs capture WHO did WHAT and WHEN for compliance and debugging.
 */

import type { AuditLog } from '@prisma/client';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_DELETE' | 'BULK_UPDATE';

export interface CreateAuditLogInput {
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  metadata: Record<string, unknown> | null;
  timestamp?: Date;
}

export interface AuditLogQueryOptions {
  limit?: number;
  offset?: number;
  action?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface AuditLogRepoPort {
  create(input: CreateAuditLogInput): Promise<AuditLog>;
  findByEntity(
    entityType: string,
    entityId: string,
    options?: AuditLogQueryOptions,
  ): Promise<AuditLog[]>;
  findByUser(userId: string, options?: AuditLogQueryOptions): Promise<AuditLog[]>;
  findRecent(options?: AuditLogQueryOptions): Promise<AuditLog[]>;
}

export interface AuditContext {
  userId: string | null;
  organizationId: string;
  entityId: string;
  changes: Record<string, { old: unknown; new: unknown }> | null;
}
