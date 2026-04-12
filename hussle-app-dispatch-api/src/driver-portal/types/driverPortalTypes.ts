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
}

export interface DriverPortalLoadSummary {
  id: string;
  organizationId: string;
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
  contactName: string | null;
  contactPhone: string | null;
  commodity: string | null;
  weight: number | null;
  pieceCount: number | null;
  isHazmat: boolean;
  isTarp: boolean;
  notes: string | null;
}
