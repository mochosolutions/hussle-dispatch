import type { Stop, StopType } from '@prisma/client';

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
  appointmentDate?: Date;
  appointmentTime?: string;
  appointmentNumber?: string;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
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
  appointmentDate?: Date;
  appointmentTime?: string;
  appointmentNumber?: string;
  arrivalTime?: Date;
  departureTime?: Date;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
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
  findByLoadId(loadId: string, organizationId: string): Promise<Stop[]>;
  reorder(input: ReorderStopsInput): Promise<void>;
}
