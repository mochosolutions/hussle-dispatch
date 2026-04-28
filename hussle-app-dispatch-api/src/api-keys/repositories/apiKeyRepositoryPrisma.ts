import type { PrismaClient } from '@prisma/client';
import type {
  ApiKeyRecord,
  ApiKeyRepoPort,
  ApiKeyVerifyLookup,
  CreateApiKeyRepoInput,
} from '../types/apiKeyTypes';

const apiKeyRecordSelect = {
  id: true,
  organizationId: true,
  name: true,
  keyPrefix: true,
  lastUsedAt: true,
  revokedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const apiKeyRepositoryPrisma = (prisma: PrismaClient): ApiKeyRepoPort => ({
  create: (data: CreateApiKeyRepoInput): Promise<ApiKeyRecord> =>
    prisma.orgApiKey.create({
      data,
      select: apiKeyRecordSelect,
    }),

  findByPrefix: (prefix: string): Promise<ApiKeyVerifyLookup | null> =>
    prisma.orgApiKey.findFirst({
      where: { keyPrefix: prefix, revokedAt: null },
      select: {
        id: true,
        organizationId: true,
        keyHash: true,
        revokedAt: true,
      },
    }),

  findById: (id: string): Promise<ApiKeyRecord | null> =>
    prisma.orgApiKey.findUnique({
      where: { id },
      select: apiKeyRecordSelect,
    }),

  listByOrg: (organizationId: string): Promise<ApiKeyRecord[]> =>
    prisma.orgApiKey.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: apiKeyRecordSelect,
    }),

  markRevoked: (id: string): Promise<ApiKeyRecord> =>
    prisma.orgApiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
      select: apiKeyRecordSelect,
    }),

  touchLastUsed: async (id: string): Promise<void> => {
    await prisma.orgApiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  },
});
