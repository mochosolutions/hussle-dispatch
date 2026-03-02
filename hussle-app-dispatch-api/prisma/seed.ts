/**
 * Seed script — creates minimal reference data for development.
 * Run with: npx prisma db seed
 *
 * Creates:
 * - 1 Organization
 * - 1 COMPANY_ASSET carrier + driver + vehicle
 * - 1 EXTERNAL_CARRIER carrier + driver + vehicle
 * - OrgSettings for the organization
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const runSeed = async (): Promise<void> => {
  process.stdout.write('Seeding database...\n');

  // Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Dispatch Co.',
      slug: 'demo-org',
    },
  });

  process.stdout.write(`Organization: ${org.name} (${org.id})\n`);

  // OrgSettings
  await prisma.orgSettings.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
    },
  });

  // COMPANY_ASSET carrier
  const companyCarrier = await prisma.carrier.upsert({
    where: { id: 'seed-carrier-company-asset' },
    update: {},
    create: {
      id: 'seed-carrier-company-asset',
      managedByOrgId: org.id,
      name: 'Demo Fleet LLC',
      type: 'COMPANY_ASSET',
      mcNumber: 'MC-123456',
      dotNumber: '7654321',
      dispatchFeePercent: 10,
      partnerSplitPercent: 50,
    },
  });

  await prisma.driver.upsert({
    where: { id: 'seed-driver-company-1' },
    update: {},
    create: {
      id: 'seed-driver-company-1',
      carrierId: companyCarrier.id,
      name: 'John Smith',
      phone: '555-100-0001',
      cdlState: 'NC',
      homeBaseCity: 'Charlotte',
      homeBaseState: 'NC',
      availableHours: 70,
    },
  });

  await prisma.vehicle.upsert({
    where: { id: 'seed-vehicle-company-1' },
    update: {},
    create: {
      id: 'seed-vehicle-company-1',
      carrierId: companyCarrier.id,
      unitNumber: 'T-001',
      type: 'DRY_VAN',
      ownership: 'OWNED',
      year: 2022,
      make: 'Freightliner',
      model: 'Cascadia',
    },
  });

  process.stdout.write(`COMPANY_ASSET carrier: ${companyCarrier.name}\n`);

  // EXTERNAL_CARRIER carrier
  const externalCarrier = await prisma.carrier.upsert({
    where: { id: 'seed-carrier-external-1' },
    update: {},
    create: {
      id: 'seed-carrier-external-1',
      managedByOrgId: org.id,
      name: 'Independent Trucking Inc.',
      type: 'EXTERNAL_CARRIER',
      mcNumber: 'MC-999888',
      dispatchFeePercent: 8,
      partnerSplitPercent: 50,
      dispatchAgreementOnFile: true,
      insuranceCertOnFile: true,
      insuranceExpiry: new Date('2026-12-31'),
      w9OnFile: true,
    },
  });

  await prisma.driver.upsert({
    where: { id: 'seed-driver-external-1' },
    update: {},
    create: {
      id: 'seed-driver-external-1',
      carrierId: externalCarrier.id,
      name: 'Maria Garcia',
      phone: '555-200-0001',
      cdlState: 'TX',
      homeBaseCity: 'Dallas',
      homeBaseState: 'TX',
      availableHours: 60,
    },
  });

  await prisma.vehicle.upsert({
    where: { id: 'seed-vehicle-external-1' },
    update: {},
    create: {
      id: 'seed-vehicle-external-1',
      carrierId: externalCarrier.id,
      unitNumber: 'EXT-001',
      type: 'REEFER',
      ownership: 'OWNED',
      year: 2021,
      make: 'Kenworth',
      model: 'T680',
    },
  });

  process.stdout.write(`EXTERNAL_CARRIER: ${externalCarrier.name}\n`);
  process.stdout.write('Seed complete.\n');
};

runSeed()
  .catch((error: unknown) => {
    process.stderr.write(`Seed failed: ${String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => {
    prisma.$disconnect().catch(() => {
      // ignore disconnect errors
    });
  });
