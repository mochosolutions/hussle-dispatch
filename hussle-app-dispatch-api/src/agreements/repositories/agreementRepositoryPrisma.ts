import type { Prisma, PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { AgreementRepoPort } from '../types/agreementRepoPort';
import type {
  AgreementTemplateKey,
  CountActivePendingArgs,
  CreateAgreementInput,
  ListAgreementsFilters,
  UpdateAgreementInput,
} from '../types/agreementTypes';

export const agreementRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): AgreementRepoPort => ({
  create: (input: CreateAgreementInput) =>
    prisma.agreement.create({
      data: {
        organizationId: input.organizationId,
        carrierId: input.carrierId,
        templateKey: input.templateKey,
        status: input.status,
        providerName: input.providerName,
        providerSubmissionId: input.providerSubmissionId,
        embedUrl: input.embedUrl,
        embedUrlExpiresAt: input.embedUrlExpiresAt,
        signerName: input.signerName,
        signerEmail: input.signerEmail,
        variables: input.variables,
        createdByUserId: input.createdByUserId,
      },
    }),

  findById: (id: string) => prisma.agreement.findUnique({ where: { id } }),

  findByProviderSubmissionId: (providerSubmissionId: string) =>
    prisma.agreement.findUnique({ where: { providerSubmissionId } }),

  findManyByOrg: async (filters: ListAgreementsFilters) => {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const createdAtRange =
      filters.createdAfter !== undefined || filters.createdBefore !== undefined
        ? {
            createdAt: {
              ...(filters.createdAfter !== undefined && { gte: filters.createdAfter }),
              ...(filters.createdBefore !== undefined && { lte: filters.createdBefore }),
            },
          }
        : {};

    const where: Prisma.AgreementWhereInput = {
      organizationId: filters.organizationId,
      ...(filters.carrierId !== undefined && { carrierId: filters.carrierId }),
      ...(filters.status !== undefined && { status: filters.status }),
      ...(filters.templateKey !== undefined && { templateKey: filters.templateKey }),
      ...createdAtRange,
    };

    const [data, total] = await Promise.all([
      prisma.agreement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.agreement.count({ where }),
    ]);

    return { data, total };
  },

  findLatestForCarrier: (carrierId: string, templateKey: AgreementTemplateKey) =>
    prisma.agreement.findFirst({
      where: { carrierId, templateKey },
      orderBy: { createdAt: 'desc' },
    }),

  findAllSignedForCarrier: (carrierId: string, organizationId: string) =>
    prisma.agreement.findMany({
      where: { carrierId, organizationId, status: 'SIGNED' },
      orderBy: { signedAt: 'desc' },
    }),

  update: (id: string, patch: UpdateAgreementInput) =>
    prisma.agreement.update({ where: { id }, data: patch }),

  findStaleInProgress: (updatedBefore: Date) =>
    prisma.agreement.findMany({
      where: { status: 'PENDING', updatedAt: { lt: updatedBefore } },
    }),

  countActivePending: (args: CountActivePendingArgs) =>
    prisma.agreement.count({
      where: {
        organizationId: args.organizationId,
        carrierId: args.carrierId,
        templateKey: args.templateKey,
        status: 'PENDING',
      },
    }),
});
