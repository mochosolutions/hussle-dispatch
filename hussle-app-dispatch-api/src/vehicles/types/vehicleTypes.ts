import type {
  ExpenseCategory,
  LoadStatus,
  Prisma,
  TruckExpense,
  Vehicle,
  EquipmentType,
  VehicleOwnership,
} from '@prisma/client';
import type { SortOrder } from '@/shared/pagination';
import type { PaginationMeta } from '@/shared/responseEnvelope';

export interface VehicleExpenseInput {
  category: ExpenseCategory;
  expenseKey: string;
  label: string;
  monthlyAmount?: string | number;
}

export interface CreateVehicleInput {
  carrierId: string;
  unitNumber: string;
  type: EquipmentType;
  ownership?: VehicleOwnership;
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  licensePlate?: string;
  licensePlateState?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  warrantyInfo?: string;
  monthlyGrossTarget?: string | number;
  monthlyMilesTarget?: number;
  workingDaysPerMonth?: number;
  isActive?: boolean;
  notes?: string;
}

export interface UpdateVehicleDataInput {
  carrierId?: string;
  unitNumber?: string;
  type?: EquipmentType;
  ownership?: VehicleOwnership;
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  licensePlate?: string;
  licensePlateState?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  warrantyInfo?: string;
  monthlyGrossTarget?: string | number;
  monthlyMilesTarget?: number;
  workingDaysPerMonth?: number;
  isActive?: boolean;
  notes?: string;
}

export interface UpdateVehicleInput extends UpdateVehicleDataInput {
  expenses?: VehicleExpenseInput[];
}

export interface VehicleListFilters {
  carrierId?: string;
  search?: string;
}

export interface VehicleQueryInput {
  organizationId: string;
  filters: VehicleListFilters;
}

export type VehicleWithExpenses = Prisma.VehicleGetPayload<{
  include: {
    expenses: true;
  };
}>;

export interface ListVehiclesRepositoryInput extends VehicleQueryInput {
  skip: number;
  take: number;
  orderBy: Record<string, SortOrder>;
}

export interface VehicleRepositoryPort {
  create(input: CreateVehicleInput): Promise<VehicleWithExpenses>;
  findById(id: string, organizationId: string): Promise<VehicleWithExpenses | null>;
  list(input: ListVehiclesRepositoryInput): Promise<VehicleWithExpenses[]>;
  count(input: VehicleQueryInput): Promise<number>;
  update(id: string, input: UpdateVehicleDataInput): Promise<VehicleWithExpenses>;
  replaceExpenses(vehicleId: string, expenses: VehicleExpenseInput[]): Promise<void>;
  createExpense(vehicleId: string, expense: VehicleExpenseInput): Promise<TruckExpense>;
  findExpensesByVehicleId(vehicleId: string): Promise<TruckExpense[]>;
  softDelete(id: string, deletedAt: Date): Promise<void>;
  assignDriver(vehicleId: string, driverId: string): Promise<VehicleWithExpenses>;
  unassignDriver(vehicleId: string): Promise<VehicleWithExpenses>;
  findByDriverId(driverId: string): Promise<VehicleWithExpenses | null>;
}

export interface CarrierRepositoryPort {
  findActiveByIdForOrg(carrierId: string, organizationId: string): Promise<boolean>;
}

export interface LoadRepositoryPort {
  findBlockingLoadIdsByDriver(
    driverId: string,
    statuses: readonly LoadStatus[],
    limit: number,
  ): Promise<string[]>;
  findBlockingLoadIdsByVehicle(
    vehicleId: string,
    statuses: readonly LoadStatus[],
    limit: number,
  ): Promise<string[]>;
  countActiveByVehicleIds(
    vehicleIds: string[],
    orgId: string,
  ): Promise<Map<string, number>>;
}

export interface VehicleListItem extends VehicleWithExpenses {
  activeLoadCount: number;
}

export interface ListVehiclesResult {
  data: VehicleListItem[];
  meta: PaginationMeta;
}

export interface DriverQueryPort {
  findById(
    driverId: string,
    organizationId: string,
  ): Promise<{ id: string; carrierId: string } | null>;
}

export type VehicleResponse = Vehicle & {
  expenses: VehicleWithExpenses['expenses'];
};
