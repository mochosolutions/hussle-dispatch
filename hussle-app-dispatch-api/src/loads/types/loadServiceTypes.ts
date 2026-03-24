import type { ParsedQs } from 'qs';
import type {
  AssignLoadResult,
  LoadAssignmentInput,
  CreateLoadInput,
  UpdateLoadInput,
  LoadListFilters,
  LoadWithRelations,
  ListLoadsResult,
  CreateCheckCallInput,
  CheckCallWithUser,
  StatusHistoryWithUser,
  LoadDocument,
} from './loadTypes';

export interface CreateLoadServiceInput {
  organizationId: string;
  role: string;
  input: CreateLoadInput;
}

export interface ListLoadsServiceInput {
  query: ParsedQs;
  organizationId: string;
  filters: LoadListFilters;
  role: string;
}

export interface GetLoadByIdServiceInput {
  id: string;
  organizationId: string;
  role: string;
}

export interface UpdateLoadServiceInput {
  id: string;
  organizationId: string;
  input: UpdateLoadInput;
  role: string;
}

export interface AssignLoadServiceInput {
  id: string;
  organizationId: string;
  input: LoadAssignmentInput;
  role: string;
}

export interface DeleteLoadServiceInput {
  id: string;
  organizationId: string;
  role: string;
}

export interface CreateCheckCallServiceInput {
  loadId: string;
  organizationId: string;
  userId: string;
  input: CreateCheckCallInput;
}

export interface ListCheckCallsServiceInput {
  loadId: string;
  organizationId: string;
}

export interface ListStatusHistoryServiceInput {
  loadId: string;
  organizationId: string;
}

export interface ListLoadDocumentsServiceInput {
  loadId: string;
  organizationId: string;
}

export interface LoadService {
  createLoad(input: CreateLoadServiceInput): Promise<LoadWithRelations>;
  listLoads(input: ListLoadsServiceInput): Promise<ListLoadsResult>;
  getLoadById(input: GetLoadByIdServiceInput): Promise<LoadWithRelations>;
  updateLoad(input: UpdateLoadServiceInput): Promise<LoadWithRelations>;
  assignLoad(input: AssignLoadServiceInput): Promise<AssignLoadResult>;
  deleteLoad(input: DeleteLoadServiceInput): Promise<void>;
  createCheckCall(input: CreateCheckCallServiceInput): Promise<CheckCallWithUser>;
  listCheckCalls(input: ListCheckCallsServiceInput): Promise<CheckCallWithUser[]>;
  listStatusHistory(input: ListStatusHistoryServiceInput): Promise<StatusHistoryWithUser[]>;
  listLoadDocuments(input: ListLoadDocumentsServiceInput): Promise<LoadDocument[]>;
}
