import { computeRelayTargets } from '../relayRouting';

describe('computeRelayTargets', () => {
  const baseStatus = {
    loadId: 'load-1',
    organizationId: 'org-A',
    loadNumber: 'L-100',
    fromStatus: null,
    toStatus: 'IN_TRANSIT',
    customerId: null,
    contactEmail: null,
    contactPhone: null,
    contactCcEmails: [],
  };

  it('targets the org room for a load status event', () => {
    const targets = computeRelayTargets('load.status.changed', baseStatus);

    expect(targets).toContainEqual({ room: 'org:org-A', eventName: 'load.status.changed' });
  });

  it('also targets the driver room when driverId is present', () => {
    const targets = computeRelayTargets('load.status.changed', {
      ...baseStatus,
      driverId: 'driver-1',
    });

    expect(targets).toContainEqual({ room: 'org:org-A', eventName: 'load.status.changed' });
    expect(targets).toContainEqual({ room: 'driver:driver-1', eventName: 'load.status.changed' });
  });

  it('does not target a driver room when driverId is null', () => {
    const targets = computeRelayTargets('load.status.changed', {
      ...baseStatus,
      driverId: null,
    });

    expect(targets.some((t) => t.room.startsWith('driver:'))).toBe(false);
  });

  it('isolates driver A from driver B in the same org', () => {
    const targetsForB = computeRelayTargets('load.status.changed', {
      ...baseStatus,
      driverId: 'driver-B',
    });

    // Driver A's room is never a target when the event belongs to driver B.
    expect(targetsForB.some((t) => t.room === 'driver:driver-A')).toBe(false);
    expect(targetsForB).toContainEqual({ room: 'driver:driver-B', eventName: 'load.status.changed' });
  });

  it('keeps cross-org isolation — only the event org room is targeted', () => {
    const targets = computeRelayTargets('document.confirmed', {
      documentId: 'doc-1',
      entityType: 'load',
      entityId: 'load-1',
      documentType: 'POD',
      organizationId: 'org-A',
      expiresAt: null,
      driverId: 'driver-1',
    });

    expect(targets.some((t) => t.room === 'org:org-B')).toBe(false);
    expect(targets).toContainEqual({ room: 'org:org-A', eventName: 'document.confirmed' });
  });

  it('routes check-call events to org and driver rooms', () => {
    const targets = computeRelayTargets('load.checkcall.logged', {
      loadId: 'load-1',
      organizationId: 'org-A',
      loadNumber: 'L-100',
      checkCallId: 'cc-1',
      customerId: null,
      contactEmail: null,
      contactPhone: null,
      contactCcEmails: [],
      location: null,
      status: null,
      eta: null,
      latitude: null,
      longitude: null,
      occurredAt: new Date().toISOString(),
      driverId: 'driver-1',
    });

    expect(targets).toContainEqual({ room: 'org:org-A', eventName: 'load.checkcall.logged' });
    expect(targets).toContainEqual({ room: 'driver:driver-1', eventName: 'load.checkcall.logged' });
  });
});
