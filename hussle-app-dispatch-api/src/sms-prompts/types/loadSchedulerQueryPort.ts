export interface LoadSchedulerStop {
  sequence: number;
  appointmentStart: Date | null;
  appointmentEnd: Date | null;
  departureTime: Date | null;
  type: string;
}

export interface LoadForScheduling {
  id: string;
  loadNumber: string;
  organizationId: string;
  driverId: string | null;
  status: string;
  stops: LoadSchedulerStop[];
}

export interface LoadSchedulerQueryPort {
  findForScheduling(loadId: string): Promise<LoadForScheduling | null>;
}
