import type { EquipmentType } from '@prisma/client';

export interface LoadSchedulerStop {
  sequence: number;
  appointmentStart: Date | null;
  appointmentEnd: Date | null;
  departureTime: Date | null;
  type: string;
  city: string | null;
  state: string | null;
}

export interface LoadForScheduling {
  id: string;
  loadNumber: string;
  organizationId: string;
  driverId: string | null;
  status: string;
  equipmentType: EquipmentType | null;
  stops: LoadSchedulerStop[];
}

export interface LoadSchedulerQueryPort {
  findForScheduling(loadId: string): Promise<LoadForScheduling | null>;
}
