import { buildTenantCleanupPlan } from '../tenantCleanupPlan';

describe('buildTenantCleanupPlan', () => {
  it('includes organization-scoped descendants and orders children before parents for deletion', () => {
    const plan = buildTenantCleanupPlan();

    expect(plan.rootModelName).toBe('Organization');
    expect(plan.includedModelNames).toContain('Carrier');
    expect(plan.includedModelNames).toContain('Driver');
    expect(plan.includedModelNames).toContain('Vehicle');
    expect(plan.includedModelNames).toContain('TruckExpense');
    expect(plan.includedModelNames).toContain('Load');
    expect(plan.includedModelNames).toContain('Document');
    expect(plan.deleteOrder.indexOf('TruckExpense')).toBeLessThan(
      plan.deleteOrder.indexOf('Vehicle'),
    );
    expect(plan.deleteOrder.indexOf('Vehicle')).toBeLessThan(plan.deleteOrder.indexOf('Carrier'));
    expect(plan.deleteOrder.indexOf('Driver')).toBeLessThan(plan.deleteOrder.indexOf('Carrier'));
    expect(plan.deleteOrder.indexOf('Carrier')).toBeLessThan(
      plan.deleteOrder.indexOf('Organization'),
    );
  });

  it('respects skipped models', () => {
    const plan = buildTenantCleanupPlan({ skippedModelNames: ['AuditLog', 'Document'] });

    expect(plan.includedModelNames).not.toContain('AuditLog');
    expect(plan.includedModelNames).not.toContain('Document');
  });
});
