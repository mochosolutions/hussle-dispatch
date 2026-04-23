import type { SchedulingType, Stop, StopType } from '@prisma/client';

// ---------------------------------------------------------------------------
// Create stop input
// ---------------------------------------------------------------------------

export interface CreateStopInput {
  organizationId: string;
  loadId: string;
  type: StopType;
  sequence?: number;
  contactId?: string;
  placeId?: string;
  facilityName?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  schedulingType?: SchedulingType;
  appointmentStart: Date | string;
  appointmentEnd?: Date | string | null;
  notificationHours?: number | null;
  appointmentNumber?: string;
  contactName?: string;
  contactPhone?: string;
  commodity?: string;
  weight?: number;
  pieceCount?: number;
  isHazmat?: boolean;
  isTarp?: boolean;
  isTempControlled?: boolean;
  notes?: string;
  callByTime?: string;
  trailerNumber?: string;
  yardLocation?: string;
}

// ---------------------------------------------------------------------------
// Update stop input
// ---------------------------------------------------------------------------

export interface UpdateStopInput {
  id: string;
  organizationId: string;
  type?: StopType;
  sequence?: number;
  contactId?: string;
  placeId?: string;
  facilityName?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  schedulingType?: SchedulingType;
  appointmentStart?: Date | string;
  appointmentEnd?: Date | string | null;
  notificationHours?: number | null;
  appointmentNumber?: string;
  arrivalTime?: Date;
  departureTime?: Date;
  contactName?: string;
  contactPhone?: string;
  commodity?: string;
  weight?: number;
  pieceCount?: number;
  isHazmat?: boolean;
  isTarp?: boolean;
  isTempControlled?: boolean;
  notes?: string;
  callByTime?: string;
  trailerNumber?: string;
  yardLocation?: string;
}

// ---------------------------------------------------------------------------
// Reorder stops input
// ---------------------------------------------------------------------------

export interface ReorderStopsInput {
  organizationId: string;
  loadId: string;
  stopOrder: { id: string; sequence: number }[];
}

// ---------------------------------------------------------------------------
// Repo port
// ---------------------------------------------------------------------------

export interface StopRepoPort {
  create(input: CreateStopInput): Promise<Stop>;
  update(input: UpdateStopInput): Promise<Stop>;
  delete(id: string, organizationId: string): Promise<void>;
  findById(id: string, organizationId: string): Promise<Stop | null>;
  findByLoadId(loadId: string, organizationId: string): Promise<Stop[]>;
  reorder(input: ReorderStopsInput): Promise<void>;
}
