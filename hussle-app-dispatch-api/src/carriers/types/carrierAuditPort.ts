export interface CarrierAuditPort {
  create(
    organizationId: string,
    input: {
      userId: string | null;
      action: string;
      entityType: string;
      entityId: string;
      changes: Record<string, { old: unknown; new: unknown }> | null;
      metadata: Record<string, unknown> | null;
    },
  ): Promise<unknown>;
}
