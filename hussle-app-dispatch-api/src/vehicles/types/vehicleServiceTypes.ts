import type { TruckExpense } from '@prisma/client';
import type { ParsedQs } from 'qs';
import type { LoadHistoryResult } from '@/shared/loadQueries';
import type {
  CreateVehicleInput,
  ListVehiclesResult,
  UpdateVehicleInput,
  VehicleExpenseInput,
  VehicleListFilters,
  VehicleWithExpenses,
} from './vehicleTypes';

export interface CreateVehicleServiceInput {
  organizationId: string;
  role: string;
  input: CreateVehicleInput;
}

export interface ListVehiclesServiceInput {
  query: ParsedQs;
  organizationId: string;
  role: string;
  filters: VehicleListFilters;
}

export interface GetVehicleByIdServiceInput {
  id: string;
  organizationId: string;
  role: string;
}

export interface UpdateVehicleServiceInput {
  id: string;
  organizationId: string;
  role: string;
  input: UpdateVehicleInput;
}

export interface DeleteVehicleServiceInput {
  id: string;
  organizationId: string;
  role: string;
}

export interface AssignDriverServiceInput {
  id: string;
  organizationId: string;
  role: string;
  driverId: string;
}

export interface UnassignDriverServiceInput {
  id: string;
  organizationId: string;
  role: string;
}

export interface GetVehicleLoadHistoryServiceInput {
  id: string;
  organizationId: string;
  role: string;
  query: ParsedQs;
}

export interface CreateExpenseServiceInput {
  vehicleId: string;
  organizationId: string;
  role: string;
  input: VehicleExpenseInput;
}

export interface ListExpensesServiceInput {
  vehicleId: string;
  organizationId: string;
  role: string;
}

export interface VehicleService {
  createVehicle(input: CreateVehicleServiceInput): Promise<VehicleWithExpenses>;
  listVehicles(input: ListVehiclesServiceInput): Promise<ListVehiclesResult>;
  getVehicleById(input: GetVehicleByIdServiceInput): Promise<VehicleWithExpenses>;
  updateVehicle(input: UpdateVehicleServiceInput): Promise<VehicleWithExpenses>;
  deleteVehicle(input: DeleteVehicleServiceInput): Promise<void>;
  assignDriver(input: AssignDriverServiceInput): Promise<VehicleWithExpenses>;
  unassignDriver(input: UnassignDriverServiceInput): Promise<VehicleWithExpenses>;
  getLoadHistory(input: GetVehicleLoadHistoryServiceInput): Promise<LoadHistoryResult>;
  createExpense(input: CreateExpenseServiceInput): Promise<TruckExpense>;
  listExpenses(input: ListExpensesServiceInput): Promise<TruckExpense[]>;
}
