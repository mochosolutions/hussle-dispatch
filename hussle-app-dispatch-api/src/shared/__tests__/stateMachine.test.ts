import {
  TRANSITIONS,
  TRANSITION_SIDE_EFFECTS,
  KANBAN_GROUPS,
  validateTransition,
} from '../stateMachine';
import type { TransitionContext } from '../stateMachine';

// ---------------------------------------------------------------------------
// TRANSITIONS map
// ---------------------------------------------------------------------------

describe('TRANSITIONS map', () => {
  it('covers all 13 statuses as keys', () => {
    const expected = [
      'QUOTED',
      'BOOKED',
      'DISPATCHED',
      'EN_ROUTE_PICKUP',
      'AT_PICKUP',
      'IN_TRANSIT',
      'AT_DELIVERY',
      'DELIVERED',
      'INVOICE_PENDING',
      'INVOICED',
      'PAID',
      'EXCEPTION',
      'CANCELED',
      'TONU',
    ];
    expected.forEach((status) => {
      expect(TRANSITIONS).toHaveProperty(status);
    });
    expect(Object.keys(TRANSITIONS)).toHaveLength(14);
  });

  it('QUOTED allows BOOKED and CANCELED', () => {
    expect(TRANSITIONS.QUOTED).toEqual(expect.arrayContaining(['BOOKED', 'CANCELED']));
    expect(TRANSITIONS.QUOTED).toHaveLength(2);
  });

  it('BOOKED allows DISPATCHED and CANCELED', () => {
    expect(TRANSITIONS.BOOKED).toEqual(expect.arrayContaining(['DISPATCHED', 'CANCELED']));
    expect(TRANSITIONS.BOOKED).toHaveLength(2);
  });

  it('DISPATCHED allows EN_ROUTE_PICKUP, TONU, and CANCELED', () => {
    expect(TRANSITIONS.DISPATCHED).toEqual(
      expect.arrayContaining(['EN_ROUTE_PICKUP', 'TONU', 'CANCELED']),
    );
    expect(TRANSITIONS.DISPATCHED).toHaveLength(3);
  });

  it('EN_ROUTE_PICKUP allows AT_PICKUP and TONU', () => {
    expect(TRANSITIONS.EN_ROUTE_PICKUP).toEqual(expect.arrayContaining(['AT_PICKUP', 'TONU']));
    expect(TRANSITIONS.EN_ROUTE_PICKUP).toHaveLength(2);
  });

  it('AT_PICKUP allows IN_TRANSIT and TONU', () => {
    expect(TRANSITIONS.AT_PICKUP).toEqual(expect.arrayContaining(['IN_TRANSIT', 'TONU']));
    expect(TRANSITIONS.AT_PICKUP).toHaveLength(2);
  });

  it('IN_TRANSIT allows AT_DELIVERY and EXCEPTION', () => {
    expect(TRANSITIONS.IN_TRANSIT).toEqual(expect.arrayContaining(['AT_DELIVERY', 'EXCEPTION']));
    expect(TRANSITIONS.IN_TRANSIT).toHaveLength(2);
  });

  it('AT_DELIVERY allows DELIVERED and EXCEPTION', () => {
    expect(TRANSITIONS.AT_DELIVERY).toEqual(expect.arrayContaining(['DELIVERED', 'EXCEPTION']));
    expect(TRANSITIONS.AT_DELIVERY).toHaveLength(2);
  });

  it('DELIVERED allows INVOICE_PENDING and EXCEPTION', () => {
    expect(TRANSITIONS.DELIVERED).toEqual(
      expect.arrayContaining(['INVOICE_PENDING', 'EXCEPTION']),
    );
    expect(TRANSITIONS.DELIVERED).toHaveLength(2);
  });

  it('INVOICE_PENDING allows INVOICED', () => {
    expect(TRANSITIONS.INVOICE_PENDING).toEqual(['INVOICED']);
  });

  it('INVOICED allows PAID', () => {
    expect(TRANSITIONS.INVOICED).toEqual(['PAID']);
  });

  it('PAID is terminal — no allowed transitions', () => {
    expect(TRANSITIONS.PAID).toEqual([]);
  });

  it('EXCEPTION allows INVOICED', () => {
    expect(TRANSITIONS.EXCEPTION).toEqual(['INVOICED']);
  });

  it('CANCELED is terminal — no allowed transitions', () => {
    expect(TRANSITIONS.CANCELED).toEqual([]);
  });

  it('TONU allows INVOICED', () => {
    expect(TRANSITIONS.TONU).toEqual(['INVOICED']);
  });
});

// ---------------------------------------------------------------------------
// TRANSITION_SIDE_EFFECTS
// ---------------------------------------------------------------------------

describe('TRANSITION_SIDE_EFFECTS', () => {
  it('DISPATCHED triggers FREEZE_FINANCIALS', () => {
    expect(TRANSITION_SIDE_EFFECTS.DISPATCHED).toContain('FREEZE_FINANCIALS');
  });

  it('DELIVERED triggers AUTO_GENERATE_INVOICE', () => {
    expect(TRANSITION_SIDE_EFFECTS.DELIVERED).toContain('AUTO_GENERATE_INVOICE');
  });

  it('TONU triggers AUTO_CREATE_TONU_ACCESSORIAL and AUTO_GENERATE_INVOICE', () => {
    expect(TRANSITION_SIDE_EFFECTS.TONU).toContain('AUTO_CREATE_TONU_ACCESSORIAL');
    expect(TRANSITION_SIDE_EFFECTS.TONU).toContain('AUTO_GENERATE_INVOICE');
  });
});

// ---------------------------------------------------------------------------
// KANBAN_GROUPS re-export
// ---------------------------------------------------------------------------

describe('KANBAN_GROUPS', () => {
  it('exports 6 groups', () => {
    expect(Object.keys(KANBAN_GROUPS)).toHaveLength(6);
  });

  it('has NEW group with yellow color containing QUOTED', () => {
    expect(KANBAN_GROUPS.NEW.color).toBe('yellow');
    expect(KANBAN_GROUPS.NEW.statuses).toContain('QUOTED');
  });

  it('has BOOKED group with orange color containing BOOKED', () => {
    expect(KANBAN_GROUPS.BOOKED.color).toBe('orange');
    expect(KANBAN_GROUPS.BOOKED.statuses).toContain('BOOKED');
  });

  it('has ACTIVE group with green color containing active statuses', () => {
    expect(KANBAN_GROUPS.ACTIVE.color).toBe('green');
    ['DISPATCHED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'IN_TRANSIT', 'AT_DELIVERY'].forEach((s) => {
      expect(KANBAN_GROUPS.ACTIVE.statuses).toContain(s);
    });
  });

  it('has DELIVERED group with purple color', () => {
    expect(KANBAN_GROUPS.DELIVERED.color).toBe('purple');
    expect(KANBAN_GROUPS.DELIVERED.statuses).toContain('DELIVERED');
    expect(KANBAN_GROUPS.DELIVERED.statuses).toContain('INVOICE_PENDING');
  });

  it('has COMPLETE group with gray color', () => {
    expect(KANBAN_GROUPS.COMPLETE.color).toBe('gray');
    expect(KANBAN_GROUPS.COMPLETE.statuses).toContain('INVOICED');
    expect(KANBAN_GROUPS.COMPLETE.statuses).toContain('PAID');
  });

  it('has ISSUES group with red color', () => {
    expect(KANBAN_GROUPS.ISSUES.color).toBe('red');
    expect(KANBAN_GROUPS.ISSUES.statuses).toContain('EXCEPTION');
    expect(KANBAN_GROUPS.ISSUES.statuses).toContain('CANCELED');
    expect(KANBAN_GROUPS.ISSUES.statuses).toContain('TONU');
  });
});

// ---------------------------------------------------------------------------
// validateTransition — basic allowed/disallowed transitions
// ---------------------------------------------------------------------------

const adminCtx: TransitionContext = {
  userRole: 'ADMIN',
  load: { carrierId: 'c-1', driverId: 'd-1', vehicleId: 'v-1', rateConReceivedAt: new Date() },
};

const dispatcherCtx: TransitionContext = {
  userRole: 'DISPATCHER',
  load: { carrierId: 'c-1', driverId: 'd-1', vehicleId: 'v-1', rateConReceivedAt: new Date() },
};

describe('validateTransition — happy paths', () => {
  it('returns valid:true for QUOTED → BOOKED with carrier on load', () => {
    const result = validateTransition('QUOTED', 'BOOKED', {
      userRole: 'DISPATCHER',
      load: { carrierId: 'c-1' },
    });
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns valid:true for BOOKED → DISPATCHED with carrier, driver, vehicle', () => {
    const result = validateTransition('BOOKED', 'DISPATCHED', adminCtx);
    expect(result.valid).toBe(true);
  });

  it('returns valid:true for DISPATCHED → EN_ROUTE_PICKUP (DISPATCHER)', () => {
    const result = validateTransition('DISPATCHED', 'EN_ROUTE_PICKUP', dispatcherCtx);
    expect(result.valid).toBe(true);
  });

  it('returns valid:true for EXCEPTION → INVOICED (ADMIN)', () => {
    const result = validateTransition('EXCEPTION', 'INVOICED', {
      ...adminCtx,
      notes: 'Exception resolved',
    });
    expect(result.valid).toBe(true);
  });

  it('returns valid:true for INVOICED → PAID (ADMIN)', () => {
    const result = validateTransition('INVOICED', 'PAID', adminCtx);
    expect(result.valid).toBe(true);
  });

  it('returns valid:true for CANCELED (with notes, ADMIN)', () => {
    const result = validateTransition('QUOTED', 'CANCELED', {
      userRole: 'ADMIN',
      load: {},
      notes: 'Customer cancelled',
    });
    expect(result.valid).toBe(true);
  });
});

describe('validateTransition — invalid transitions', () => {
  it('returns valid:false with descriptive error for QUOTED → DISPATCHED', () => {
    const result = validateTransition('QUOTED', 'DISPATCHED', adminCtx);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Cannot transition from QUOTED to DISPATCHED/);
    expect(result.error).toMatch(/BOOKED/);
    expect(result.error).toMatch(/CANCELED/);
  });

  it('returns valid:false for transition FROM terminal PAID', () => {
    const result = validateTransition('PAID', 'QUOTED', adminCtx);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Cannot transition from PAID to QUOTED/);
  });

  it('returns valid:false for transition FROM terminal CANCELED', () => {
    const result = validateTransition('CANCELED', 'BOOKED', adminCtx);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Cannot transition from CANCELED to BOOKED/);
  });

  it('error message lists allowed transitions for non-terminal status', () => {
    const result = validateTransition('BOOKED', 'QUOTED', adminCtx);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/DISPATCHED/);
    expect(result.error).toMatch(/CANCELED/);
  });

  it('error message says "none" for terminal statuses', () => {
    const result = validateTransition('PAID', 'INVOICED', adminCtx);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/none/i);
  });
});

// ---------------------------------------------------------------------------
// validateTransition — prerequisites
// ---------------------------------------------------------------------------

describe('validateTransition — QUOTED → BOOKED prerequisite: carrierId', () => {
  it('returns valid:false when carrierId is missing', () => {
    const result = validateTransition('QUOTED', 'BOOKED', {
      userRole: 'DISPATCHER',
      load: {},
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/carrier/i);
  });

  it('returns valid:false when carrierId is null', () => {
    const result = validateTransition('QUOTED', 'BOOKED', {
      userRole: 'DISPATCHER',
      load: { carrierId: null },
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/carrier/i);
  });

  it('returns valid:true when carrierId is present', () => {
    const result = validateTransition('QUOTED', 'BOOKED', {
      userRole: 'DISPATCHER',
      load: { carrierId: 'c-1' },
    });
    expect(result.valid).toBe(true);
  });
});

describe('validateTransition — BOOKED → DISPATCHED prerequisites: driverId + vehicleId', () => {
  it('returns valid:false when driverId is missing', () => {
    const result = validateTransition('BOOKED', 'DISPATCHED', {
      userRole: 'DISPATCHER',
      load: { carrierId: 'c-1', vehicleId: 'v-1' },
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/driver/i);
  });

  it('returns valid:false when vehicleId is missing', () => {
    const result = validateTransition('BOOKED', 'DISPATCHED', {
      userRole: 'DISPATCHER',
      load: { carrierId: 'c-1', driverId: 'd-1' },
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/vehicle/i);
  });

  it('returns valid:false when both driverId and vehicleId are missing', () => {
    const result = validateTransition('BOOKED', 'DISPATCHED', {
      userRole: 'DISPATCHER',
      load: { carrierId: 'c-1' },
    });
    expect(result.valid).toBe(false);
  });

  it('returns valid:false when rateConReceivedAt is null', () => {
    const result = validateTransition('BOOKED', 'DISPATCHED', {
      userRole: 'DISPATCHER',
      load: { carrierId: 'c-1', driverId: 'd-1', vehicleId: 'v-1', rateConReceivedAt: null },
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/rate confirmation/i);
  });

  it('returns valid:false when rateConReceivedAt is undefined', () => {
    const result = validateTransition('BOOKED', 'DISPATCHED', {
      userRole: 'DISPATCHER',
      load: { carrierId: 'c-1', driverId: 'd-1', vehicleId: 'v-1' },
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/rate confirmation/i);
  });

  it('returns valid:true when all prerequisites met including rateConReceivedAt', () => {
    const result = validateTransition('BOOKED', 'DISPATCHED', {
      userRole: 'DISPATCHER',
      load: {
        carrierId: 'c-1',
        driverId: 'd-1',
        vehicleId: 'v-1',
        rateConReceivedAt: new Date(),
      },
    });
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateTransition — ADMIN-only transitions
// ---------------------------------------------------------------------------

describe('validateTransition — ADMIN-only: EXCEPTION', () => {
  it('returns valid:false when DISPATCHER attempts EXCEPTION transition', () => {
    const result = validateTransition('IN_TRANSIT', 'EXCEPTION', {
      userRole: 'DISPATCHER',
      load: {},
      notes: 'Something went wrong',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/admin/i);
  });

  it('returns valid:true when ADMIN transitions to EXCEPTION with notes', () => {
    const result = validateTransition('IN_TRANSIT', 'EXCEPTION', {
      userRole: 'ADMIN',
      load: {},
      notes: 'Something went wrong',
    });
    expect(result.valid).toBe(true);
  });

  it('returns valid:false when VIEWER attempts EXCEPTION transition', () => {
    const result = validateTransition('IN_TRANSIT', 'EXCEPTION', {
      userRole: 'VIEWER',
      load: {},
      notes: 'note',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/admin/i);
  });
});

describe('validateTransition — ADMIN-only: PAID', () => {
  it('returns valid:false when DISPATCHER attempts PAID transition', () => {
    const result = validateTransition('INVOICED', 'PAID', {
      userRole: 'DISPATCHER',
      load: {},
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/admin/i);
  });

  it('returns valid:true when ADMIN transitions to PAID', () => {
    const result = validateTransition('INVOICED', 'PAID', {
      userRole: 'ADMIN',
      load: {},
    });
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateTransition — notes required
// ---------------------------------------------------------------------------

describe('validateTransition — notes required: EXCEPTION', () => {
  it('returns valid:false when notes are missing for EXCEPTION', () => {
    const result = validateTransition('IN_TRANSIT', 'EXCEPTION', {
      userRole: 'ADMIN',
      load: {},
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/notes/i);
  });

  it('returns valid:false when notes is empty string for EXCEPTION', () => {
    const result = validateTransition('IN_TRANSIT', 'EXCEPTION', {
      userRole: 'ADMIN',
      load: {},
      notes: '',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/notes/i);
  });

  it('returns valid:true when notes are provided for EXCEPTION', () => {
    const result = validateTransition('IN_TRANSIT', 'EXCEPTION', {
      userRole: 'ADMIN',
      load: {},
      notes: 'Cargo damage',
    });
    expect(result.valid).toBe(true);
  });
});

describe('validateTransition — notes required: CANCELED', () => {
  it('returns valid:false when notes are missing for CANCELED', () => {
    const result = validateTransition('BOOKED', 'CANCELED', {
      userRole: 'ADMIN',
      load: {},
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/notes/i);
  });

  it('returns valid:false when notes is empty string for CANCELED', () => {
    const result = validateTransition('BOOKED', 'CANCELED', {
      userRole: 'ADMIN',
      load: {},
      notes: '   ',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/notes/i);
  });

  it('returns valid:true when notes are provided for CANCELED (ADMIN)', () => {
    const result = validateTransition('BOOKED', 'CANCELED', {
      userRole: 'ADMIN',
      load: {},
      notes: 'Customer cancelled',
    });
    expect(result.valid).toBe(true);
  });

  it('returns valid:true when notes are provided for CANCELED (DISPATCHER)', () => {
    const result = validateTransition('BOOKED', 'CANCELED', {
      userRole: 'DISPATCHER',
      load: {},
      notes: 'Customer cancelled',
    });
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateTransition — soft warnings
// ---------------------------------------------------------------------------

describe('validateTransition — warnings', () => {
  it('does not include warnings key when there are no warnings', () => {
    const result = validateTransition('QUOTED', 'BOOKED', {
      userRole: 'DISPATCHER',
      load: { carrierId: 'c-1' },
    });
    expect(result.valid).toBe(true);
    expect(result.warnings).toBeUndefined();
  });

  it('does not warn when transitioning to DELIVERED without bolSignedAt (gate is invoiceReadinessSubscriber)', () => {
    const result = validateTransition('AT_DELIVERY', 'DELIVERED', {
      userRole: 'DISPATCHER',
      load: { bolSignedAt: null },
    });
    expect(result.valid).toBe(true);
    expect(result.warnings).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// validateTransition — DRIVER role restrictions
// ---------------------------------------------------------------------------

describe('validateTransition — DRIVER role restrictions', () => {
  const driverCtx: TransitionContext = {
    userRole: 'DRIVER',
    load: { carrierId: 'c-1', driverId: 'd-1', vehicleId: 'v-1', rateConReceivedAt: new Date() },
  };

  it('allows DRIVER to transition DISPATCHED → EN_ROUTE_PICKUP', () => {
    const result = validateTransition('DISPATCHED', 'EN_ROUTE_PICKUP', driverCtx);
    expect(result.valid).toBe(true);
  });

  it('allows DRIVER to transition EN_ROUTE_PICKUP → AT_PICKUP', () => {
    const result = validateTransition('EN_ROUTE_PICKUP', 'AT_PICKUP', driverCtx);
    expect(result.valid).toBe(true);
  });

  it('allows DRIVER to transition AT_PICKUP → IN_TRANSIT', () => {
    const result = validateTransition('AT_PICKUP', 'IN_TRANSIT', driverCtx);
    expect(result.valid).toBe(true);
  });

  it('allows DRIVER to transition IN_TRANSIT → AT_DELIVERY', () => {
    const result = validateTransition('IN_TRANSIT', 'AT_DELIVERY', driverCtx);
    expect(result.valid).toBe(true);
  });

  it('allows DRIVER to transition AT_DELIVERY → DELIVERED', () => {
    const result = validateTransition('AT_DELIVERY', 'DELIVERED', {
      ...driverCtx,
      load: { ...driverCtx.load, bolSignedAt: new Date() },
    });
    expect(result.valid).toBe(true);
  });

  it('blocks DRIVER from transitioning to TONU', () => {
    const result = validateTransition('DISPATCHED', 'TONU', driverCtx);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Drivers can only advance/);
  });

  it('blocks DRIVER from transitioning to CANCELED', () => {
    const result = validateTransition('BOOKED', 'CANCELED', {
      ...driverCtx,
      notes: 'reason',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Drivers can only advance/);
  });

  it('blocks DRIVER from transitioning to EXCEPTION (caught by ADMIN-only check first)', () => {
    const result = validateTransition('IN_TRANSIT', 'EXCEPTION', {
      ...driverCtx,
      notes: 'Something wrong',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/ADMIN role/);
  });

  it('does not affect DISPATCHER transitions', () => {
    const result = validateTransition('DISPATCHED', 'TONU', {
      userRole: 'DISPATCHER',
      load: driverCtx.load,
    });
    expect(result.valid).toBe(true);
  });

  it('does not affect ADMIN transitions', () => {
    const result = validateTransition('IN_TRANSIT', 'EXCEPTION', {
      userRole: 'ADMIN',
      load: driverCtx.load,
      notes: 'Something wrong',
    });
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// appointmentNumber is intentionally not enforced at the state-machine layer.
// Removed warning intentionally — no downstream business logic depends on it.
// ---------------------------------------------------------------------------
