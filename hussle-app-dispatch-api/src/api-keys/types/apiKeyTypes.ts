import type { OrgApiKey } from '@prisma/client';

export type ApiKeyRecord = Pick<
  OrgApiKey,
  | 'id'
  | 'organizationId'
  | 'name'
  | 'keyPrefix'
  | 'lastUsedAt'
  | 'revokedAt'
  | 'createdAt'
  | 'updatedAt'
>;

export interface GenerateApiKeyInput {
  organizationId: string;
  name: string;
}

export interface GenerateApiKeyResult {
  key: string;
  record: ApiKeyRecord;
}

export interface VerifyApiKeyResult {
  organizationId: string;
}

export interface ApiKeyVerifyLookup {
  id: string;
  organizationId: string;
  keyHash: string;
  revokedAt: Date | null;
}

export interface CreateApiKeyRepoInput {
  organizationId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
}

export interface ApiKeyRepoPort {
  create(data: CreateApiKeyRepoInput): Promise<ApiKeyRecord>;
  findByPrefix(prefix: string): Promise<ApiKeyVerifyLookup | null>;
  findById(id: string): Promise<ApiKeyRecord | null>;
  listByOrg(organizationId: string): Promise<ApiKeyRecord[]>;
  markRevoked(id: string): Promise<ApiKeyRecord>;
  touchLastUsed(id: string): Promise<void>;
}
