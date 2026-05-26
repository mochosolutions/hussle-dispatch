import type { LoadStatus } from './constants/loadStatuses';
import {
  ADMIN_ONLY_TRANSITIONS,
  DRIVER_ALLOWED_TRANSITIONS,
  NOTES_REQUIRED_TRANSITIONS,
} from './constants/stateMachine';
import { KANBAN_GROUPS } from './constants/kanbanGroups';

export { KANBAN_GROUPS };

// ---------------------------------------------------------------------------
// Transition map — 14 statuses with their allowed target statuses
// ---------------------------------------------------------------------------

export type TransitionMap = Readonly<Record<LoadStatus, readonly LoadStatus[]>>;

export const TRANSITIONS: TransitionMap = Object.freeze({
  QUOTED: Object.freeze(['BOOKED', 'CANCELED'] as const),
  BOOKED: Object.freeze(['DISPATCHED', 'CANCELED'] as const),
  DISPATCHED: Object.freeze(['EN_ROUTE_PICKUP', 'TONU', 'CANCELED'] as const),
  EN_ROUTE_PICKUP: Object.freeze(['AT_PICKUP', 'TONU'] as const),
  AT_PICKUP: Object.freeze(['IN_TRANSIT', 'TONU'] as const),
  IN_TRANSIT: Object.freeze(['AT_DELIVERY', 'EXCEPTION'] as const),
  AT_DELIVERY: Object.freeze(['DELIVERED', 'EXCEPTION'] as const),
  DELIVERED: Object.freeze(['INVOICE_PENDING', 'EXCEPTION'] as const),
  INVOICE_PENDING: Object.freeze(['INVOICED'] as const),
  INVOICED: Object.freeze(['PAID'] as const),
  PAID: Object.freeze([] as const),
  EXCEPTION: Object.freeze(['INVOICED'] as const),
  CANCELED: Object.freeze([] as const),
  TONU: Object.freeze(['INVOICED'] as const),
});

// ---------------------------------------------------------------------------
// Side effects — string tags resolved at runtime
// ---------------------------------------------------------------------------

export type SideEffectTag =
  | 'FREEZE_FINANCIALS'
  | 'AUTO_GENERATE_INVOICE'
  | 'AUTO_CREATE_TONU_ACCESSORIAL'
  | 'CHECK_DETENTION';

export type SideEffectsMap = Readonly<Partial<Record<LoadStatus, readonly SideEffectTag[]>>>;

export const TRANSITION_SIDE_EFFECTS: SideEffectsMap = Object.freeze({
  DISPATCHED: Object.freeze(['FREEZE_FINANCIALS'] as const),
  IN_TRANSIT: Object.freeze(['CHECK_DETENTION'] as const),
  DELIVERED: Object.freeze(['AUTO_GENERATE_INVOICE', 'CHECK_DETENTION'] as const),
  TONU: Object.freeze(['AUTO_CREATE_TONU_ACCESSORIAL', 'AUTO_GENERATE_INVOICE'] as const),
});

// ---------------------------------------------------------------------------
// validateTransition context and result types
// ---------------------------------------------------------------------------

export interface LoadSnapshot {
  carrierId?: string | null;
  driverId?: string | null;
  vehicleId?: string | null;
  rateConReceivedAt?: Date | null;
  bolSignedAt?: Date | null;
  stops?: readonly {
    sequence: number;
    schedulingType: string;
    appointmentNumber: string | null;
  }[];
}

export interface TransitionContext {
  userRole: string;
  load: LoadSnapshot;
  notes?: string;
}

export interface TransitionResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

// ---------------------------------------------------------------------------
// Prerequisite checks — returns an error string or null
// ---------------------------------------------------------------------------

const checkPrerequisites = (toStatus: LoadStatus, load: LoadSnapshot): string | null => {
  if (toStatus === 'BOOKED' && !load.carrierId) {
    return 'Cannot book load: a carrier must be assigned before booking.';
  }

  if (toStatus === 'DISPATCHED') {
    if (!load.driverId) {
      return 'Cannot dispatch load: a driver must be assigned before dispatching.';
    }
    if (!load.vehicleId) {
      return 'Cannot dispatch load: a vehicle must be assigned before dispatching.';
    }
    if (load.rateConReceivedAt === null || load.rateConReceivedAt === undefined) {
      return 'Cannot dispatch load: a broker rate confirmation must be on file before dispatching.';
    }
  }

  return null;
};

// ---------------------------------------------------------------------------
// validateTransition — pure function
// ---------------------------------------------------------------------------

export const validateTransition = (
  fromStatus: LoadStatus,
  toStatus: LoadStatus,
  context: TransitionContext,
): TransitionResult => {
  const allowed = TRANSITIONS[fromStatus];

  // 1. Check whether the transition is in the map at all
  if (!allowed.includes(toStatus)) {
    const allowedList = allowed.length > 0 ? allowed.join(', ') : 'none';
    return {
      valid: false,
      error: `Cannot transition from ${fromStatus} to ${toStatus}. Allowed: ${allowedList}`,
    };
  }

  // 2. ADMIN-only check
  if (
    (ADMIN_ONLY_TRANSITIONS as readonly string[]).includes(toStatus) &&
    context.userRole !== 'ADMIN'
  ) {
    return {
      valid: false,
      error: `Transitioning to ${toStatus} requires ADMIN role.`,
    };
  }

  // 2b. DRIVER-only check — drivers can only advance through the progress chain
  if (
    context.userRole === 'DRIVER' &&
    !(DRIVER_ALLOWED_TRANSITIONS as readonly string[]).includes(toStatus)
  ) {
    return {
      valid: false,
      error:
        'Drivers can only advance load status through: EN_ROUTE_PICKUP, AT_PICKUP, IN_TRANSIT, AT_DELIVERY, DELIVERED',
    };
  }

  // 3. Notes required check
  if ((NOTES_REQUIRED_TRANSITIONS as readonly string[]).includes(toStatus)) {
    const trimmed = context.notes?.trim() ?? '';
    if (trimmed.length === 0) {
      return {
        valid: false,
        error: `Transitioning to ${toStatus} requires notes to be provided.`,
      };
    }
  }

  // 4. Prerequisite checks
  const prerequisiteError = checkPrerequisites(toStatus, context.load);
  if (prerequisiteError !== null) {
    return { valid: false, error: prerequisiteError };
  }

  // 5. Soft warnings
  // BOL_SIGNED on DELIVERED and APPOINTMENT-stop appointmentNumber on DISPATCHED are
  // intentionally NOT enforced here. Invoice readiness is gated downstream by
  // invoiceReadinessSubscriber (BOL); appointmentNumber has no downstream business logic.
  const warnings: string[] = [];

  return {
    valid: true,
    ...(warnings.length > 0 && { warnings }),
  };
};
