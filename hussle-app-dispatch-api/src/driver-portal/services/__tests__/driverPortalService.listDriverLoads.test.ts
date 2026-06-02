import { createDriverPortalService } from '../driverPortalService';

const buildSummary = (overrides: Record<string, unknown> = {}) => ({
  id: 'load-1',
  organizationId: 'org-1',
  driverId: 'driver-1',
  loadNumber: 'LD-001',
  status: 'IN_TRANSIT',
  equipmentType: null,
  driverInstructions: null,
  stops: [],
  driver: null,
  ...overrides,
});

const createDeps = () => ({
  loadQuery: {
    findLoadsByDriver: jest.fn(),
  },
  checkCallRepo: { create: jest.fn() },
  loadStatusService: { transitionStatus: jest.fn() },
  eventBus: { publish: jest.fn(), publishDelayed: jest.fn(), subscribe: jest.fn() },
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
});

describe('driverPortalService.listDriverLoads', () => {
  it('returns the driver-scoped loads from the query port', async () => {
    // Arrange
    const deps = createDeps();
    const loads = [buildSummary(), buildSummary({ id: 'load-2', loadNumber: 'LD-002' })];
    deps.loadQuery.findLoadsByDriver.mockResolvedValue(loads);
    const service = createDriverPortalService(deps as never);

    // Act
    const result = await service.listDriverLoads('driver-1', 'org-1');

    // Assert
    expect(result).toBe(loads);
    expect(deps.loadQuery.findLoadsByDriver).toHaveBeenCalledWith('driver-1', 'org-1');
  });

  it('passes the session driverId and organizationId straight through (scoping)', async () => {
    // Arrange
    const deps = createDeps();
    deps.loadQuery.findLoadsByDriver.mockResolvedValue([]);
    const service = createDriverPortalService(deps as never);

    // Act
    await service.listDriverLoads('driver-9', 'org-7');

    // Assert
    expect(deps.loadQuery.findLoadsByDriver).toHaveBeenCalledTimes(1);
    expect(deps.loadQuery.findLoadsByDriver).toHaveBeenCalledWith('driver-9', 'org-7');
  });
});
