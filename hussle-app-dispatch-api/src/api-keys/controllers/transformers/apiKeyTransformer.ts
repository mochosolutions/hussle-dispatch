import type { ApiKeyRecord, GenerateApiKeyResult } from '../../types/apiKeyTypes';

export interface ApiKeyResponse {
  id: string;
  organizationId: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiKeyResponse extends ApiKeyResponse {
  key: string;
}

export const apiKeyRecordTransformer = (record: ApiKeyRecord): ApiKeyResponse => ({
  id: record.id,
  organizationId: record.organizationId,
  name: record.name,
  keyPrefix: record.keyPrefix,
  lastUsedAt: record.lastUsedAt ? record.lastUsedAt.toISOString() : null,
  revokedAt: record.revokedAt ? record.revokedAt.toISOString() : null,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

export const createApiKeyTransformer = (
  result: GenerateApiKeyResult,
): CreateApiKeyResponse => ({
  key: result.key,
  ...apiKeyRecordTransformer(result.record),
});
