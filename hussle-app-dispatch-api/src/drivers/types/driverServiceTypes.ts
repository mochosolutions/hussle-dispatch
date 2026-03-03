import type { ParsedQs } from 'qs';
import type {
  CreateDriverInput,
  DriverListFilters,
  ListDriversResult,
  UpdateDriverInput,
} from './driverTypes';
import type { Driver } from '@prisma/client';

export interface CreateDriverServiceInput {
  organizationId: string;
  role: string;
  input: CreateDriverInput;
}

export interface ListDriversServiceInput {
  query: ParsedQs;
  organizationId: string;
  role: string;
  filters: DriverListFilters;
}

export interface GetDriverByIdServiceInput {
  id: string;
  organizationId: string;
  role: string;
}

export interface UpdateDriverServiceInput {
  id: string;
  organizationId: string;
  role: string;
  input: UpdateDriverInput;
}

export interface DeleteDriverServiceInput {
  id: string;
  organizationId: string;
  role: string;
}

export interface DriverService {
  createDriver(input: CreateDriverServiceInput): Promise<Driver>;
  listDrivers(input: ListDriversServiceInput): Promise<ListDriversResult>;
  getDriverById(input: GetDriverByIdServiceInput): Promise<Driver>;
  updateDriver(input: UpdateDriverServiceInput): Promise<Driver>;
  deleteDriver(input: DeleteDriverServiceInput): Promise<void>;
}
