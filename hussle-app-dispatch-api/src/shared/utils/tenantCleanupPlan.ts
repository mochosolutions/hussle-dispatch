import { Prisma } from '@prisma/client';

const DEFAULT_ROOT_MODEL_CANDIDATES = ['Organization', 'Tenant'];
const DEFAULT_SCOPE_FIELD_NAMES = ['organizationId', 'tenantId', 'managedByOrgId', 'carrierOrgId'];

type PrismaModel = (typeof Prisma.dmmf.datamodel.models)[number];
type PrismaField = PrismaModel['fields'][number];

export class TenantCleanupPlanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantCleanupPlanError';
  }
}

export interface BuildTenantCleanupPlanOptions {
  rootModelCandidates?: string[];
  scopeFieldNames?: string[];
  skippedModelNames?: string[];
}

export interface TenantCleanupPlan {
  rootModelName: string;
  directScopedModelNames: string[];
  descendantModelNames: string[];
  includedModelNames: string[];
  deleteOrder: string[];
}

const hasScopeField = (model: PrismaModel, scopeFieldNames: Set<string>): boolean =>
  model.fields.some((field) => field.kind === 'scalar' && scopeFieldNames.has(field.name));

const getRelationParentNames = (
  model: PrismaModel,
  includedModelNames: Set<string>,
): Set<string> => {
  const parentNames = new Set<string>();

  model.fields.forEach((field) => {
    const relationFromFields = field.relationFromFields ?? [];
    if (
      field.kind === 'object' &&
      relationFromFields.length > 0 &&
      includedModelNames.has(field.type)
    ) {
      parentNames.add(field.type);
    }
  });

  return parentNames;
};

const getCreationOrder = (
  includedModels: PrismaModel[],
  includedModelNames: Set<string>,
): string[] => {
  const parentToChildren = new Map<string, Set<string>>();
  const incomingCounts = new Map<string, number>();

  includedModels.forEach((model) => {
    parentToChildren.set(model.name, new Set<string>());
    incomingCounts.set(model.name, 0);
  });

  includedModels.forEach((model) => {
    const parentNames = getRelationParentNames(model, includedModelNames);
    parentNames.forEach((parentName) => {
      const childNames = parentToChildren.get(parentName);
      if (childNames !== undefined) {
        childNames.add(model.name);
      }
      incomingCounts.set(model.name, (incomingCounts.get(model.name) ?? 0) + 1);
    });
  });

  const ready = Array.from(incomingCounts.entries())
    .filter(([, incomingCount]) => incomingCount === 0)
    .map(([modelName]) => modelName)
    .sort();

  const creationOrder: string[] = [];

  while (ready.length > 0) {
    const modelName = ready.shift();
    if (modelName === undefined) {
      continue;
    }

    creationOrder.push(modelName);

    const childNames = Array.from(parentToChildren.get(modelName) ?? []).sort();
    childNames.forEach((childName) => {
      const nextIncomingCount = (incomingCounts.get(childName) ?? 0) - 1;
      incomingCounts.set(childName, nextIncomingCount);
      if (nextIncomingCount === 0) {
        ready.push(childName);
        ready.sort();
      }
    });
  }

  if (creationOrder.length === includedModels.length) {
    return creationOrder;
  }

  const includedNames = includedModels.map((model) => model.name);
  const missingNames = includedNames.filter((modelName) => !creationOrder.includes(modelName));
  return [...creationOrder, ...missingNames.sort()];
};

export const buildTenantCleanupPlan = (
  options: BuildTenantCleanupPlanOptions = {},
): TenantCleanupPlan => {
  const rootModelCandidates = options.rootModelCandidates ?? DEFAULT_ROOT_MODEL_CANDIDATES;
  const scopeFieldNames = new Set(options.scopeFieldNames ?? DEFAULT_SCOPE_FIELD_NAMES);
  const skippedModelNames = new Set(options.skippedModelNames ?? []);
  const prismaModels = Prisma.dmmf.datamodel.models;
  const modelNames = new Set(prismaModels.map((model) => model.name));
  const rootModelName = rootModelCandidates.find((modelName) => modelNames.has(modelName));

  if (rootModelName === undefined) {
    throw new TenantCleanupPlanError(
      `Could not find a tenant root model. Checked: ${rootModelCandidates.join(', ')}`,
    );
  }

  if (skippedModelNames.has(rootModelName)) {
    throw new TenantCleanupPlanError(`Cannot skip the tenant root model: ${rootModelName}`);
  }

  const directScopedModelNames = prismaModels
    .filter((model) => !skippedModelNames.has(model.name) && hasScopeField(model, scopeFieldNames))
    .map((model) => model.name)
    .sort();

  const includedModelNames = new Set<string>([rootModelName, ...directScopedModelNames]);
  const queue = [...includedModelNames];

  while (queue.length > 0) {
    const parentName = queue.shift();
    if (parentName === undefined) {
      continue;
    }

    prismaModels.forEach((model) => {
      if (includedModelNames.has(model.name) || skippedModelNames.has(model.name)) {
        return;
      }

      const dependsOnParent = model.fields.some((field) => {
        const relationFromFields = field.relationFromFields ?? [];
        return (
          field.kind === 'object' && relationFromFields.length > 0 && field.type === parentName
        );
      });

      if (dependsOnParent) {
        includedModelNames.add(model.name);
        queue.push(model.name);
      }
    });
  }

  const includedModels = prismaModels.filter((model) => includedModelNames.has(model.name));
  const creationOrder = getCreationOrder(includedModels, includedModelNames);
  const descendantModelNames = creationOrder.filter(
    (modelName) => modelName !== rootModelName && !directScopedModelNames.includes(modelName),
  );

  return {
    rootModelName,
    directScopedModelNames,
    descendantModelNames,
    includedModelNames: creationOrder,
    deleteOrder: [...creationOrder].reverse(),
  };
};

export const getDefaultTenantScopeFieldNames = (): string[] => [...DEFAULT_SCOPE_FIELD_NAMES];
