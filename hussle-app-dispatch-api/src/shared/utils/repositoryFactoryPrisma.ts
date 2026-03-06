/**
 * Prisma Repository Factory
 *
 * Generic CRUD operations factory for Prisma models with:
 * - 10 streamlined methods using object parameters
 * - Unified many-to-many relationship handling (configuration-driven)
 * - Conditional tenant filtering for multi-tenant support
 * - Transaction support
 * - Type safety
 */

import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';

interface PrismaModelDelegate {
  findFirst: (args: object) => Promise<unknown>;
  findMany: (args: object) => Promise<unknown[]>;
  count: (args: object) => Promise<number>;
  create: (args: object) => Promise<unknown>;
  update: (args: object) => Promise<unknown>;
  updateMany: (args: object) => Promise<{ count: number }>;
  delete: (args: object) => Promise<unknown>;
  deleteMany: (args: object) => Promise<{ count: number }>;
}

const getPrismaModelDelegate = (
  prisma: PrismaClient | PrismaTransaction,
  modelName: string,
): PrismaModelDelegate => {
  const model = (prisma as Record<string, unknown>)[modelName] as
    | PrismaModelDelegate
    | undefined;
  if (!model) {
    throw new Error(`Prisma model "${modelName}" not found`);
  }
  return model;
};

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  docs: T[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface RelationConfig {
  name: string;
  foreignKey: string;
}

export interface FactoryOptions {
  relations?: RelationConfig[];
}

export interface FindOneParams {
  filter: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
}

export interface FindManyParams {
  filter?: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
  orderBy?: Record<string, unknown> | Record<string, unknown>[];
}

export interface FindManyPaginatedParams {
  filter?: Record<string, unknown>;
  pagination?: PaginationOptions;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
  orderBy?: Record<string, unknown> | Record<string, unknown>[];
}

export interface CountParams {
  filter?: Record<string, unknown>;
}

export interface CreateParams {
  data: Record<string, unknown> | object;
  include?: Record<string, unknown>;
}

export interface UpdateParams {
  id: string;
  data: Record<string, unknown>;
  include?: Record<string, unknown>;
}

export interface UpdateManyParams {
  filter: Record<string, unknown>;
  data: Record<string, unknown>;
}

export interface DeleteParams {
  id: string;
}

export interface DeleteManyParams {
  filter: Record<string, unknown>;
}

export interface GenerateUniqueSlugParams {
  baseSlug: string;
  excludeId?: string;
  slugField?: string;
}

export interface RepositoryFactoryConfig {
  prisma: PrismaClient | PrismaTransaction;
  modelName: string;
  tenantId?: string;
  options?: FactoryOptions;
  tenantField?: string;
}

export const repositoryFactoryPrisma = <T = unknown>(config: RepositoryFactoryConfig) => {
  const { prisma, modelName, tenantId, options, tenantField = 'organizationId' } = config;
  const model = getPrismaModelDelegate(prisma, modelName);
  const relations = options?.relations ?? [];

  const applyTenantFilter = (
    where: Record<string, unknown> = {},
  ): Record<string, unknown> => {
    if (tenantId) {
      return { ...where, [tenantField]: tenantId };
    }
    return where;
  };

  const extractRelationFields = (
    data: Record<string, unknown> | object,
  ): {
    entityData: Record<string, unknown>;
    relationData: Map<RelationConfig, string[]>;
  } => {
    const entityData: Record<string, unknown> = {};
    const relationData = new Map<RelationConfig, string[]>();

    Object.entries(data).forEach(([key, value]) => {
      const relationConfig = relations.find((r) => r.name === key);
      if (relationConfig && Array.isArray(value)) {
        relationData.set(relationConfig, value as string[]);
      } else {
        entityData[key] = value;
      }
    });

    return { entityData, relationData };
  };

  const buildRelationCreateData = (
    relationData: Map<RelationConfig, string[]>,
  ): Record<string, unknown> => {
    const result: Record<string, unknown> = {};

    relationData.forEach((ids, config) => {
      result[config.name] = {
        create: ids.map((id) => ({
          [config.foreignKey.replace('Id', '')]: { connect: { id } },
        })),
      };
    });

    return result;
  };

  const buildRelationUpdateData = (
    relationData: Map<RelationConfig, string[]>,
  ): Record<string, unknown> => {
    const result: Record<string, unknown> = {};

    relationData.forEach((ids, config) => {
      result[config.name] = {
        deleteMany: {},
        create: ids.map((id) => ({
          [config.foreignKey.replace('Id', '')]: { connect: { id } },
        })),
      };
    });

    return result;
  };

  return {
    findOne: async (params: FindOneParams): Promise<T | null> => {
      const { filter, include, select } = params;
      const where = applyTenantFilter(filter);

      try {
        const record = await model.findFirst({
          where,
          ...(include && { include }),
          ...(select && { select }),
        });
        return record as T | null;
      } catch {
        return null;
      }
    },

    findMany: async (params: FindManyParams = {}): Promise<T[]> => {
      const { filter = {}, include, select, orderBy } = params;
      const where = applyTenantFilter(filter);

      const records = await model.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        ...(include && { include }),
        ...(select && { select }),
        ...(orderBy && { orderBy }),
      });

      return records as T[];
    },

    findManyPaginated: async (
      params: FindManyPaginatedParams = {},
    ): Promise<PaginatedResult<T>> => {
      const { filter = {}, pagination = {}, include, select, orderBy } = params;
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;
      const where = applyTenantFilter(filter);

      const [records, totalDocs] = await Promise.all([
        model.findMany({
          where: Object.keys(where).length > 0 ? where : undefined,
          skip,
          take: limit,
          ...(include && { include }),
          ...(select && { select }),
          ...(orderBy && { orderBy }),
        }),
        model.count({
          where: Object.keys(where).length > 0 ? where : undefined,
        }),
      ]);

      return {
        docs: records as T[],
        totalDocs,
        totalPages: Math.ceil(totalDocs / limit),
        page,
        limit,
      };
    },

    count: async (params: CountParams = {}): Promise<number> => {
      const { filter = {} } = params;
      const where = applyTenantFilter(filter);

      return model.count({
        where: Object.keys(where).length > 0 ? where : undefined,
      });
    },

    create: async (params: CreateParams): Promise<T> => {
      const { data, include } = params;
      const { entityData, relationData } = extractRelationFields(data as Record<string, unknown>);

      const createData: Record<string, unknown> = {
        ...entityData,
        ...(tenantId && { [tenantField]: tenantId }),
        ...buildRelationCreateData(relationData),
      };

      const record = await model.create({
        data: createData,
        ...(include && { include }),
      });

      return record as T;
    },

    update: async (params: UpdateParams): Promise<T | null> => {
      const { id, data, include } = params;
      const { entityData, relationData } = extractRelationFields(data);

      const updateData: Record<string, unknown> = {
        ...entityData,
        ...buildRelationUpdateData(relationData),
      };

      try {
        const record = await model.update({
          where: applyTenantFilter({ id }),
          data: updateData,
          ...(include && { include }),
        });
        return record as T;
      } catch {
        return null;
      }
    },

    updateMany: async (params: UpdateManyParams): Promise<number> => {
      const { filter, data } = params;
      const where = applyTenantFilter(filter);

      const result = await model.updateMany({
        where,
        data,
      });

      return result.count;
    },

    delete: async (params: DeleteParams): Promise<T | null> => {
      const { id } = params;

      try {
        const record = await model.delete({
          where: applyTenantFilter({ id }),
        });
        return record as T;
      } catch {
        return null;
      }
    },

    deleteMany: async (params: DeleteManyParams): Promise<number> => {
      const { filter } = params;
      const where = applyTenantFilter(filter);

      const result = await model.deleteMany({
        where,
      });

      return result.count;
    },

    generateUniqueSlug: async (params: GenerateUniqueSlugParams): Promise<string> => {
      const { baseSlug, excludeId, slugField = 'slug' } = params;

      let slug = baseSlug;
      let counter = 1;
      let exists = true;

      while (exists) {
        const where: Record<string, unknown> = { [slugField]: slug };

        if (excludeId) {
          where['id'] = { not: excludeId };
        }

        const existingRecord = await model.findFirst({ where });
        exists = Boolean(existingRecord);

        if (exists) {
          slug = `${baseSlug}-${counter}`;
          counter += 1;
        }
      }

      return slug;
    },
  };
};

export type PrismaRepository<T> = ReturnType<typeof repositoryFactoryPrisma<T>>;
