#!/usr/bin/env ts-node
import 'dotenv/config';

import { DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { s3Client } from '../config/s3';
import { redisClient } from '../shared/redisClient';
import {
  buildTenantCleanupPlan,
  getDefaultTenantScopeFieldNames,
  TenantCleanupPlanError,
} from '../shared/utils/tenantCleanupPlan';
import { Prisma } from '@prisma/client';

type PrismaModel = (typeof Prisma.dmmf.datamodel.models)[number];

interface ScriptOptions {
  isDryRun: boolean;
  isForce: boolean;
  skipS3: boolean;
  skipCache: boolean;
  keepUsers: boolean;
  clearAll: boolean;
  deleteTenantRecord: boolean;
  hardDeleteTenantRecord: boolean;
  tenantSlug?: string;
  tenantId?: string;
  tenantModelName?: string;
  slugFieldName?: string;
  scopeFieldNames: string[];
  skippedModelNames: string[];
  cachePatterns: string[];
  storageModelName?: string;
  storageKeyFieldName: string;
}

interface ResolvedTenant {
  id: string;
  slug: string;
  name: string;
}

interface TenantSummary {
  tenant: ResolvedTenant;
  modelCounts: Record<string, number>;
  orphanedUsers: number;
  storageKeys: number;
  cacheKeys: number;
  tenantRecordAction: 'none' | 'soft-delete' | 'hard-delete';
}

interface CleanupSummary {
  tenants: TenantSummary[];
  modelTotals: Record<string, number>;
  orphanedUsers: number;
  storageKeys: number;
  cacheKeys: number;
}

interface PrismaModelDelegate {
  count: (args?: { where?: Record<string, unknown> }) => Promise<unknown>;
  deleteMany: (args: { where?: Record<string, unknown> }) => Promise<unknown>;
  findMany: (args?: {
    where?: Record<string, unknown>;
    select?: Record<string, boolean>;
  }) => Promise<unknown>;
  update: (args: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }) => Promise<unknown>;
}

class ScriptUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScriptUsageError';
  }
}

class ScriptExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScriptExecutionError';
  }
}

const writeLine = (message = ''): void => {
  process.stdout.write(`${message}\n`);
};

const writeErrorLine = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isCallable = (value: unknown): value is (...args: unknown[]) => unknown =>
  typeof value === 'function';

const isIdRow = (value: unknown): value is { id: string } =>
  isRecord(value) && typeof value.id === 'string';

const hasIdField = (value: unknown): value is Record<string, unknown> & { id: string } =>
  isRecord(value) && typeof value.id === 'string';

const isDeleteManyResult = (value: unknown): value is { count: number } =>
  isRecord(value) && typeof value.count === 'number';

const hasStringField = <TFieldName extends string>(
  value: unknown,
  fieldName: TFieldName,
): value is Record<TFieldName, string> => isRecord(value) && typeof value[fieldName] === 'string';

const lowerFirstCharacter = (value: string): string =>
  `${value.charAt(0).toLowerCase()}${value.slice(1)}`;

const getFlagValues = (args: string[], flag: string): string[] => {
  const values: string[] = [];

  args.forEach((arg, index) => {
    if (arg !== flag) {
      return;
    }

    const value = args[index + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new ScriptUsageError(`Missing value for ${flag}`);
    }

    values.push(value);
  });

  return values;
};

const getSingleFlagValue = (args: string[], flag: string): string | undefined => {
  const values = getFlagValues(args, flag);
  if (values.length > 1) {
    throw new ScriptUsageError(`Expected a single value for ${flag}`);
  }
  return values[0];
};

const parseOptions = (args: string[]): ScriptOptions => {
  const tenantSlug = getSingleFlagValue(args, '--tenant');
  const tenantId = getSingleFlagValue(args, '--tenant-id');
  const tenantModelName = getSingleFlagValue(args, '--tenant-model');
  const slugFieldName = getSingleFlagValue(args, '--slug-field');
  const storageModelName = getSingleFlagValue(args, '--storage-model');
  const storageKeyFieldName = getSingleFlagValue(args, '--storage-key-field') ?? 's3Key';
  const scopeFieldNames = [
    ...getDefaultTenantScopeFieldNames(),
    ...getFlagValues(args, '--scope-field'),
  ].filter((value, index, values) => values.indexOf(value) === index);
  const skippedModelNames = getFlagValues(args, '--skip-model');
  const cachePatterns = getFlagValues(args, '--cache-pattern');
  const clearAll = args.includes('--all');
  const deleteTenantRecord = args.includes('--delete-tenant-record');
  const hardDeleteTenantRecord = args.includes('--hard-delete-tenant-record');

  if (!clearAll && tenantSlug === undefined && tenantId === undefined) {
    throw new ScriptUsageError('Specify --all, --tenant <slug>, or --tenant-id <id>.');
  }

  if (clearAll && (tenantSlug !== undefined || tenantId !== undefined)) {
    throw new ScriptUsageError('Cannot combine --all with --tenant or --tenant-id.');
  }

  if (tenantSlug !== undefined && tenantId !== undefined) {
    throw new ScriptUsageError('Cannot combine --tenant with --tenant-id.');
  }

  if (hardDeleteTenantRecord && !deleteTenantRecord) {
    throw new ScriptUsageError(
      'Use --delete-tenant-record together with --hard-delete-tenant-record.',
    );
  }

  return {
    isDryRun: args.includes('--dry-run'),
    isForce: args.includes('--force'),
    skipS3: args.includes('--skip-s3'),
    skipCache: args.includes('--skip-cache'),
    keepUsers: args.includes('--keep-users'),
    clearAll,
    deleteTenantRecord,
    hardDeleteTenantRecord,
    tenantSlug,
    tenantId,
    tenantModelName,
    slugFieldName,
    scopeFieldNames,
    skippedModelNames,
    cachePatterns,
    storageModelName,
    storageKeyFieldName,
  };
};

const getModelByName = (modelName: string): PrismaModel => {
  const model = Prisma.dmmf.datamodel.models.find((candidate) => candidate.name === modelName);
  if (model === undefined) {
    throw new ScriptExecutionError(`Prisma model not found: ${modelName}`);
  }
  return model;
};

const getModelDelegate = (modelName: string): PrismaModelDelegate => {
  const delegateName = lowerFirstCharacter(modelName);
  const delegate = Reflect.get(prisma, delegateName);

  if (!isRecord(delegate)) {
    throw new ScriptExecutionError(`Prisma delegate not found for model: ${modelName}`);
  }

  const countFn = delegate.count;
  const deleteManyFn = delegate.deleteMany;
  const findManyFn = delegate.findMany;
  const updateFn = delegate.update;

  if (
    !isCallable(countFn) ||
    !isCallable(deleteManyFn) ||
    !isCallable(findManyFn) ||
    !isCallable(updateFn)
  ) {
    throw new ScriptExecutionError(`Prisma delegate is missing methods for model: ${modelName}`);
  }

  return {
    count: (args) => Promise.resolve(countFn(args)),
    deleteMany: (args) => Promise.resolve(deleteManyFn(args)),
    findMany: (args) => Promise.resolve(findManyFn(args)),
    update: (args) => Promise.resolve(updateFn(args)),
  };
};

const getRootModelName = (options: ScriptOptions): string => {
  if (options.tenantModelName !== undefined) {
    return options.tenantModelName;
  }

  const plan = buildTenantCleanupPlan({
    scopeFieldNames: options.scopeFieldNames,
    skippedModelNames: options.skippedModelNames,
  });

  return plan.rootModelName;
};

const extractTenantRows = (
  rows: unknown,
  slugFieldName: string | undefined,
  nameFieldName: string | undefined,
): ResolvedTenant[] => {
  if (!Array.isArray(rows)) {
    throw new ScriptExecutionError('Expected Prisma to return an array of tenant rows.');
  }

  return rows.filter(hasIdField).map((row) => {
    const id = row.id;
    const slug =
      slugFieldName !== undefined && typeof row[slugFieldName] === 'string'
        ? row[slugFieldName]
        : id;
    const name =
      nameFieldName !== undefined && typeof row[nameFieldName] === 'string'
        ? row[nameFieldName]
        : slug;

    return {
      id,
      slug,
      name,
    };
  });
};

const resolveTenants = async (
  rootModelName: string,
  options: ScriptOptions,
): Promise<ResolvedTenant[]> => {
  const rootModel = getModelByName(rootModelName);
  const rootDelegate = getModelDelegate(rootModelName);
  const hasSlugField = rootModel.fields.some(
    (field) => field.name === (options.slugFieldName ?? 'slug'),
  );
  const slugFieldName = hasSlugField ? (options.slugFieldName ?? 'slug') : undefined;
  const nameFieldName = rootModel.fields.some((field) => field.name === 'name')
    ? 'name'
    : undefined;
  const select: Record<string, boolean> = { id: true };

  if (slugFieldName !== undefined) {
    select[slugFieldName] = true;
  }

  if (nameFieldName !== undefined) {
    select[nameFieldName] = true;
  }

  let where: Record<string, unknown> | undefined;

  if (options.clearAll) {
    if (rootModel.fields.some((field) => field.name === 'deleted')) {
      where = { deleted: false };
    }
  } else if (options.tenantId !== undefined) {
    where = { id: options.tenantId };
  } else if (options.tenantSlug !== undefined) {
    if (slugFieldName === undefined) {
      throw new ScriptUsageError(
        `The root model ${rootModelName} does not have a slug field. Use --tenant-id instead.`,
      );
    }
    where = { [slugFieldName]: options.tenantSlug };
  }

  const rows = await rootDelegate.findMany({ where, select });
  const tenants = extractTenantRows(rows, slugFieldName, nameFieldName);

  if (!options.clearAll && tenants.length === 0) {
    throw new ScriptExecutionError('No matching tenant was found.');
  }

  return tenants;
};

const buildIdSelect = (): Record<string, boolean> => ({ id: true });

const extractIds = (rows: unknown): string[] => {
  if (!Array.isArray(rows)) {
    throw new ScriptExecutionError('Expected Prisma to return an array of ID rows.');
  }

  const ids = rows.filter(isIdRow).map((row) => row.id);
  return ids.filter((id, index, values) => values.indexOf(id) === index);
};

const resolveModelIdsForTenant = async (
  modelName: string,
  tenantId: string,
  includedModelNames: Set<string>,
  scopeFieldNames: Set<string>,
  cache: Map<string, string[]>,
  activeModelNames: Set<string>,
  rootModelName: string,
): Promise<string[]> => {
  const cachedIds = cache.get(modelName);
  if (cachedIds !== undefined) {
    return cachedIds;
  }

  if (activeModelNames.has(modelName)) {
    return [];
  }

  activeModelNames.add(modelName);

  try {
    const model = getModelByName(modelName);
    const delegate = getModelDelegate(modelName);
    const whereClauses: Record<string, unknown>[] = [];

    if (modelName === rootModelName) {
      whereClauses.push({ id: tenantId });
    }

    model.fields.forEach((field) => {
      if (field.kind === 'scalar' && scopeFieldNames.has(field.name)) {
        whereClauses.push({ [field.name]: tenantId });
      }
    });

    for (const field of model.fields) {
      const relationFromFields = field.relationFromFields ?? [];
      if (
        field.kind !== 'object' ||
        relationFromFields.length !== 1 ||
        !includedModelNames.has(field.type)
      ) {
        continue;
      }

      const parentIds = await resolveModelIdsForTenant(
        field.type,
        tenantId,
        includedModelNames,
        scopeFieldNames,
        cache,
        activeModelNames,
        rootModelName,
      );
      const relationFieldName = relationFromFields[0];

      if (relationFieldName !== undefined && parentIds.length > 0) {
        whereClauses.push({
          [relationFieldName]: { in: parentIds },
        });
      }
    }

    if (whereClauses.length === 0) {
      cache.set(modelName, []);
      return [];
    }

    const where = whereClauses.length === 1 ? whereClauses[0] : { OR: whereClauses };
    const rows = await delegate.findMany({ where, select: buildIdSelect() });
    const ids = extractIds(rows);
    cache.set(modelName, ids);
    return ids;
  } finally {
    activeModelNames.delete(modelName);
  }
};

const collectTenantModelIds = async (
  tenantId: string,
  includedModelNames: string[],
  scopeFieldNames: string[],
  rootModelName: string,
): Promise<Map<string, string[]>> => {
  const idsByModel = new Map<string, string[]>();
  const includedModelNamesSet = new Set(includedModelNames);
  const scopeFieldNamesSet = new Set(scopeFieldNames);

  for (const modelName of includedModelNames) {
    const ids = await resolveModelIdsForTenant(
      modelName,
      tenantId,
      includedModelNamesSet,
      scopeFieldNamesSet,
      idsByModel,
      new Set<string>(),
      rootModelName,
    );
    idsByModel.set(modelName, ids);
  }

  return idsByModel;
};

const getOrphanedUserIds = async (
  tenantId: string,
  membershipIds: string[],
  keepUsers: boolean,
): Promise<string[]> => {
  if (keepUsers || membershipIds.length === 0) {
    return [];
  }

  const membershipModelNames = Prisma.dmmf.datamodel.models.map((model) => model.name);
  if (!membershipModelNames.includes('Membership') || !membershipModelNames.includes('User')) {
    return [];
  }

  const membershipDelegate = getModelDelegate('Membership');
  const membershipRows = await membershipDelegate.findMany({
    where: { id: { in: membershipIds } },
    select: { userId: true },
  });

  if (!Array.isArray(membershipRows)) {
    throw new ScriptExecutionError('Expected membership rows when resolving orphaned users.');
  }

  const userIds = membershipRows
    .filter(isRecord)
    .map((row) => row.userId)
    .filter((userId): userId is string => typeof userId === 'string')
    .filter((userId, index, values) => values.indexOf(userId) === index);

  const orphanedUserIds: string[] = [];

  for (const userId of userIds) {
    const remainingMembershipsResult = await membershipDelegate.count({
      where: {
        userId,
        id: { notIn: membershipIds },
        organizationId: { not: tenantId },
      },
    });

    if (typeof remainingMembershipsResult !== 'number') {
      throw new ScriptExecutionError(
        'Unexpected membership count result while resolving orphaned users.',
      );
    }

    if (remainingMembershipsResult === 0) {
      orphanedUserIds.push(userId);
    }
  }

  return orphanedUserIds;
};

const getStorageKeys = async (
  idsByModel: Map<string, string[]>,
  options: ScriptOptions,
): Promise<string[]> => {
  const modelName = options.storageModelName ?? 'Document';
  const storageIds = idsByModel.get(modelName) ?? [];

  if (storageIds.length === 0) {
    return [];
  }

  const model = getModelByName(modelName);
  if (!model.fields.some((field) => field.name === options.storageKeyFieldName)) {
    return [];
  }

  const delegate = getModelDelegate(modelName);
  const rows = await delegate.findMany({
    where: { id: { in: storageIds } },
    select: { [options.storageKeyFieldName]: true },
  });

  if (!Array.isArray(rows)) {
    throw new ScriptExecutionError('Expected storage rows when resolving storage keys.');
  }

  return rows
    .filter(isRecord)
    .map((row) => row[options.storageKeyFieldName])
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .filter((value, index, values) => values.indexOf(value) === index);
};

const deleteS3Objects = async (keys: string[]): Promise<number> => {
  if (keys.length === 0) {
    return 0;
  }

  if (env.STORAGE_BACKEND === 'local') {
    let deletedCount = 0;
    const basePath = path.resolve(process.cwd(), env.STORAGE_LOCAL_PATH);

    for (const key of keys) {
      const filePath = path.resolve(basePath, key);
      try {
        await unlink(filePath);
        deletedCount += 1;
      } catch (error: unknown) {
        if (isRecord(error) && error.code === 'ENOENT') {
          continue;
        }
        throw new ScriptExecutionError(`Failed to delete local storage object: ${filePath}`);
      }
    }

    return deletedCount;
  }

  if (env.S3_BUCKET.length === 0) {
    throw new ScriptExecutionError('S3 cleanup requested but S3_BUCKET is not configured.');
  }

  let deletedCount = 0;

  for (let startIndex = 0; startIndex < keys.length; startIndex += 1000) {
    const chunk = keys.slice(startIndex, startIndex + 1000);
    await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: env.S3_BUCKET,
        Delete: {
          Objects: chunk.map((key) => ({ Key: key })),
          Quiet: true,
        },
      }),
    );
    deletedCount += chunk.length;
  }

  return deletedCount;
};

const renderCachePatterns = (tenantId: string, cachePatterns: string[]): string[] => {
  const defaults = [`*:${tenantId}:*`, `*:${tenantId}`, `*${tenantId}*`];
  const patterns = cachePatterns.length > 0 ? cachePatterns : defaults;
  return patterns.map((pattern) => pattern.replaceAll('{tenantId}', tenantId));
};

const scanKeys = async (pattern: string): Promise<string[]> => {
  const matchingKeys: string[] = [];
  let cursor = '0';

  do {
    const result = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
    const nextCursor = result[0];
    const keys = result[1];
    matchingKeys.push(...keys);
    cursor = nextCursor;
  } while (cursor !== '0');

  return matchingKeys;
};

const getCacheKeys = async (tenantId: string, cachePatterns: string[]): Promise<string[]> => {
  const patterns = renderCachePatterns(tenantId, cachePatterns);
  const keySet = new Set<string>();

  for (const pattern of patterns) {
    const matchingKeys = await scanKeys(pattern);
    matchingKeys.forEach((key) => keySet.add(key));
  }

  return Array.from(keySet).sort();
};

const deleteCacheKeys = async (keys: string[]): Promise<number> => {
  if (keys.length === 0) {
    return 0;
  }

  let deletedCount = 0;

  for (let startIndex = 0; startIndex < keys.length; startIndex += 500) {
    const chunk = keys.slice(startIndex, startIndex + 500);
    deletedCount += await redisClient.del(...chunk);
  }

  return deletedCount;
};

const deleteModelRecords = async (modelName: string, ids: string[]): Promise<number> => {
  if (ids.length === 0) {
    return 0;
  }

  const delegate = getModelDelegate(modelName);
  const result = await delegate.deleteMany({ where: { id: { in: ids } } });
  if (!isDeleteManyResult(result)) {
    throw new ScriptExecutionError(`Unexpected deleteMany result for model: ${modelName}`);
  }

  return result.count;
};

const deleteOrphanedUsers = async (userIds: string[]): Promise<number> => {
  if (userIds.length === 0) {
    return 0;
  }

  return deleteModelRecords('User', userIds);
};

const softDeleteTenantRecord = async (
  rootModelName: string,
  tenantId: string,
): Promise<boolean> => {
  const rootModel = getModelByName(rootModelName);
  const rootDelegate = getModelDelegate(rootModelName);
  const hasDeletedField = rootModel.fields.some((field) => field.name === 'deleted');
  const hasDeletedAtField = rootModel.fields.some((field) => field.name === 'deletedAt');

  if (!hasDeletedField && !hasDeletedAtField) {
    return false;
  }

  const data: Record<string, unknown> = {};
  if (hasDeletedField) {
    data.deleted = true;
  }
  if (hasDeletedAtField) {
    data.deletedAt = new Date();
  }

  await rootDelegate.update({ where: { id: tenantId }, data });
  return true;
};

const delay = async (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const printUsage = (): void => {
  writeLine('Usage:');
  writeLine('  npx ts-node src/scripts/clearTenantData.ts --tenant <slug>');
  writeLine('  npx ts-node src/scripts/clearTenantData.ts --tenant-id <id>');
  writeLine('  npx ts-node src/scripts/clearTenantData.ts --all');
  writeLine('');
  writeLine('Options:');
  writeLine('  --dry-run                   Preview without deleting data');
  writeLine('  --force                     Skip the 5 second confirmation delay');
  writeLine('  --skip-s3                   Skip storage cleanup');
  writeLine('  --skip-cache                Skip Redis cleanup');
  writeLine('  --keep-users                Keep users that become membership-orphaned');
  writeLine('  --delete-tenant-record      Soft delete the tenant record when supported');
  writeLine('  --hard-delete-tenant-record Hard delete the tenant record after cleanup');
  writeLine('  --tenant-model <name>       Override the tenant root model');
  writeLine('  --slug-field <name>         Override the tenant slug field');
  writeLine('  --scope-field <name>        Add an extra tenant scope field');
  writeLine('  --skip-model <name>         Exclude a Prisma model from cleanup');
  writeLine('  --cache-pattern <pattern>   Redis pattern, supports {tenantId}');
  writeLine('  --storage-model <name>      Prisma model containing storage keys');
  writeLine('  --storage-key-field <name>  Field name containing the storage key');
};

const printConfiguration = (
  options: ScriptOptions,
  rootModelName: string,
  includedModelNames: string[],
): void => {
  writeLine('');
  writeLine('Configuration:');
  writeLine(`  Mode:                ${options.isDryRun ? 'DRY RUN' : 'LIVE'}`);
  writeLine(
    `  Scope:               ${options.clearAll ? 'ALL TENANTS' : (options.tenantSlug ?? options.tenantId ?? 'unknown')}`,
  );
  writeLine(`  Root model:          ${rootModelName}`);
  writeLine(`  Delete tenant:       ${options.deleteTenantRecord ? 'Yes' : 'No'}`);
  writeLine(`  Hard delete tenant:  ${options.hardDeleteTenantRecord ? 'Yes' : 'No'}`);
  writeLine(`  Skip S3:             ${options.skipS3 ? 'Yes' : 'No'}`);
  writeLine(`  Skip cache:          ${options.skipCache ? 'Yes' : 'No'}`);
  writeLine(`  Keep users:          ${options.keepUsers ? 'Yes' : 'No'}`);
  writeLine(`  Included models:     ${includedModelNames.join(', ')}`);
};

const printTenantSummary = (summary: TenantSummary, options: ScriptOptions): void => {
  writeLine('');
  writeLine(`Tenant: ${summary.tenant.name} (${summary.tenant.slug})`);
  Object.entries(summary.modelCounts)
    .filter(([, count]) => count > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(([modelName, count]) => {
      writeLine(`  ${modelName}: ${count}`);
    });

  if (!options.keepUsers) {
    writeLine(`  Orphaned users: ${summary.orphanedUsers}`);
  }

  writeLine(`  Storage keys: ${options.skipS3 ? 'skipped' : summary.storageKeys}`);
  writeLine(`  Cache keys:   ${options.skipCache ? 'skipped' : summary.cacheKeys}`);
  if (summary.tenantRecordAction !== 'none') {
    writeLine(`  Tenant record: ${summary.tenantRecordAction}`);
  }
};

const printFinalSummary = (summary: CleanupSummary, options: ScriptOptions): void => {
  writeLine('');
  writeLine('Summary:');
  writeLine(`  Tenants processed: ${summary.tenants.length}`);

  Object.entries(summary.modelTotals)
    .filter(([, count]) => count > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(([modelName, count]) => {
      writeLine(`  ${modelName}: ${count}`);
    });

  if (!options.keepUsers) {
    writeLine(`  Orphaned users: ${summary.orphanedUsers}`);
  }

  writeLine(`  Storage keys: ${options.skipS3 ? 'skipped' : summary.storageKeys}`);
  writeLine(`  Cache keys:   ${options.skipCache ? 'skipped' : summary.cacheKeys}`);
};

const buildCleanupSummary = (): CleanupSummary => ({
  tenants: [],
  modelTotals: {},
  orphanedUsers: 0,
  storageKeys: 0,
  cacheKeys: 0,
});

const incrementModelTotal = (summary: CleanupSummary, modelName: string, count: number): void => {
  summary.modelTotals[modelName] = (summary.modelTotals[modelName] ?? 0) + count;
};

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const options = parseOptions(args);
  const rootModelName = getRootModelName(options);
  const plan = buildTenantCleanupPlan({
    rootModelCandidates: [rootModelName],
    scopeFieldNames: options.scopeFieldNames,
    skippedModelNames: options.skippedModelNames,
  });
  const summary = buildCleanupSummary();

  writeLine('CLEAR TENANT DATA');
  printConfiguration(options, rootModelName, plan.includedModelNames);

  const tenants = await resolveTenants(rootModelName, options);
  if (tenants.length === 0) {
    writeLine('');
    writeLine('No tenants matched the requested scope.');
    return;
  }

  let cacheReady = false;
  if (!options.skipCache) {
    try {
      await redisClient.connect();
      cacheReady = true;
    } catch {
      throw new ScriptExecutionError(
        'Failed to connect to Redis. Use --skip-cache to bypass cache cleanup.',
      );
    }
  }

  for (const tenant of tenants) {
    const idsByModel = await collectTenantModelIds(
      tenant.id,
      plan.includedModelNames,
      options.scopeFieldNames,
      plan.rootModelName,
    );
    const orphanedUserIds = await getOrphanedUserIds(
      tenant.id,
      idsByModel.get('Membership') ?? [],
      options.keepUsers,
    );
    const storageKeys = options.skipS3 ? [] : await getStorageKeys(idsByModel, options);
    const cacheKeys =
      !options.skipCache && cacheReady ? await getCacheKeys(tenant.id, options.cachePatterns) : [];
    const modelCounts: Record<string, number> = {};

    plan.includedModelNames.forEach((modelName) => {
      if (modelName === plan.rootModelName && !options.deleteTenantRecord) {
        return;
      }
      modelCounts[modelName] = (idsByModel.get(modelName) ?? []).length;
    });

    const tenantSummary: TenantSummary = {
      tenant,
      modelCounts,
      orphanedUsers: orphanedUserIds.length,
      storageKeys: storageKeys.length,
      cacheKeys: cacheKeys.length,
      tenantRecordAction: options.deleteTenantRecord
        ? options.hardDeleteTenantRecord
          ? 'hard-delete'
          : 'soft-delete'
        : 'none',
    };

    summary.tenants.push(tenantSummary);
    Object.entries(modelCounts).forEach(([modelName, count]) => {
      incrementModelTotal(summary, modelName, count);
    });
    summary.orphanedUsers += orphanedUserIds.length;
    summary.storageKeys += storageKeys.length;
    summary.cacheKeys += cacheKeys.length;

    printTenantSummary(tenantSummary, options);
  }

  if (options.isDryRun) {
    writeLine('');
    writeLine('Dry run complete. No data was deleted.');
    printFinalSummary(summary, options);
    return;
  }

  if (!options.isForce) {
    writeLine('');
    writeLine('This operation will delete all matched tenant-scoped data.');
    writeLine('Waiting 5 seconds. Press Ctrl+C to cancel.');
    await delay(5000);
  }

  for (const tenantSummary of summary.tenants) {
    const tenantId = tenantSummary.tenant.id;
    const idsByModel = await collectTenantModelIds(
      tenantId,
      plan.includedModelNames,
      options.scopeFieldNames,
      plan.rootModelName,
    );
    const orphanedUserIds = await getOrphanedUserIds(
      tenantId,
      idsByModel.get('Membership') ?? [],
      options.keepUsers,
    );
    const storageKeys = options.skipS3 ? [] : await getStorageKeys(idsByModel, options);
    const cacheKeys =
      !options.skipCache && cacheReady ? await getCacheKeys(tenantId, options.cachePatterns) : [];

    writeLine('');
    writeLine(`Deleting tenant data for ${tenantSummary.tenant.slug} (${tenantId})`);

    for (const modelName of plan.deleteOrder) {
      if (modelName === plan.rootModelName && !options.deleteTenantRecord) {
        continue;
      }

      if (
        modelName === plan.rootModelName &&
        options.deleteTenantRecord &&
        !options.hardDeleteTenantRecord
      ) {
        continue;
      }

      const ids = idsByModel.get(modelName) ?? [];
      if (ids.length === 0) {
        continue;
      }

      const deletedCount = await deleteModelRecords(modelName, ids);
      writeLine(`  Deleted ${deletedCount} ${modelName} record(s)`);
    }

    if (!options.keepUsers && orphanedUserIds.length > 0) {
      const deletedUserCount = await deleteOrphanedUsers(orphanedUserIds);
      writeLine(`  Deleted ${deletedUserCount} orphaned User record(s)`);
    }

    if (!options.skipS3 && storageKeys.length > 0) {
      const deletedStorageCount = await deleteS3Objects(storageKeys);
      writeLine(`  Deleted ${deletedStorageCount} storage object(s)`);
    }

    if (!options.skipCache && cacheKeys.length > 0 && cacheReady) {
      const deletedCacheCount = await deleteCacheKeys(cacheKeys);
      writeLine(`  Deleted ${deletedCacheCount} cache key(s)`);
    }

    if (options.deleteTenantRecord) {
      if (options.hardDeleteTenantRecord) {
        const deletedRootCount = await deleteModelRecords(plan.rootModelName, [tenantId]);
        writeLine(`  Hard deleted ${deletedRootCount} ${plan.rootModelName} record(s)`);
      } else {
        const softDeleted = await softDeleteTenantRecord(plan.rootModelName, tenantId);
        if (softDeleted) {
          writeLine(`  Soft deleted ${plan.rootModelName} record`);
        } else {
          const deletedRootCount = await deleteModelRecords(plan.rootModelName, [tenantId]);
          writeLine(`  Deleted ${deletedRootCount} ${plan.rootModelName} record(s)`);
        }
      }
    }
  }

  writeLine('');
  writeLine('Tenant cleanup completed.');
  printFinalSummary(summary, options);
};

main()
  .catch((error: unknown) => {
    if (error instanceof ScriptUsageError || error instanceof ScriptExecutionError) {
      writeErrorLine(`ERROR: ${error.message}`);
      printUsage();
    } else if (error instanceof TenantCleanupPlanError) {
      writeErrorLine(`ERROR: ${error.message}`);
    } else if (error instanceof Error) {
      writeErrorLine(`ERROR: ${error.message}`);
    } else {
      writeErrorLine('ERROR: Tenant cleanup failed for an unknown reason.');
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();

    if (redisClient.status !== 'end') {
      await redisClient.quit();
    }
  });
