export interface PendingCarriersPort {
  listPending(
    organizationId: string,
    page: number,
    limit: number,
  ): Promise<{ data: PendingCarrier[]; total: number }>;
}

export interface PendingCarrier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: string;
  status: string;
  entryMethod: string | null;
  completedAt: Date | null;
  inviteSentAt: Date | null;
  driverCount: number;
  vehicleCount: number;
}
