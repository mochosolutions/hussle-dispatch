export interface DriverForMessaging {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

export interface DriverQueryPort {
  findById(driverId: string): Promise<DriverForMessaging | null>;
}
