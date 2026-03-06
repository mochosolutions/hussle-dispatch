# Project Standards — Express + Prisma Modular Monolith

> **Drop-in CLAUDE.md for any Express + Prisma project.**
> Replace `<!-- PROJECT: ... -->` placeholders with project-specific details.
> Add domain-specific sections (roles, entities, scoping rules) as needed.

<!-- PROJECT: Brief description of what this API does -->

All global standards from `~/.claude/CLAUDE.md` apply.
This file adds Express + Prisma specific patterns and overrides.

**Stack:** Node.js, Express, TypeScript, Prisma, Yup, Jest

---

## Quick Reference

| Concern | Section |
|---------|---------|
| **Architecture** | [Directory Structure](#directory-structure) · [Dependency Direction](#dependency-direction) · [Layer Responsibilities](#layer-responsibilities) |
| **Request Pipeline** | [Request/Response Flow](#requestresponse-flow) · [Mappers](#mapper-template) · [Transformers](#transformer-template) · [Validators](#validation-vs-business-rules) |
| **Dependency Injection** | [Composition Root](#composition-root) · [Port Interfaces](#port-interfaces) · [Cross-Entity Dependencies](#cross-entity-dependencies) |
| **Business Logic** | [Services](#service-template) · [Business Rules](#validation-vs-business-rules) · [Domain Events](#domain-events) |
| **Error Handling** | [Error Classes](#error-handling) · [CustomError Base](#typed-error-classes) |
| **Data** | [Type Derivation from Prisma](#type-derivation-from-prisma) · [Repositories](#repository-template) · [Transactions](#when-to-use-transactions) |
| **Security** | [Authorization](#authorization-pattern) · [Data Scoping](#data-scoping-pattern) |
| **Testing** | [Test Structure](#testing) · [Unit Tests](#unit-test-template) · [Integration Tests](#integration-test-template) |
| **Code Quality** | [STOP Triggers](#stop-triggers) · [NEVER Do These](#never-do-these) · [Validation Commands](#validation-commands) |

---

## STOP Triggers

Global triggers from `~/.claude/CLAUDE.md` apply. Additionally, STOP if you're about to:

- Manually define types that should derive from Prisma (use type derivation)
- Access `req.body` or `req.params` directly in a controller (use mappers)
- Return raw service output from a controller without a transformer

---

## NEVER Do These

Global rules from `~/.claude/CLAUDE.md` apply. Additionally:

- NEVER put business logic in controllers (move to services)
- NEVER put business rules in types, validators, or controllers (keep in services)
- NEVER let services import Express, Prisma directly, or format HTTP responses
- NEVER let services import repository implementations (inject ports via composition root)
- NEVER pass Prisma client as a dependency to services (inject repo ports instead)
- NEVER manually define entity types (derive from Prisma)
- NEVER import repositories directly in services (inject via composition root)
- NEVER skip mappers or transformers (always use them for consistency)
- NEVER access `req.body` or `req.params` directly in controllers (use mappers)
- NEVER return raw service results from controllers (use transformers)
- NEVER use domain events for pre-action validation (use repo injection)
- NEVER modify another entity directly in a service (use events or transactions)
- NEVER add validation throws to mappers as a replacement for route middleware — fix the route instead (missing auth = add `appAuth`; missing field validation = add `validateRequest(schema)`)

---

## Implementation Protocol

**Phase 1 — Plan (no code)**

- List files to create or modify
- Search for existing utilities to reuse (`src/shared/utils/`)
- Identify new shared utilities needed
- Present plan, wait for approval

**Phase 2 — Implement (after approval)**

- Create shared utilities first in `src/shared/utils/`
- Follow the dependency direction (see below)
- No approval needed on individual files

**Phase 3 — Verify**

- Run `npm run validate` (lint, architecture, types, tests)
- Fix any violations before marking complete
- Summarize changes

---

## Directory Structure

```
src/
├── shared/
│   ├── errors/              # CustomError base + typed error classes
│   ├── events/              # Event dispatcher infrastructure
│   ├── middleware/           # Express middleware (auth, errors, rate limiting)
│   ├── prisma/              # Prisma client, extensions
│   └── utils/               # Shared utility functions
├── <featureName>/
│   ├── types/               # Domain types, port interfaces, typed errors
│   ├── services/            # Business logic, business rules, orchestration
│   ├── repositories/        # Prisma queries, implements ports
│   ├── controllers/
│   │   ├── mappers/         # Request -> Service input
│   │   └── transformers/    # Service output -> Response
│   ├── validators/          # Yup schemas (input format validation only)
│   ├── events/              # Domain events and handlers (if needed)
│   │   └── handlers/
│   ├── routes/              # Express route definitions
│   ├── compositionRoot.ts   # Per-module DI wiring
│   └── __tests__/
│       ├── verbEntity.test.ts              <-- unit (flat)
│       ├── deleteEntity.test.ts            <-- unit (flat)
│       └── integration/
│           └── entityRoutes.integration.test.ts
├── compositionRoot.ts       # Top-level orchestrator — wires modules together
└── app.ts                   # Express app setup, mounts routes
```

---

## Dependency Direction

```
routes -> controllers -> services -> types
               |              |
          mappers/        repositories
          transformers     (implement ports)
               |
         eventDispatcher -> handlers (side effects)

  ┌─────────────── module boundary ───────────────┐
  │  compositionRoot.ts (per-module)               │
  │  exports: controllers, queries                 │
  │  receives: shared deps (prisma, logger, etc.)  │
  └────────────────────────────────────────────────┘
```

**Rules:**

- Services depend on **port interfaces**, never implementations
- Controllers depend on services (pre-bound by composition root)
- Routes receive fully wired controller functions
- Repositories implement port interfaces, accept Prisma client or transaction
- Event handlers process side effects, never core business logic
- Modules communicate through query ports, never direct imports

---

## Layer Responsibilities

| Layer | Does | Does NOT |
|-------|------|----------|
| **types/** | Domain types, port interfaces, typed errors, domain events | Import frameworks, contain logic |
| **services/** | Business logic, business rules, emit domain events | Import Express, Prisma, format HTTP |
| **repositories/** | Prisma queries, implement ports | Contain business logic or rules |
| **controllers/** | Orchestrate mapper -> service -> transformer, dispatch events | Contain business logic, access `req` directly |
| **mappers/** | Convert request to service input | Contain business logic or rules |
| **transformers/** | Convert service output to response | Contain business logic or rules |
| **validators/** | Yup schemas for input format validation | Contain business rules |
| **routes/** | Map endpoints to pre-wired controllers | Contain logic |
| **events/handlers/** | Process side effects (cache, messages, notifications) | Contain core business logic |
| **compositionRoot** | Wire dependencies for a single module | Contain business logic |

---

## Request/Response Flow

Every request follows this exact pipeline:

```
Request
   |
Middleware (auth, rate limiting, data scoping)
   |
Validator (Yup -- format validation only)
   |
Controller
   |
Mapper (req -> service input)
   |
Service (business logic + business rules)
   |
   +-- returns { data, events[] }
   |
Controller dispatches events (fire-and-forget)
   |
Transformer (data -> response)
   |
Response
```

ALWAYS use mappers and transformers. No exceptions.

**Error path:** Thrown errors propagate automatically to the centralized error handler via `express-async-errors` — controllers never catch errors themselves.

---

## Composition Root

Dependency wiring uses a **per-module** pattern. Each feature module has its own `compositionRoot.ts` that wires internal dependencies. A top-level orchestrator connects modules together.

### Per-Module Composition Root

Each module's composition root:
- Receives shared deps (prisma, logger, eventDispatcher) as parameters
- Wires internal repos, services, controllers
- Exports `controllers` (for routes) and optionally `queries` (for cross-module reads)

**Simple module — single repo, no cross-module deps:**

```typescript
// products/compositionRoot.ts
import type { PrismaClient } from '@prisma/client';
import type { LoggerPort } from '../shared/types/loggerPort';
import type { EventDispatcherPort } from '../shared/types/eventDispatcherPort';
import { productRepositoryPrisma } from './repositories/productRepositoryPrisma';
import { createProduct } from './services/createProduct';
import { getProductById } from './services/getProductById';
import { createProductController } from './controllers/createProductController';
import { getProductController } from './controllers/getProductController';

interface ProductModuleDeps {
  prisma: PrismaClient;
  logger: LoggerPort;
  eventDispatcher: EventDispatcherPort;
}

export const createProductModule = (deps: ProductModuleDeps) => {
  const productRepo = productRepositoryPrisma(deps.prisma);
  const serviceDeps = { productRepo, logger: deps.logger };

  const controllers = {
    create: createProductController({
      createProduct: (input) => createProduct(input, serviceDeps),
      eventDispatcher: deps.eventDispatcher,
      logger: deps.logger,
    }),
    getById: getProductController({
      getProductById: (input) => getProductById(input, serviceDeps),
      logger: deps.logger,
    }),
  };

  // Queries exposed for other modules to read products
  const queries = {
    findById: productRepo.findById,
    findMany: productRepo.findMany,
  };

  return { controllers, queries };
};
```

**Cross-module reads — module receives query port from another module:**

```typescript
// orders/compositionRoot.ts
import type { PrismaClient } from '@prisma/client';
import type { LoggerPort } from '../shared/types/loggerPort';
import type { EventDispatcherPort } from '../shared/types/eventDispatcherPort';
import type { ProductQueryPort } from './types/productQueryPort';
import { orderRepositoryPrisma } from './repositories/orderRepositoryPrisma';
import { createOrder } from './services/createOrder';
import { createOrderController } from './controllers/createOrderController';

interface OrderModuleDeps {
  prisma: PrismaClient;
  logger: LoggerPort;
  eventDispatcher: EventDispatcherPort;
  productQueries: ProductQueryPort; // Cross-module read dependency
}

export const createOrderModule = (deps: OrderModuleDeps) => {
  const orderRepo = orderRepositoryPrisma(deps.prisma);

  const controllers = {
    create: createOrderController({
      createOrder: (input) =>
        createOrder(input, {
          orderRepo,
          productQueries: deps.productQueries,
          logger: deps.logger,
        }),
      eventDispatcher: deps.eventDispatcher,
      logger: deps.logger,
    }),
  };

  return { controllers };
};
```

**Transaction — `txManager` injected, repos created inside callback:**

```typescript
// customers/compositionRoot.ts
import type { PrismaClient } from '@prisma/client';
import type { LoggerPort } from '../shared/types/loggerPort';
import type { EventDispatcherPort } from '../shared/types/eventDispatcherPort';
import type { TransactionManager } from '../shared/types/transactionManager';
import { signupCustomer } from './services/signupCustomer';
import { signupCustomerController } from './controllers/signupCustomerController';

interface CustomerModuleDeps {
  prisma: PrismaClient;
  logger: LoggerPort;
  eventDispatcher: EventDispatcherPort;
  txManager: TransactionManager;
}

export const createCustomerModule = (deps: CustomerModuleDeps) => {
  const controllers = {
    signup: signupCustomerController({
      signupCustomer: (input) =>
        signupCustomer(input, {
          txManager: deps.txManager,
          logger: deps.logger,
        }),
      eventDispatcher: deps.eventDispatcher,
      logger: deps.logger,
    }),
  };

  return { controllers };
};
```

### Top-Level Orchestrator

The top-level `src/compositionRoot.ts` creates shared infrastructure and wires modules together:

```typescript
// src/compositionRoot.ts
import type { PrismaClient } from '@prisma/client';
import type { LoggerPort } from './shared/types/loggerPort';
import { createEventDispatcher } from './shared/events/eventDispatcher';
import { createTransactionManager } from './shared/prisma/transactionManager';
import { createProductModule } from './products/compositionRoot';
import { createOrderModule } from './orders/compositionRoot';
import { createCustomerModule } from './customers/compositionRoot';

export const createCompositionRoot = (
  prisma: PrismaClient,
  logger: LoggerPort
) => {
  // --- Shared infrastructure ---
  const txManager = createTransactionManager(prisma);
  const eventDispatcher = createEventDispatcher({
    handlers: [
      /* register all event handlers here */
    ],
    logger,
  });

  const sharedDeps = { prisma, logger, eventDispatcher };

  // --- Modules ---
  const products = createProductModule(sharedDeps);

  const orders = createOrderModule({
    ...sharedDeps,
    productQueries: products.queries, // Cross-module wiring
  });

  const customers = createCustomerModule({
    ...sharedDeps,
    txManager,
  });

  // --- Return controllers grouped by feature ---
  return {
    products: products.controllers,
    orders: orders.controllers,
    customers: customers.controllers,
  };
};
```

### How Routes Consume the Composition Root

```typescript
// app.ts
import 'express-async-errors';
import express from 'express';
import { createCompositionRoot } from './compositionRoot';
import { productRoutes } from './products/routes/productRoutes';
import { orderRoutes } from './orders/routes/orderRoutes';
import { errorHandler } from './shared/middleware/errorHandler';

const prisma = new PrismaClient();
const root = createCompositionRoot(prisma, logger);

const app = express();

app.use('/products', productRoutes(root.products));
app.use('/orders', orderRoutes(root.orders));

// Error handler must be last
app.use(errorHandler);
```

```typescript
// <feature>/routes/entityRoutes.ts
import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticateUser';
import { validate } from '../../shared/middleware/validate';
import { createEntityValidator } from '../validators/createEntityValidator';

export const entityRoutes = (controllers: EntityControllers) => {
  const router = Router();

  router.post(
    '/',
    authenticate,
    validate(createEntityValidator),
    controllers.create
  );

  return router;
};
```

**Why this pattern:**

- Each module owns its internal wiring — easy to reason about in isolation
- Cross-module deps are explicit parameters, never hidden imports
- Top-level root is the only place that sees all modules
- Easy to swap implementations (test doubles, different DBs)
- No hidden singletons or global state

---

## Authorization Pattern

Authorization operates at two levels:

### 1. Route-level: Role gating (middleware)

Middleware checks if the authenticated user has the required role before the controller runs.

```typescript
// shared/middleware/authorizeUser.ts
export const authorize = (...allowedRoles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    // req.user is set by authentication middleware
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    next();
  };

// Usage in routes
router.delete('/:id', authenticate, authorize('ADMIN'), controllers.delete);
```

### 2. Service-level: Ownership and business rule checks

Services enforce domain-specific authorization (e.g., "users can only modify their own resources").

```typescript
// services/updateEntity.ts
export const updateEntity = async (
  input: UpdateEntityInput,
  deps: { entityRepo: EntityRepoPort; logger: LoggerPort }
): Promise<ServiceResult<Entity>> => {
  const entity = await deps.entityRepo.findById(input.id);

  if (!entity) {
    throw new NotFoundError('Entity', input.id);
  }

  // Ownership check — service-level authorization
  if (entity.createdById !== input.requestingUserId) {
    throw new ForbiddenError('You can only modify your own entities');
  }

  const updated = await deps.entityRepo.update(input.id, input.data);

  return { data: updated, events: [] };
};
```

<!-- PROJECT: Define specific roles (ADMIN, MEMBER, etc.) and permission matrix here -->

---

## Data Scoping Pattern

When data must be filtered by context (e.g., organization, user, tenant), enforce scoping through the full request pipeline:

### Middleware sets scope

```typescript
// shared/middleware/setScope.ts
export const setScope = (req: Request, res: Response, next: NextFunction) => {
  // Scope derived from authenticated user's context
  req.scope = {
    organizationId: req.user.organizationId,
    userId: req.user.id,
  };
  next();
};
```

### Mapper includes scope in service input

```typescript
// controllers/mappers/listEntitiesMapper.ts
export const listEntitiesMapper = (req: Request): ListEntitiesInput => ({
  organizationId: req.scope.organizationId,
  filters: {
    status: req.query.status,
  },
});
```

### Service passes scope to repository

```typescript
// services/listEntities.ts
export const listEntities = async (
  input: ListEntitiesInput,
  deps: { entityRepo: EntityRepoPort; logger: LoggerPort }
): Promise<ServiceResult<Entity[]>> => {
  // Scope is part of the query — repository enforces it
  const entities = await deps.entityRepo.findMany({
    organizationId: input.organizationId,
    status: input.filters.status,
  });

  return { data: entities, events: [] };
};
```

### Repository applies scope to query

```typescript
// repositories/entityRepositoryPrisma.ts
findMany: async (filters) =>
  prisma.entity.findMany({
    where: {
      organizationId: filters.organizationId, // Scoping enforced here
      status: filters.status,
    },
  }),
```

**The scope flows:** middleware -> mapper -> service -> repository query. No layer is skipped.

<!-- PROJECT: Define specific scoping rules (multi-tenant, user-scoped, etc.) here -->

---

## Domain Events

Services return `ServiceResult<T>` containing data and events. Controllers dispatch events fire-and-forget.

### Lifecycle

1. **Startup:** The composition root creates event handlers and the dispatcher once. The dispatcher is passed to controllers as a dependency.
2. **Request:** A controller calls a service. The service performs business logic and returns `{ data, events[] }` — it never dispatches events itself.
3. **Dispatch:** The controller calls `dispatcher.dispatchAll(result.events)` fire-and-forget (non-blocking).
4. **Routing:** The dispatcher matches each event's `type` against each handler's `handles` array and runs matching handlers.
5. **Isolation:** Each handler runs independently. If one handler fails, others still execute. Failures are logged, not rethrown.

### ServiceResult Type

```typescript
// shared/types/serviceResult.ts
import type { DomainEvent } from './domainEvents';

export interface ServiceResult<T> {
  data: T;
  events: DomainEvent[];
}
```

### Domain Event Base

```typescript
// shared/types/domainEvents.ts
export interface DomainEvent {
  type: string;
  occurredAt: Date;
  correlationId?: string;
  payload: Record<string, unknown>;
}

// Feature-specific events extend this:
// export interface EntityCreatedEvent extends DomainEvent {
//   type: 'ENTITY_CREATED';
//   payload: { entityId: string; /* ... */ };
// }
```

### Event Dispatcher

```typescript
// shared/events/eventDispatcher.ts
export interface EventHandler {
  handles: string[];
  handle: (event: DomainEvent) => Promise<void>;
}

export interface EventDispatcherPort {
  dispatch: (event: DomainEvent) => Promise<void>;
  dispatchAll: (events: DomainEvent[]) => Promise<void>;
}

export const createEventDispatcher = (config: {
  handlers: EventHandler[];
  logger: LoggerPort;
  async?: boolean;
}): EventDispatcherPort => {
  const { handlers, logger, async: isAsync = true } = config;

  const dispatch = async (event: DomainEvent): Promise<void> => {
    const relevant = handlers.filter((h) => h.handles.includes(event.type));

    logger.info('Dispatching event', {
      type: event.type,
      handlerCount: relevant.length,
    });

    const run = async (handler: EventHandler) => {
      try {
        await handler.handle(event);
      } catch (error: unknown) {
        logger.error('Handler failed', { type: event.type, error });
      }
    };

    if (isAsync) {
      relevant.forEach((h) => run(h).catch(() => {}));
    } else {
      await Promise.all(relevant.map(run));
    }
  };

  return {
    dispatch,
    dispatchAll: (events) => Promise.all(events.map(dispatch)).then(() => {}),
  };
};
```

### Event Handler Example

```typescript
// <feature>/events/handlers/cacheInvalidationHandler.ts
export const cacheInvalidationHandler = (deps: {
  cache: CachePort;
  logger: LoggerPort;
}) => ({
  handles: ['ENTITY_CREATED', 'ENTITY_UPDATED', 'ENTITY_DELETED'],

  handle: async (event: DomainEvent): Promise<void> => {
    deps.logger.info('Invalidating cache', { type: event.type });
    await deps.cache.invalidate(event.type);
  },
});
```

### Adding a new side effect

1. Create a handler in `<feature>/events/handlers/`
2. Register it in the module's composition root
3. **No service changes required**

---

## Cross-Entity Dependencies

| Scenario | Pattern | Example |
|----------|---------|---------|
| **Read** another entity for validation | Inject query port | Check if children exist before deleting parent |
| **Query** for display or filtering | Inject query port | Get child count for parent |
| **Modify** multiple entities atomically | Transaction with repos | Create parent + child + relation |
| **Trigger** async side effect | Domain event + handler | Send notification after action |
| **Notify** external systems | Domain event + handler | Update search index, webhook |

### Read-Only Cross-Entity (Inject Query Port)

```typescript
export const deleteParent = async (
  id: string,
  deps: {
    parentRepo: ParentRepoPort;
    childQueries: ChildQueryPort; // Cross-module read via query port
    logger: LoggerPort;
  }
): Promise<ServiceResult<{ deleted: boolean }>> => {
  const parent = await deps.parentRepo.findById(id);
  if (!parent) {
    throw new NotFoundError('Parent', id);
  }

  const childCount = await deps.childQueries.countByParentId(id);
  if (childCount > 0) {
    throw new BadRequestError(
      `Cannot delete: ${childCount} child record(s) still reference this entity`
    );
  }

  await deps.parentRepo.delete(id);
  deps.logger.info('Parent deleted', { parentId: id });

  return {
    data: { deleted: true },
    events: [
      {
        type: 'PARENT_DELETED',
        occurredAt: new Date(),
        payload: { parentId: id },
      },
    ],
  };
};
```

### Atomic Cross-Entity Writes (Transaction)

```typescript
export const signupCustomer = async (
  input: SignupInput,
  deps: { txManager: TransactionManager; logger: LoggerPort }
): Promise<ServiceResult<SignupResult>> => {
  const result = await deps.txManager.runInTransaction(async (tx) => {
    const orgRepo = organizationRepositoryPrisma(tx);
    const userRepo = userRepositoryPrisma(tx);
    const membershipRepo = membershipRepositoryPrisma(tx);

    const org = await orgRepo.create(input.organization);
    const user = await userRepo.create(input.user);
    const membership = await membershipRepo.create({
      userId: user.id,
      organizationId: org.id,
      role: 'ADMIN',
    });

    return { org, user, membership };
  });

  deps.logger.info('Customer signed up', {
    organizationId: result.org.id,
    userId: result.user.id,
  });

  return {
    data: result,
    events: [
      {
        type: 'CUSTOMER_SIGNED_UP',
        occurredAt: new Date(),
        payload: {
          organizationId: result.org.id,
          userId: result.user.id,
        },
      },
    ],
  };
};
```

### When to Use Transactions

**Needs transaction:**

- Multiple related table writes
- Parent + required children creation
- Balance transfers or debit/credit operations
- Delete with required relation cleanup

**No transaction needed:**

- Single table read or write
- Multiple reads
- Write + optional side effect (notifications, logging)

**Rule:** If partial completion is not acceptable, use a transaction.

---

## Validation vs Business Rules

### Input Validation (validators/) -- Format Only

- "Title is required"
- "Email must be valid format"
- "Status must be one of DRAFT, PUBLISHED"
- "ID must be a valid UUID"
- Runs as middleware BEFORE controller
- Uses Yup schemas

### Business Rules (services/) -- Domain Logic

- "Slug must be unique within scope"
- "Cannot publish without required relations"
- "Cannot delete if dependents exist"
- "User cannot exceed resource quota"
- Runs INSIDE service functions
- Throws typed errors on violation

**Rule of thumb:** If it requires a database check or domain knowledge, it's a business rule and belongs in services.

---

## Error Handling

Global error handling philosophy from `~/.claude/CLAUDE.md` applies. This section covers the Express + Prisma implementation.

### Typed Error Classes

```
src/shared/errors/
  customError.ts        — abstract base class
  notFoundError.ts      — 404
  badRequestError.ts    — 400
  conflictError.ts      — 409
  unauthorizedError.ts  — 401
  forbiddenError.ts     — 403
```

| Error | Status | When to use |
|-------|--------|-------------|
| `NotFoundError` | 404 | Entity doesn't exist |
| `BadRequestError` | 400 | Invalid input or business rule violation |
| `ConflictError` | 409 | Duplicate or state conflict |
| `UnauthorizedError` | 401 | Not authenticated |
| `ForbiddenError` | 403 | Not authorized |

### CustomError Base Class

```typescript
// src/shared/errors/customError.ts
export abstract class CustomError extends Error {
  abstract statusCode: number;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }

  abstract serializeErrors(): { message: string; field?: string }[];
}
```

```typescript
// src/shared/errors/notFoundError.ts
import { CustomError } from './customError';

export class NotFoundError extends CustomError {
  statusCode = 404;

  constructor(
    private entity: string,
    private id: string
  ) {
    super(`${entity} with id ${id} not found`);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
```

```typescript
// src/shared/errors/badRequestError.ts
import { CustomError } from './customError';

export class BadRequestError extends CustomError {
  statusCode = 400;

  constructor(message: string) {
    super(message);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
```

### Controller Error Handling — `express-async-errors`

Controllers do **not** use try/catch. The `express-async-errors` package automatically forwards thrown errors to the centralized error handler.

```typescript
// app.ts — import once at the top
import 'express-async-errors';
```

This means controllers are clean async functions with no error plumbing:

```typescript
// Controllers throw → express-async-errors catches → errorHandler runs
// No try/catch needed anywhere in controllers
```

> **Note:** Express 5 provides this natively. When migrating to Express 5, remove the `express-async-errors` package — no other code changes needed.

### Centralized Error Handler Middleware

```typescript
// shared/middleware/errorHandler.ts
import { CustomError } from '../errors/customError';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof CustomError) {
    return res.status(error.statusCode).json({
      errors: error.serializeErrors(),
    });
  }

  logger.error('Unhandled error', { error: error.message, stack: error.stack });
  return res.status(500).json({
    errors: [{ message: 'Internal server error' }],
  });
};
```

### Logging Rules

- Services log business operations: `deps.logger.info('Entity created', { entityId })`
- Controllers log request-level concerns only if needed
- NEVER log sensitive data (passwords, tokens, PII)
- NEVER use `console.log` — always inject logger

---

## Type Derivation from Prisma

Prisma schema is the single source of truth. NEVER manually define entity types.

```typescript
import { Entity } from '@prisma/client';

export type EntityBase = Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateEntityInput = Omit<EntityBase, 'computedField'> & {
  /* extra fields */
};
export type UpdateEntityInput = Partial<CreateEntityInput> & { id: string };
```

| Type | Pattern | Example |
|------|---------|---------|
| Base | `{Entity}Base` | `EntityBase` |
| Create input | `Create{Entity}Input` | `CreateEntityInput` |
| Update input | `Update{Entity}Input` | `UpdateEntityInput` |
| Service deps | `{Service}Deps` | `CreateEntityDeps` |
| Repo port | `{Entity}RepoPort` | `EntityRepoPort` |
| Response | `{Entity}Response` | `EntityResponse` |
| Event | `{Entity}{Action}Event` | `EntityCreatedEvent` |

---

## Port Interfaces

Define contracts in `types/`. Repositories implement them.

```typescript
// types/entityRepoPort.ts
export interface EntityRepoPort {
  create(data: CreateEntityInput): Promise<EntityWithRelations>;
  findById(id: string): Promise<EntityWithRelations | null>;
  findMany(filters: EntityFilters): Promise<EntityWithRelations[]>;
  update(id: string, data: UpdateEntityInput): Promise<EntityWithRelations>;
  delete(id: string): Promise<void>;
  count(filters: EntityFilters): Promise<number>;
}

// types/loggerPort.ts
export interface LoggerPort {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

// types/eventDispatcherPort.ts
export interface EventDispatcherPort {
  dispatch(event: DomainEvent): Promise<void>;
  dispatchAll(events: DomainEvent[]): Promise<void>;
}
```

---

## Testing

Global testing standards from `~/.claude/CLAUDE.md` apply (AAA pattern, naming, what to test).

Three tiers, 90% coverage target.

**Unit tests:** Mock all ports, test business logic, fast, high volume.
**Integration tests:** HTTP to real DB, verify wiring.
**Security tests:** Verify authorization, scoping, input sanitization.

### Test Structure

```
src/<feature>/__tests__/
  createEntity.test.ts              <-- unit (flat, no subfolder)
  deleteEntity.test.ts              <-- unit
  createEntityController.test.ts    <-- unit
  integration/
    entityRoutes.integration.test.ts
```

Unit tests live flat in `__tests__/`. Integration tests go in `__tests__/integration/`.

---

## Architecture Enforcement

These rules are enforced by tooling and will fail CI:

**dependency-cruiser (`npm run lint:deps`):**

- `no-prisma-in-services` — Services cannot import `@prisma/client`
- `no-repo-implementations-in-services` — Services cannot import from `repositories/`
- `no-services-to-controllers` — Services cannot import from controllers
- `no-circular` — No circular dependencies

**ESLint (`npm run lint`):**

- Type safety rules cannot be disabled with `eslint-disable` comments
- Protected rules: `no-explicit-any`, `no-unsafe-*` family

---

## Templates

### Service Template

```typescript
// <feature>/services/verbEntity.ts
import type { ServiceResult } from '../../shared/types/serviceResult';
import type { EntityRepoPort } from '../types/entityRepoPort';
import type { LoggerPort } from '../../shared/types/loggerPort';
import { NotFoundError } from '../../shared/errors/notFoundError';
import { ForbiddenError } from '../../shared/errors/forbiddenError';

interface VerbEntityInput {
  entityId: string;
  requestingUserId: string;
  // ... input fields
}

interface VerbEntityDeps {
  entityRepo: EntityRepoPort;
  logger: LoggerPort;
}

export const verbEntity = async (
  input: VerbEntityInput,
  deps: VerbEntityDeps
): Promise<ServiceResult<Entity>> => {
  const entity = await deps.entityRepo.findById(input.entityId);

  if (!entity) {
    throw new NotFoundError('Entity', input.entityId);
  }

  // Authorization: ownership check (if applicable)
  // if (entity.createdById !== input.requestingUserId) {
  //   throw new ForbiddenError('You can only modify your own entities');
  // }

  // Business rules
  // if (entity.status === 'LOCKED') {
  //   throw new BadRequestError('Cannot modify a locked entity');
  // }

  const updated = await deps.entityRepo.update(input.entityId, {
    /* ... */
  });

  deps.logger.info('Entity verbed', { entityId: input.entityId });

  return {
    data: updated,
    events: [
      {
        type: 'ENTITY_VERBED',
        occurredAt: new Date(),
        payload: { entityId: updated.id },
      },
    ],
  };
};
```

### Controller Template

```typescript
// <feature>/controllers/verbEntityController.ts
import type { Request, Response } from 'express';
import type { ServiceResult } from '../../shared/types/serviceResult';
import type { EventDispatcherPort } from '../../shared/types/eventDispatcherPort';
import type { LoggerPort } from '../../shared/types/loggerPort';
import { verbEntityMapper } from './mappers/verbEntityMapper';
import { entityTransformer } from './transformers/entityTransformer';

interface VerbEntityControllerDeps {
  verbEntity: (input: VerbEntityInput) => Promise<ServiceResult<Entity>>;
  eventDispatcher: EventDispatcherPort;
  logger: LoggerPort;
}

export const verbEntityController = (deps: VerbEntityControllerDeps) =>
  async (req: Request, res: Response) => {
    const input = verbEntityMapper(req);
    const result = await deps.verbEntity(input);

    deps.eventDispatcher.dispatchAll(result.events).catch((error: unknown) => {
      deps.logger.error('Event dispatch failed', { error });
    });

    const response = entityTransformer(result.data);
    return res.status(200).json(response);
  };
```

### Mapper Template

```typescript
// <feature>/controllers/mappers/verbEntityMapper.ts
import type { Request } from 'express';

interface VerbEntityInput {
  entityId: string;
  requestingUserId: string;
  // ... mapped fields
}

export const verbEntityMapper = (req: Request): VerbEntityInput => ({
  entityId: req.params.id,
  requestingUserId: req.user.id,
  // ... map from req.body, req.query, req.params
});
```

### Transformer Template

```typescript
// <feature>/controllers/transformers/entityTransformer.ts
interface EntityResponse {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export const entityTransformer = (entity: Entity): EntityResponse => ({
  id: entity.id,
  name: entity.name,
  createdAt: entity.createdAt.toISOString(),
  updatedAt: entity.updatedAt.toISOString(),
});
```

### Repository Template

```typescript
// <feature>/repositories/entityRepositoryPrisma.ts
import type { PrismaClient } from '@prisma/client';
import type { EntityRepoPort } from '../types/entityRepoPort';

type PrismaTransaction = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];

export const entityRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction
): EntityRepoPort => ({
  create: async (data) =>
    prisma.entity.create({ data, include: ENTITY_INCLUDES }),

  findById: async (id) =>
    prisma.entity.findUnique({ where: { id }, include: ENTITY_INCLUDES }),

  findMany: async (filters) =>
    prisma.entity.findMany({
      where: {
        organizationId: filters.organizationId,
        ...(filters.status && { status: filters.status }),
      },
      include: ENTITY_INCLUDES,
    }),

  update: async (id, data) =>
    prisma.entity.update({ where: { id }, data, include: ENTITY_INCLUDES }),

  delete: async (id) => {
    await prisma.entity.delete({ where: { id } });
  },

  count: async (filters) =>
    prisma.entity.count({
      where: {
        organizationId: filters.organizationId,
        ...(filters.status && { status: filters.status }),
      },
    }),
});

const ENTITY_INCLUDES = {
  // Define relation includes here
};
```

### Validator Template (Yup)

```typescript
// <feature>/validators/verbEntityValidator.ts
import * as yup from 'yup';

export const verbEntityValidator = yup.object({
  params: yup.object({
    id: yup.string().uuid().required(),
  }),
  body: yup.object({
    name: yup.string().required().min(1).max(255),
    status: yup.string().oneOf(['DRAFT', 'PUBLISHED']).required(),
  }),
});
```

### Route Template

```typescript
// <feature>/routes/entityRoutes.ts
import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticateUser';
import { authorize } from '../../shared/middleware/authorizeUser';
import { validate } from '../../shared/middleware/validate';
import { createEntityValidator } from '../validators/createEntityValidator';
import { verbEntityValidator } from '../validators/verbEntityValidator';

interface EntityControllers {
  create: RequestHandler;
  getById: RequestHandler;
  verb: RequestHandler;
  delete: RequestHandler;
}

export const entityRoutes = (controllers: EntityControllers) => {
  const router = Router();

  router.post(
    '/',
    authenticate,
    validate(createEntityValidator),
    controllers.create
  );

  router.get('/:id', authenticate, controllers.getById);

  router.patch(
    '/:id',
    authenticate,
    validate(verbEntityValidator),
    controllers.verb
  );

  router.delete(
    '/:id',
    authenticate,
    authorize('ADMIN'),
    controllers.delete
  );

  return router;
};
```

### Per-Module Composition Root Template

```typescript
// <feature>/compositionRoot.ts
import type { PrismaClient } from '@prisma/client';
import type { LoggerPort } from '../shared/types/loggerPort';
import type { EventDispatcherPort } from '../shared/types/eventDispatcherPort';
import { entityRepositoryPrisma } from './repositories/entityRepositoryPrisma';
import { createEntity } from './services/createEntity';
import { verbEntity } from './services/verbEntity';
import { createEntityController } from './controllers/createEntityController';
import { verbEntityController } from './controllers/verbEntityController';

interface EntityModuleDeps {
  prisma: PrismaClient;
  logger: LoggerPort;
  eventDispatcher: EventDispatcherPort;
}

export const createEntityModule = (deps: EntityModuleDeps) => {
  const entityRepo = entityRepositoryPrisma(deps.prisma);
  const serviceDeps = { entityRepo, logger: deps.logger };

  const controllers = {
    create: createEntityController({
      createEntity: (input) => createEntity(input, serviceDeps),
      eventDispatcher: deps.eventDispatcher,
      logger: deps.logger,
    }),
    verb: verbEntityController({
      verbEntity: (input) => verbEntity(input, serviceDeps),
      eventDispatcher: deps.eventDispatcher,
      logger: deps.logger,
    }),
  };

  const queries = {
    findById: entityRepo.findById,
    findMany: entityRepo.findMany,
    count: entityRepo.count,
  };

  return { controllers, queries };
};
```

### Unit Test Template

```typescript
// <feature>/__tests__/verbEntity.test.ts
import { verbEntity } from '../services/verbEntity';
import { NotFoundError } from '../../shared/errors/notFoundError';
import { ForbiddenError } from '../../shared/errors/forbiddenError';

describe('verbEntity', () => {
  const mockDeps = {
    entityRepo: {
      findById: jest.fn(),
      update: jest.fn(),
    },
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  };

  beforeEach(() => jest.clearAllMocks());

  it('updates entity when input is valid', async () => {
    // Arrange
    const entity = { id: '1', name: 'Old', createdById: 'user-1' };
    mockDeps.entityRepo.findById.mockResolvedValue(entity);
    mockDeps.entityRepo.update.mockResolvedValue({ ...entity, name: 'New' });

    // Act
    const result = await verbEntity(
      { entityId: '1', requestingUserId: 'user-1', name: 'New' },
      mockDeps
    );

    // Assert
    expect(result.data.name).toBe('New');
    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe('ENTITY_VERBED');
  });

  it('throws NotFoundError when entity does not exist', async () => {
    mockDeps.entityRepo.findById.mockResolvedValue(null);

    await expect(
      verbEntity(
        { entityId: '999', requestingUserId: 'user-1' },
        mockDeps
      )
    ).rejects.toThrow(NotFoundError);
  });

  it('throws ForbiddenError when user does not own entity', async () => {
    mockDeps.entityRepo.findById.mockResolvedValue({
      id: '1',
      createdById: 'other-user',
    });

    await expect(
      verbEntity(
        { entityId: '1', requestingUserId: 'user-1' },
        mockDeps
      )
    ).rejects.toThrow(ForbiddenError);
  });
});
```

### Integration Test Template

```typescript
// <feature>/__tests__/integration/entityRoutes.integration.test.ts
import request from 'supertest';
import { app } from '../../../app';
import { prisma } from '../../../shared/prisma/client';

describe('POST /entities', () => {
  beforeEach(async () => {
    await prisma.entity.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns 201 with created entity when input is valid', async () => {
    const response = await request(app)
      .post('/entities')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ name: 'Test Entity', status: 'DRAFT' });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Test Entity');
    expect(response.body.id).toBeDefined();
  });

  it('returns 400 when required field is missing', async () => {
    const response = await request(app)
      .post('/entities')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    const response = await request(app)
      .post('/entities')
      .send({ name: 'Test' });

    expect(response.status).toBe(401);
  });
});
```

---

## Validation Commands

**IMPORTANT: Always run before completing any work:**

```bash
npm run lint          # ESLint -- style and import violations
npm run lint:fix      # Auto-fix formatting, imports, trailing commas
npm run lint:deps     # dependency-cruiser -- architecture violations
npm run check-ts      # TypeScript -- type errors
npm test              # Jest -- test failures
npm run validate      # All of the above (lint + deps + types + tests)
```

**Workflow:**

1. After writing code, run `npm run lint`
2. If there are auto-fixable errors, run `npm run lint:fix`
3. Fix any remaining errors manually
4. Run `npm run validate` to confirm all checks pass
5. Only mark work complete when `npm run validate` passes

---

## Git Workflow

- Branch naming: `feature/<name>`, `fix/<name>`, `refactor/<name>`
- One feature/fix per PR
- Run `npm run validate` before committing
- Keep commits focused and atomic
