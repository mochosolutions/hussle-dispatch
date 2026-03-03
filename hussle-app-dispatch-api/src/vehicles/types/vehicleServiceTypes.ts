import type { ParsedQs } from 'qs';
import type {
  CreateVehicleInput,
  ListVehiclesResult,
  UpdateVehicleInput,
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

export interface VehicleService {
  createVehicle(input: CreateVehicleServiceInput): Promise<VehicleWithExpenses>;
  listVehicles(input: ListVehiclesServiceInput): Promise<ListVehiclesResult>;
  getVehicleById(input: GetVehicleByIdServiceInput): Promise<VehicleWithExpenses>;
  updateVehicle(input: UpdateVehicleServiceInput): Promise<VehicleWithExpenses>;
  deleteVehicle(input: DeleteVehicleServiceInput): Promise<void>;
}
