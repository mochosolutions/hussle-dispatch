import type { ParsedQs } from 'qs';
import type {
  CarrierListFilters,
  CarrierWithCounts,
  CreateCarrierInput,
  CreateCarrierWithAssetsInput,
  CarrierWithAssets,
  ListCarriersResult,
  UpdateCarrierInput,
} from './carrierTypes';

export interface CreateCarrierServiceInput {
  organizationId: string;
  role: string;
  input: CreateCarrierInput;
}

export interface CreateCarrierWithAssetsServiceInput {
  organizationId: string;
  role: string;
  input: CreateCarrierWithAssetsInput;
}

export interface ListCarriersServiceInput {
  query: ParsedQs;
  organizationId: string;
  filters: CarrierListFilters;
  role: string;
}

export interface GetCarrierByIdServiceInput {
  id: string;
  organizationId: string;
  role: string;
}

export interface UpdateCarrierServiceInput {
  id: string;
  organizationId: string;
  input: UpdateCarrierInput;
  role: string;
}

export interface DeleteCarrierServiceInput {
  id: string;
  organizationId: string;
  role: string;
}

export interface GetCarrierOnboardingServiceInput {
  id: string;
  organizationId: string;
  role: string;
}

export interface CarrierService {
  createCarrier(input: CreateCarrierServiceInput): Promise<CarrierWithCounts>;
  createCarrierWithAssets(input: CreateCarrierWithAssetsServiceInput): Promise<CarrierWithAssets>;
  listCarriers(input: ListCarriersServiceInput): Promise<ListCarriersResult>;
  getCarrierById(input: GetCarrierByIdServiceInput): Promise<CarrierWithCounts>;
  updateCarrier(input: UpdateCarrierServiceInput): Promise<CarrierWithCounts>;
  deleteCarrier(input: DeleteCarrierServiceInput): Promise<void>;
  getCarrierOnboardingStatus(
    input: GetCarrierOnboardingServiceInput,
  ): Promise<{ allowed: boolean; missingDocuments: string[] }>;
}
