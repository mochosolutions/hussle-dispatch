/**
 * Dev-only seeder: creates loginable mock users (1 admin, 2 dispatchers, 3 drivers)
 * in a target organization, using the same Cognito AdminCreateUser path the app
 * uses for admin invites — email pre-verified, NO email sent, permanent password.
 * The seeded users can log in immediately at /login with the printed credentials.
 *
 * Recommended (inside the API container so env + DB networking are wired):
 *   docker compose exec dispatch-api npx tsx scripts/seedTestUsers.ts --org <slug-or-admin-email>
 *
 * Local (requires the DB reachable from your host and Cognito/AWS creds in ./.env):
 *   npx tsx scripts/seedTestUsers.ts --org <slug-or-admin-email>
 *
 * Omit --org to list organizations (slug / name / id) and exit.
 *
 * Idempotent: re-running resets each user's password and upserts the DB rows.
 * Refuses to run when NODE_ENV=production.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { AttributeType } from '@aws-sdk/client-cognito-identity-provider';
import { PrismaClient } from '@prisma/client';

import { ROLES } from '@/config/roles';
import { cognitoProvider } from '@/auth/providers/authProvider';
import { cognitoIdentityClient } from '@/shared/utils/cognitoClient';
import {
  adminSetUserPassword,
  findUserByEmailInCognito,
  getClientId,
} from '@/shared/utils/cognito';

const out = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

const err = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

// Dependency-free .env loader: populate process.env from ./.env for local runs,
// without overriding values already set (so the container's env_file wins).
const loadEnvFile = (): void => {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    return;
  }
  readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('#')) {
        return;
      }
      const eq = trimmed.indexOf('=');
      if (eq === -1) {
        return;
      }
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
};

loadEnvFile();

const prisma = new PrismaClient();
const PASSWORD = process.env['TEST_USER_PASSWORD'] ?? 'TestPass123!';
const DRIVER_PHONE = '+15555550100';

interface UserSpec {
  role: string;
  email: string;
  firstName: string;
  lastName: string;
}

const parseOrgArg = (): string | undefined => {
  const args = process.argv.slice(2);
  const idx = args.indexOf('--org');
  return idx !== -1 ? args[idx + 1] : undefined;
};

// Resolve the target org by slug first, then by an existing member's email.
const resolveOrg = async (identifier: string) => {
  const bySlug = await prisma.organization.findUnique({ where: { slug: identifier } });
  if (bySlug) {
    return bySlug;
  }
  const membership = await prisma.membership.findFirst({
    where: { user: { email: identifier }, deleted: false },
    include: { organization: true },
  });
  return membership?.organization ?? null;
};

// Ensure a CONFIRMED Cognito user with the known password; returns the sub.
const ensureCognitoUser = async (
  provider: ReturnType<typeof cognitoProvider>,
  userPoolId: string,
  spec: UserSpec,
): Promise<string> => {
  let existingSub: string | undefined;
  try {
    const found = await findUserByEmailInCognito({
      email: spec.email,
      userPoolId,
      client: cognitoIdentityClient,
    });
    existingSub = found.UserAttributes?.find(
      (attr: AttributeType) => attr.Name === 'sub',
    )?.Value;
  } catch {
    // Not found (or unreadable) — fall through to create.
    existingSub = undefined;
  }

  if (existingSub !== undefined) {
    // Reset to the known password so re-runs stay loginable.
    await adminSetUserPassword({
      client: cognitoIdentityClient,
      userPoolId,
      username: spec.email,
      password: PASSWORD,
      permanent: true,
    });
    return existingSub;
  }

  const created = await provider.createUser({
    email: spec.email,
    password: PASSWORD,
    firstName: spec.firstName,
    lastName: spec.lastName,
  });
  return created.id;
};

// Reuse an ACTIVE carrier in the org, else create a "Test Carrier".
const ensureCarrier = async (organizationId: string) => {
  const existing = await prisma.carrier.findFirst({
    where: { managedByOrgId: organizationId, status: 'ACTIVE' },
  });
  if (existing) {
    return existing;
  }
  return prisma.carrier.create({
    data: { managedByOrgId: organizationId, name: 'Test Carrier', status: 'ACTIVE' },
  });
};

const seedUser = async (
  provider: ReturnType<typeof cognitoProvider>,
  userPoolId: string,
  organizationId: string,
  carrierId: string,
  spec: UserSpec,
): Promise<void> => {
  const sub = await ensureCognitoUser(provider, userPoolId, spec);

  const user = await prisma.user.upsert({
    where: { email: spec.email },
    update: { externalId: sub, firstName: spec.firstName, lastName: spec.lastName },
    create: {
      externalId: sub,
      email: spec.email,
      firstName: spec.firstName,
      lastName: spec.lastName,
    },
  });

  const membership = await prisma.membership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId } },
    update: { role: spec.role, status: 'active', deleted: false, deletedAt: null },
    create: { userId: user.id, organizationId, role: spec.role, status: 'active' },
  });

  if (spec.role === ROLES.DISPATCHER) {
    await prisma.dispatcherProfile.upsert({
      where: { membershipId: membership.id },
      update: {},
      create: { membershipId: membership.id },
    });
  }

  if (spec.role === ROLES.DRIVER) {
    const existingDriver = await prisma.driver.findFirst({ where: { userId: user.id } });
    if (!existingDriver) {
      await prisma.driver.create({
        data: {
          carrierId,
          userId: user.id,
          firstName: spec.firstName,
          lastName: spec.lastName,
          email: spec.email,
          phone: DRIVER_PHONE,
          payType: 'PER_MILE',
          payRate: 0.45,
        },
      });
    }
  }

  out(`  done  ${spec.role.padEnd(11)} ${spec.email}`);
};

const main = async (): Promise<void> => {
  if (process.env['NODE_ENV'] === 'production') {
    err('Refusing to seed test users in production.');
    process.exit(1);
  }

  const orgArg = parseOrgArg();
  if (orgArg === undefined || orgArg === '') {
    const orgs = await prisma.organization.findMany({
      select: { id: true, name: true, slug: true },
    });
    out('No --org provided. Available organizations:\n');
    orgs.forEach((o) => out(`  ${o.slug.padEnd(24)} ${o.name}  (${o.id})`));
    out('\nRe-run with: npx tsx scripts/seedTestUsers.ts --org <slug-or-admin-email>');
    return;
  }

  const org = await resolveOrg(orgArg);
  if (org === null) {
    err(`Organization not found for "${orgArg}" (tried slug, then member email).`);
    process.exit(1);
  }

  const { clientId, userPoolId } = await getClientId();
  if (clientId === '' || userPoolId === '') {
    err('Cognito is not configured (COGNITO_CLIENT_ID / COGNITO_USER_POOL_ID are empty).');
    process.exit(1);
  }
  const provider = cognitoProvider({ client: cognitoIdentityClient, userPoolId, clientId });

  const { slug } = org;
  const specs: UserSpec[] = [
    { role: ROLES.ADMIN, email: `test-admin@${slug}.test`, firstName: 'Test', lastName: 'Admin' },
    { role: ROLES.DISPATCHER, email: `test-dispatcher1@${slug}.test`, firstName: 'Test', lastName: 'DispatcherOne' },
    { role: ROLES.DISPATCHER, email: `test-dispatcher2@${slug}.test`, firstName: 'Test', lastName: 'DispatcherTwo' },
    { role: ROLES.DRIVER, email: `test-driver1@${slug}.test`, firstName: 'Test', lastName: 'DriverOne' },
    { role: ROLES.DRIVER, email: `test-driver2@${slug}.test`, firstName: 'Test', lastName: 'DriverTwo' },
    { role: ROLES.DRIVER, email: `test-driver3@${slug}.test`, firstName: 'Test', lastName: 'DriverThree' },
  ];

  const carrier = await ensureCarrier(org.id);

  out(`\nSeeding ${specs.length} test users into "${org.name}" (${slug})...\n`);
  // Sequential on purpose: ordered output + avoids Cognito admin-API throttling.
  for (const spec of specs) {
    await seedUser(provider, userPoolId, org.id, carrier.id, spec);
  }

  out(`\nDone. All ${specs.length} users share the password:  ${PASSWORD}`);
  out('Log in at the universal /login with any email above.\n');
};

main()
  .catch((error: unknown) => {
    err(error instanceof Error ? (error.stack ?? error.message) : String(error));
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
