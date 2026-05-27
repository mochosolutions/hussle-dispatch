# Auth Module — Public API Contract

## Exports

The auth module exposes the following from its public surface:

| Export | Type | Import path |
|--------|------|-------------|
| `createAuthModule(deps)` | Factory function | `./compositionRoot` |
| `createRootAuthRouter(controllers, validators)` | Express router factory | `./routes` |
| `OrganizationStatus` | Enum (`PENDING`, `ACTIVE`, `SUSPENDED`) | `./constants/enums` |
| `MembershipStatus` | Const object (`active`, `inactive`, `deleted`) | `./constants/enums` |

### `createAuthModule` return shape

```typescript
{
  controllers: AuthControllers;   // Pre-wired request handlers
  validators: AuthModuleValidators; // Yup validators built from enum config
}
```

`AuthModuleValidators` contains:

| Validator | Purpose |
|-----------|---------|
| `signupRequestObjValidator` | Validates signup request body |
| `updateOrganizationValidator` | Validates org update request body |
| `bulkOrgValidators` | Validates bulk org operations |

### `createRootAuthRouter`

Mounts three sub-routers under `/api` and `/api/v1`:

- Auth routes (signup, login, token refresh, switch org)
- Organization routes (CRUD)
- Invite routes (create, accept)

---

## Dependencies (`AuthModuleDeps`)

Everything the auth module needs is received through a single config object:

```typescript
interface AuthModuleDeps {
  prismaClient: PrismaClient;
  redisClient: Redis;
  config: AuthModuleConfig;
  enumConfig: AuthEnumConfig;
  eventBus: EventBus;
  logger: Logger;
  auditLogRepo: AuditLogPort;
}
```

| Dependency | Type | Purpose |
|------------|------|---------|
| `prismaClient` | `PrismaClient` | Database access for all auth repos |
| `redisClient` | `Redis` (ioredis) | Session/token storage |
| `config` | `AuthModuleConfig` | Runtime config (see below) |
| `enumConfig` | `AuthEnumConfig` | Project-specific enum values (see below) |
| `eventBus` | `EventBus` | Domain event publishing |
| `logger` | `Logger` | Structured logging |
| `auditLogRepo` | `AuditLogPort` | Audit trail writes |

### `AuthModuleConfig`

```typescript
interface AuthModuleConfig {
  allowedRoles: string[];   // Roles permitted for membership (e.g., ADMIN, DISPATCHER)
  defaultOrgRole: string;   // Role assigned on org creation (e.g., 'CARRIER')
}
```

### `AuthEnumConfig`

Project-specific enums injected at startup. Auth never hardcodes these values.

```typescript
interface AuthEnumConfig {
  subscriptionTier: AuthEnumValueConfig;       // e.g., FREE, PRO, ENTERPRISE
  organizationRole: AuthEnumValueConfig;       // e.g., CARRIER, BROKER, SHIPPER
  organizationVertical: AuthEnumValueConfig;   // e.g., TRUCKING, LOGISTICS
}

interface AuthEnumValueConfig {
  values: readonly string[];
  default?: string;
}
```

### `AuditLogPort`

Auth depends on this abstraction, never the concrete audit module.

```typescript
interface AuditLogPort {
  create(organizationId: string, input: CreateAuditLogInput): Promise<unknown>;
}

interface CreateAuditLogInput {
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  metadata: Record<string, unknown> | null;
  timestamp?: Date;
}
```

---

## Rules

1. **Project-specific enums are injected, never hardcoded.** `SubscriptionTier`, `OrganizationRole`, and `OrganizationVertical` values come from `AuthEnumConfig`. Validators are built dynamically from these values at module creation time.

2. **Auth-owned enums are stable and exported directly.** `OrganizationStatus` and `MembershipStatus` are defined in `auth/constants/enums.ts` and can be imported by any consumer.

3. **Audit logging uses dependency inversion.** Auth depends on the `AuditLogPort` interface. The caller provides a concrete implementation (typically backed by the audit module's Prisma repository).

4. **The caller wires everything in `auth/index.ts`.** The module entry point imports shared infrastructure, builds the `AuthModuleDeps` object, calls `createAuthModule`, then exports the router via `createRootAuthRouter`.
