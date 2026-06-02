import type { SchedulingType } from '@prisma/client';

export interface DriverPortalContext {
  loadId: string;
  tokenId: string;
}

export interface DriverPhoneInfo {
  phone: string;
  driverName: string;
}

export interface DriverPortalLoadQueryPort {
  findDriverPhoneByLoadId(loadId: string): Promise<DriverPhoneInfo | null>;
  findLoadForDriverPortal(loadId: string): Promise<DriverPortalLoadSummary | null>;
  findLoadsByDriver(
    driverId: string,
    organizationId: string,
  ): Promise<DriverPortalLoadSummary[]>;
}

export interface DriverPortalLoadSummary {
  id: string;
  organizationId: string;
  driverId: string | null;
  loadNumber: string;
  status: string;
  equipmentType: string | null;
  driverInstructions: string | null;
  stops: DriverPortalStop[];
  driver: {
    firstName: string;
    lastName: string;
  } | null;
}

export interface DriverPortalStop {
  id: string;
  type: string;
  sequence: number;
  facilityName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  appointmentStart: Date | null;
  appointmentEnd: Date | null;
  schedulingType: SchedulingType;
  contactName: string | null;
  contactPhone: string | null;
  commodity: string | null;
  weight: number | null;
  pieceCount: number | null;
  isHazmat: boolean;
  isTarp: boolean;
  isTempControlled: boolean;
  notes: string | null;
}
