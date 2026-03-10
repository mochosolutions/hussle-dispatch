import type { ParsedQs } from 'qs';
import type {
  CarrierListFilters,
  CarrierNoteInput,
  CarrierNoteResponse,
  CarrierServiceOutput,
  CarrierWithAssetsServiceOutput,
  CreateCarrierInput,
  CreateCarrierWithAssetsInput,
  ListCarriersServiceResult,
  UpdateCarrierInput,
} from './carrierTypes';
import type { PaginatedResult } from '@/shared/pagination';

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

export interface ListCarrierNotesServiceInput {
  carrierId: string;
  organizationId: string;
  role: string;
  query: ParsedQs;
}

export interface CreateCarrierNoteServiceInput {
  carrierId: string;
  organizationId: string;
  role: string;
  input: CarrierNoteInput;
}

export interface CarrierService {
  createCarrier(input: CreateCarrierServiceInput): Promise<CarrierServiceOutput>;
  createCarrierWithAssets(
    input: CreateCarrierWithAssetsServiceInput,
  ): Promise<CarrierWithAssetsServiceOutput>;
  listCarriers(input: ListCarriersServiceInput): Promise<ListCarriersServiceResult>;
  getCarrierById(input: GetCarrierByIdServiceInput): Promise<CarrierServiceOutput>;
  updateCarrier(input: UpdateCarrierServiceInput): Promise<CarrierServiceOutput>;
  deleteCarrier(input: DeleteCarrierServiceInput): Promise<void>;
  getCarrierOnboardingStatus(
    input: GetCarrierOnboardingServiceInput,
  ): Promise<{ allowed: boolean; missingDocuments: string[] }>;
  listNotes(input: ListCarrierNotesServiceInput): Promise<PaginatedResult<CarrierNoteResponse>>;
  createNote(input: CreateCarrierNoteServiceInput): Promise<CarrierNoteResponse>;
}
