/**
 * Seed script — populates the database with realistic demo data
 * for development, testing, and investor demos.
 *
 * Run with: npx prisma db seed
 *
 * Idempotent: uses upsert or deleteMany + create patterns throughout.
 *
 * Creates:
 * - 1 Organization with OrgSettings
 * - 3 Carriers (company asset, owner-operator, external) with drivers + vehicles + expenses
 * - 5 Customers (brokers + direct shippers)
 * - 8 Contacts linked to customers
 * - 5 Places with coordinates
 * - 10 Loads across all status stages with realistic rates + stops
 * - 6 Invoices for delivered/invoiced/paid loads
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helper: date offsets
// ---------------------------------------------------------------------------
const daysAgo = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const daysFromNow = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const runSeed = async (): Promise<void> => {
  process.stdout.write('Seeding database...\n');

  // ---------------------------------------------------------------------------
  // Organization
  // ---------------------------------------------------------------------------
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Apex Dispatch Solutions',
      slug: 'demo-org',
      email: 'dispatch@apexdispatch.com',
    },
  });

  process.stdout.write(`Organization: ${org.name} (${org.id})\n`);

  // ---------------------------------------------------------------------------
  // OrgSettings
  // ---------------------------------------------------------------------------
  await prisma.orgSettings.upsert({
    where: { organizationId: org.id },
    update: {
      defaultTonuFee: 250.0,
      prohibitedCommodities: ['garbage', 'refuse', 'recyclables', 'dirty recyclables'],
      weeklyGrossTarget: 5000.0,
      defaultDetentionRate: 25.0,
      detentionFreeHours: 2,
      minBookRateProfitMargin: 0.15,
      defaultMaxDaysOut: 5,
      chainDepthThresholdMiles: 500,
      backhaulSearchRadiusMiles: 50,
    },
    create: {
      organizationId: org.id,
      defaultTonuFee: 250.0,
      prohibitedCommodities: ['garbage', 'refuse', 'recyclables', 'dirty recyclables'],
      weeklyGrossTarget: 5000.0,
      defaultDetentionRate: 25.0,
      detentionFreeHours: 2,
      minBookRateProfitMargin: 0.15,
      defaultMaxDaysOut: 5,
      chainDepthThresholdMiles: 500,
      backhaulSearchRadiusMiles: 50,
    },
  });

  process.stdout.write('OrgSettings: created with PRD defaults\n');

  // ===========================================================================
  // CUSTOMERS
  // ===========================================================================
  const customerCoyote = await prisma.customer.upsert({
    where: { id: 'seed-customer-coyote' },
    update: {},
    create: {
      id: 'seed-customer-coyote',
      organizationId: org.id,
      type: 'BROKER',
      companyName: 'Coyote Logistics',
      mcNumber: 'MC-568425',
      phone: '800-225-5690',
      email: 'carrier.support@coyote.com',
      address: '2545 W Diversey Ave',
      city: 'Chicago',
      state: 'IL',
      zip: '60647',
      paymentTerms: 'net_30',
      paymentTermsDays: 30,
      quickPayDiscount: 2.5,
    },
  });

  const customerEcho = await prisma.customer.upsert({
    where: { id: 'seed-customer-echo' },
    update: {},
    create: {
      id: 'seed-customer-echo',
      organizationId: org.id,
      type: 'BROKER',
      companyName: 'Echo Global Logistics',
      mcNumber: 'MC-512190',
      phone: '800-354-7993',
      email: 'settlements@echo.com',
      address: '600 W Chicago Ave',
      city: 'Chicago',
      state: 'IL',
      zip: '60654',
      paymentTerms: 'net_30',
      paymentTermsDays: 30,
      quickPayDiscount: 3.0,
    },
  });

  const customerAce = await prisma.customer.upsert({
    where: { id: 'seed-customer-ace' },
    update: {},
    create: {
      id: 'seed-customer-ace',
      organizationId: org.id,
      type: 'DIRECT_SHIPPER',
      companyName: 'Ace Manufacturing Corp.',
      phone: '704-555-0100',
      email: 'shipping@acemfg.com',
      address: '1200 Industrial Blvd',
      city: 'Charlotte',
      state: 'NC',
      zip: '28201',
      paymentTerms: 'net_15',
      paymentTermsDays: 15,
    },
  });

  const customerSunbelt = await prisma.customer.upsert({
    where: { id: 'seed-customer-sunbelt' },
    update: {},
    create: {
      id: 'seed-customer-sunbelt',
      organizationId: org.id,
      type: 'DIRECT_SHIPPER',
      companyName: 'Sunbelt Building Products',
      phone: '214-555-0340',
      email: 'logistics@sunbeltproducts.com',
      address: '8900 Commerce Pkwy',
      city: 'Dallas',
      state: 'TX',
      zip: '75247',
      paymentTerms: 'net_30',
      paymentTermsDays: 30,
    },
  });

  const customerPremier = await prisma.customer.upsert({
    where: { id: 'seed-customer-premier' },
    update: {},
    create: {
      id: 'seed-customer-premier',
      organizationId: org.id,
      type: 'THREE_PL',
      companyName: 'Premier Supply Chain',
      mcNumber: 'MC-891234',
      phone: '404-555-0280',
      email: 'dispatch@premiersc.com',
      address: '2200 Peachtree Rd NE',
      city: 'Atlanta',
      state: 'GA',
      zip: '30309',
      paymentTerms: 'net_30',
      paymentTermsDays: 30,
      quickPayDiscount: 2.0,
    },
  });

  process.stdout.write('Customers: 5 created (2 brokers, 2 direct shippers, 1 3PL)\n');

  // ===========================================================================
  // CONTACTS (linked to customers)
  // ===========================================================================
  await prisma.contact.upsert({
    where: { id: 'seed-contact-1' },
    update: {},
    create: {
      id: 'seed-contact-1',
      organizationId: org.id,
      customerId: customerCoyote.id,
      firstName: 'Sarah',
      lastName: 'Mitchell',
      role: 'Carrier Rep',
      phone: '800-225-5690 x4521',
      email: 'smitchell@coyote.com',
    },
  });

  await prisma.contact.upsert({
    where: { id: 'seed-contact-2' },
    update: {},
    create: {
      id: 'seed-contact-2',
      organizationId: org.id,
      customerId: customerEcho.id,
      firstName: 'Marcus',
      lastName: 'Rivera',
      role: 'Load Coordinator',
      phone: '800-354-7993 x2100',
      email: 'mrivera@echo.com',
    },
  });

  await prisma.contact.upsert({
    where: { id: 'seed-contact-3' },
    update: {},
    create: {
      id: 'seed-contact-3',
      organizationId: org.id,
      customerId: customerAce.id,
      firstName: 'Dave',
      lastName: 'Kowalski',
      role: 'Shipping Manager',
      phone: '704-555-0101',
      email: 'dkowalski@acemfg.com',
      notes: 'Dock hours 06:00-16:00 Mon-Fri. Appointment required.',
    },
  });

  await prisma.contact.upsert({
    where: { id: 'seed-contact-4' },
    update: {},
    create: {
      id: 'seed-contact-4',
      organizationId: org.id,
      customerId: customerSunbelt.id,
      firstName: 'Angela',
      lastName: 'Torres',
      role: 'Logistics Coordinator',
      phone: '214-555-0341',
      email: 'atorres@sunbeltproducts.com',
    },
  });

  await prisma.contact.upsert({
    where: { id: 'seed-contact-5' },
    update: {},
    create: {
      id: 'seed-contact-5',
      organizationId: org.id,
      customerId: customerPremier.id,
      firstName: 'James',
      lastName: 'Whitfield',
      role: 'Dispatch Manager',
      phone: '404-555-0281',
      email: 'jwhitfield@premiersc.com',
    },
  });

  await prisma.contact.upsert({
    where: { id: 'seed-contact-6' },
    update: {},
    create: {
      id: 'seed-contact-6',
      organizationId: org.id,
      firstName: 'Linda',
      lastName: 'Chen',
      role: 'Receiving Dock Manager',
      phone: '312-555-0200',
      email: 'lchen@midwestdc.com',
      notes: 'Live unload only. Lumper required.',
    },
  });

  await prisma.contact.upsert({
    where: { id: 'seed-contact-7' },
    update: {},
    create: {
      id: 'seed-contact-7',
      organizationId: org.id,
      firstName: 'Ray',
      lastName: 'Patterson',
      role: 'Warehouse Supervisor',
      phone: '713-555-0150',
      email: 'rpatterson@gulfcoastdist.com',
    },
  });

  await prisma.contact.upsert({
    where: { id: 'seed-contact-8' },
    update: {},
    create: {
      id: 'seed-contact-8',
      organizationId: org.id,
      firstName: 'Kim',
      lastName: 'Nguyen',
      role: 'Operations Coordinator',
      phone: '615-555-0310',
      email: 'knguyen@nashvilledist.com',
    },
  });

  process.stdout.write('Contacts: 8 created\n');

  // ===========================================================================
  // CARRIERS
  // ===========================================================================
  const companyCarrier = await prisma.carrier.upsert({
    where: { id: 'seed-carrier-company-asset' },
    update: { status: 'ACTIVE' },
    create: {
      id: 'seed-carrier-company-asset',
      managedByOrgId: org.id,
      name: 'Apex Fleet Services LLC',
      type: 'COMPANY_ASSET',
      mcNumber: 'MC-842196',
      dotNumber: '3654812',
      primaryContactName: 'Tom Bradley',
      primaryContactPhone: '704-555-9000',
      primaryContactEmail: 'tbradley@apexfleet.com',
      dispatchFeePercent: 10,
      partnerSplitPercent: 50,
      city: 'Charlotte',
      state: 'NC',
      authorityStatus: 'active',
      status: 'ACTIVE',
      dispatchAgreementOnFile: true,
      dispatchAgreementSignedAt: new Date('2025-01-15'),
      insuranceCertOnFile: true,
      insuranceExpiry: new Date('2027-01-15'),
      w9OnFile: true,
      carrierPacketOnFile: true,
    },
  });

  const ownerOpCarrier = await prisma.carrier.upsert({
    where: { id: 'seed-carrier-owner-op-1' },
    update: { status: 'ACTIVE' },
    create: {
      id: 'seed-carrier-owner-op-1',
      managedByOrgId: org.id,
      name: 'Williams Trucking',
      type: 'OWNER_OPERATOR',
      mcNumber: 'MC-615903',
      dotNumber: '2918473',
      phone: '615-555-0700',
      email: 'cwilliams@williamstrucking.com',
      primaryContactName: 'Carlos Williams',
      primaryContactPhone: '615-555-0700',
      primaryContactEmail: 'cwilliams@williamstrucking.com',
      city: 'Nashville',
      state: 'TN',
      dispatchFeePercent: 12,
      partnerSplitPercent: 50,
      authorityStatus: 'active',
      status: 'ACTIVE',
      dispatchAgreementOnFile: true,
      dispatchAgreementSignedAt: new Date('2025-03-10'),
      insuranceCertOnFile: true,
      insuranceExpiry: new Date('2026-09-30'),
      w9OnFile: true,
      carrierPacketOnFile: true,
    },
  });

  const externalCarrier = await prisma.carrier.upsert({
    where: { id: 'seed-carrier-external-1' },
    update: { status: 'ACTIVE' },
    create: {
      id: 'seed-carrier-external-1',
      managedByOrgId: org.id,
      name: 'Lone Star Express',
      type: 'EXTERNAL_CARRIER',
      mcNumber: 'MC-999888',
      dotNumber: '1122334',
      phone: '214-555-0800',
      email: 'dispatch@lonestarexpress.com',
      primaryContactName: 'Maria Garcia',
      primaryContactPhone: '214-555-0801',
      primaryContactEmail: 'mgarcia@lonestarexpress.com',
      city: 'Dallas',
      state: 'TX',
      dispatchFeePercent: 8,
      partnerSplitPercent: 50,
      dispatchAgreementOnFile: true,
      dispatchAgreementSignedAt: new Date('2025-06-15'),
      insuranceCertOnFile: true,
      insuranceExpiry: new Date('2026-12-31'),
      w9OnFile: true,
      carrierPacketOnFile: true,
      authorityStatus: 'active',
      status: 'ACTIVE',
    },
  });

  process.stdout.write(
    `Carriers: ${companyCarrier.name}, ${ownerOpCarrier.name}, ${externalCarrier.name}\n`,
  );

  // ===========================================================================
  // DRIVERS
  // ===========================================================================
  await prisma.driver.upsert({
    where: { id: 'seed-driver-company-1' },
    update: {},
    create: {
      id: 'seed-driver-company-1',
      carrierId: companyCarrier.id,
      firstName: 'John',
      lastName: 'Smith',
      phone: '704-555-1001',
      email: 'jsmith@apexfleet.com',
      licenseNumber: 'C4821965',
      licenseState: 'NC',
      licenseExpiry: new Date('2028-06-15'),
      homeBaseCity: 'Charlotte',
      homeBaseState: 'NC',
      currentCity: 'Charlotte',
      currentState: 'NC',
      availableHours: 70,
      maxDaysOut: 5,
      preferredLanes: {
        origins: [
          { state: 'NC', city: 'Charlotte' },
          { state: 'SC', city: 'Greenville' },
        ],
        destinations: [
          { state: 'GA', city: 'Atlanta' },
          { state: 'TN', city: 'Nashville' },
          { state: 'FL', city: 'Orlando' },
        ],
        notes: 'Prefers Southeast regional lanes, home weekly',
      },
      noGoZones: {
        states: ['CA', 'OR', 'WA'],
        cities: [],
        notes: 'No West Coast — too far from home base',
      },
      isAvailable: true,
    },
  });

  await prisma.driver.upsert({
    where: { id: 'seed-driver-company-2' },
    update: {},
    create: {
      id: 'seed-driver-company-2',
      carrierId: companyCarrier.id,
      firstName: 'Robert',
      lastName: 'Johnson',
      phone: '404-555-1002',
      email: 'rjohnson@apexfleet.com',
      licenseNumber: 'G7291034',
      licenseState: 'GA',
      licenseExpiry: new Date('2027-11-30'),
      homeBaseCity: 'Atlanta',
      homeBaseState: 'GA',
      currentCity: 'Atlanta',
      currentState: 'GA',
      availableHours: 65,
      maxDaysOut: 7,
      preferredLanes: {
        origins: [
          { state: 'GA', city: 'Atlanta' },
          { state: 'TN', city: 'Chattanooga' },
        ],
        destinations: [
          { state: 'OH', city: 'Columbus' },
          { state: 'IN', city: 'Indianapolis' },
          { state: 'IL', city: 'Chicago' },
        ],
        notes: 'Prefers Midwest-bound lanes from Southeast origin',
      },
      noGoZones: {
        states: ['NY', 'NJ'],
        cities: [{ state: 'CA', city: 'Los Angeles' }],
        notes: 'Avoids Northeast metro congestion',
      },
      isAvailable: true,
    },
  });

  await prisma.driver.upsert({
    where: { id: 'seed-driver-ownerop-1' },
    update: {},
    create: {
      id: 'seed-driver-ownerop-1',
      carrierId: ownerOpCarrier.id,
      firstName: 'Carlos',
      lastName: 'Williams',
      phone: '615-555-0700',
      email: 'cwilliams@williamstrucking.com',
      licenseNumber: 'T5632184',
      licenseState: 'TN',
      licenseExpiry: new Date('2028-03-01'),
      homeBaseCity: 'Nashville',
      homeBaseState: 'TN',
      currentCity: 'Nashville',
      currentState: 'TN',
      availableHours: 55,
      maxDaysOut: 10,
      preferredLanes: {
        origins: [{ state: 'TN', city: 'Nashville' }],
        destinations: [
          { state: 'TX', city: 'Dallas' },
          { state: 'TX', city: 'Houston' },
          { state: 'LA', city: 'New Orleans' },
        ],
        notes: 'OTR - comfortable with 1000+ mile runs',
      },
      noGoZones: {
        states: [],
        cities: [{ state: 'NY', city: 'New York City' }],
        notes: 'Avoids NYC metro due to tolls and congestion',
      },
      isAvailable: true,
    },
  });

  await prisma.driver.upsert({
    where: { id: 'seed-driver-external-1' },
    update: {},
    create: {
      id: 'seed-driver-external-1',
      carrierId: externalCarrier.id,
      firstName: 'Maria',
      lastName: 'Garcia',
      phone: '214-555-0801',
      email: 'mgarcia@lonestarexpress.com',
      licenseNumber: 'X9182736',
      licenseState: 'TX',
      licenseExpiry: new Date('2027-08-15'),
      homeBaseCity: 'Dallas',
      homeBaseState: 'TX',
      currentCity: 'Houston',
      currentState: 'TX',
      availableHours: 60,
      maxDaysOut: 10,
      preferredLanes: {
        origins: [
          { state: 'TX', city: 'Dallas' },
          { state: 'TX', city: 'Houston' },
        ],
        destinations: [
          { state: 'IL', city: 'Chicago' },
          { state: 'MO', city: 'Kansas City' },
          { state: 'CO', city: 'Denver' },
        ],
        notes: 'Prefers long-haul Midwest and Mountain West runs from TX',
      },
      noGoZones: {
        states: ['ME', 'VT', 'NH', 'RI'],
        cities: [],
        notes: 'Avoids New England — no freight density for return loads',
      },
      isAvailable: true,
    },
  });

  process.stdout.write('Drivers: 4 created across 3 carriers\n');

  // ===========================================================================
  // VEHICLES
  // ===========================================================================
  const vehicle1 = await prisma.vehicle.upsert({
    where: { id: 'seed-vehicle-company-1' },
    update: {},
    create: {
      id: 'seed-vehicle-company-1',
      carrierId: companyCarrier.id,
      unitNumber: 'TRUCK-001',
      type: 'DRY_VAN',
      ownership: 'OWNED',
      year: 2022,
      make: 'Freightliner',
      model: 'Cascadia 126',
      vin: '3AKJHHDR5NSLA4821',
      licensePlate: 'NC-TRK-4821',
      licensePlateState: 'NC',
      monthlyGrossTarget: 5000.0,
      monthlyMilesTarget: 10000,
      workingDaysPerMonth: 22,
      isActive: true,
    },
  });

  const vehicle2 = await prisma.vehicle.upsert({
    where: { id: 'seed-vehicle-company-2' },
    update: {},
    create: {
      id: 'seed-vehicle-company-2',
      carrierId: companyCarrier.id,
      unitNumber: 'TRUCK-002',
      type: 'FLATBED',
      ownership: 'OWNED',
      year: 2021,
      make: 'Kenworth',
      model: 'W900L',
      vin: '1XKWD49X1LR671293',
      licensePlate: 'NC-TRK-6712',
      licensePlateState: 'NC',
      monthlyGrossTarget: 6000.0,
      monthlyMilesTarget: 11000,
      workingDaysPerMonth: 22,
      isActive: true,
    },
  });

  const vehicle3 = await prisma.vehicle.upsert({
    where: { id: 'seed-vehicle-ownerop-1' },
    update: {},
    create: {
      id: 'seed-vehicle-ownerop-1',
      carrierId: ownerOpCarrier.id,
      unitNumber: 'CW-100',
      type: 'DRY_VAN',
      ownership: 'OWNED',
      year: 2023,
      make: 'Peterbilt',
      model: '579',
      vin: '1XPBD49X5PD532186',
      licensePlate: 'TN-TRK-5321',
      licensePlateState: 'TN',
      monthlyGrossTarget: 5500.0,
      monthlyMilesTarget: 11000,
      workingDaysPerMonth: 24,
      isActive: true,
    },
  });

  const vehicle4 = await prisma.vehicle.upsert({
    where: { id: 'seed-vehicle-external-1' },
    update: {},
    create: {
      id: 'seed-vehicle-external-1',
      carrierId: externalCarrier.id,
      unitNumber: 'LSE-201',
      type: 'REEFER',
      ownership: 'OWNED',
      year: 2021,
      make: 'Kenworth',
      model: 'T680',
      vin: '1XKTD40X6LJ891045',
      licensePlate: 'TX-TRK-8910',
      licensePlateState: 'TX',
      monthlyGrossTarget: 6500.0,
      monthlyMilesTarget: 12000,
      workingDaysPerMonth: 26,
      isActive: true,
    },
  });

  process.stdout.write('Vehicles: 4 created\n');

  // ---------------------------------------------------------------------------
  // TruckExpenses
  // ---------------------------------------------------------------------------
  const allExpenses = [
    // Vehicle 1 — dry van
    { vehicleId: vehicle1.id, category: 'FIXED' as const, expenseKey: 'truck_payment', label: 'Truck Payment', monthlyAmount: 2200.0 },
    { vehicleId: vehicle1.id, category: 'FIXED' as const, expenseKey: 'trailer_payment', label: 'Trailer Payment', monthlyAmount: 650.0 },
    { vehicleId: vehicle1.id, category: 'FIXED' as const, expenseKey: 'insurance', label: 'Insurance', monthlyAmount: 900.0 },
    { vehicleId: vehicle1.id, category: 'VARIABLE' as const, expenseKey: 'fuel', label: 'Fuel', monthlyAmount: 3200.0 },
    { vehicleId: vehicle1.id, category: 'VARIABLE' as const, expenseKey: 'tires', label: 'Tires (amortized)', monthlyAmount: 400.0 },
    { vehicleId: vehicle1.id, category: 'VARIABLE' as const, expenseKey: 'tolls', label: 'Tolls & Scales', monthlyAmount: 150.0 },
    { vehicleId: vehicle1.id, category: 'SERVICE' as const, expenseKey: 'oil_change', label: 'Oil Change & Filters', monthlyAmount: 300.0 },
    { vehicleId: vehicle1.id, category: 'SERVICE' as const, expenseKey: 'repairs', label: 'Repairs & Maintenance', monthlyAmount: 500.0 },
    // Vehicle 2 — flatbed
    { vehicleId: vehicle2.id, category: 'FIXED' as const, expenseKey: 'truck_payment', label: 'Truck Payment', monthlyAmount: 2800.0 },
    { vehicleId: vehicle2.id, category: 'FIXED' as const, expenseKey: 'flatbed_payment', label: 'Flatbed Trailer Payment', monthlyAmount: 750.0 },
    { vehicleId: vehicle2.id, category: 'FIXED' as const, expenseKey: 'insurance', label: 'Insurance', monthlyAmount: 1050.0 },
    { vehicleId: vehicle2.id, category: 'VARIABLE' as const, expenseKey: 'fuel', label: 'Fuel', monthlyAmount: 3600.0 },
    { vehicleId: vehicle2.id, category: 'VARIABLE' as const, expenseKey: 'tires', label: 'Tires (amortized)', monthlyAmount: 500.0 },
    { vehicleId: vehicle2.id, category: 'VARIABLE' as const, expenseKey: 'tarps_straps', label: 'Tarps & Straps', monthlyAmount: 120.0 },
    { vehicleId: vehicle2.id, category: 'SERVICE' as const, expenseKey: 'oil_change', label: 'Oil Change & Filters', monthlyAmount: 320.0 },
    { vehicleId: vehicle2.id, category: 'SERVICE' as const, expenseKey: 'repairs', label: 'Repairs & Maintenance', monthlyAmount: 650.0 },
    // Vehicle 3 — owner-op dry van
    { vehicleId: vehicle3.id, category: 'FIXED' as const, expenseKey: 'truck_payment', label: 'Truck Payment', monthlyAmount: 2600.0 },
    { vehicleId: vehicle3.id, category: 'FIXED' as const, expenseKey: 'trailer_payment', label: 'Trailer Lease', monthlyAmount: 700.0 },
    { vehicleId: vehicle3.id, category: 'FIXED' as const, expenseKey: 'insurance', label: 'Insurance', monthlyAmount: 950.0 },
    { vehicleId: vehicle3.id, category: 'VARIABLE' as const, expenseKey: 'fuel', label: 'Fuel', monthlyAmount: 3400.0 },
    { vehicleId: vehicle3.id, category: 'SERVICE' as const, expenseKey: 'repairs', label: 'Repairs & Maintenance', monthlyAmount: 450.0 },
    // Vehicle 4 — reefer
    { vehicleId: vehicle4.id, category: 'FIXED' as const, expenseKey: 'truck_payment', label: 'Truck Payment', monthlyAmount: 3100.0 },
    { vehicleId: vehicle4.id, category: 'FIXED' as const, expenseKey: 'reefer_payment', label: 'Reefer Trailer Payment', monthlyAmount: 900.0 },
    { vehicleId: vehicle4.id, category: 'FIXED' as const, expenseKey: 'insurance', label: 'Insurance (incl. Cargo)', monthlyAmount: 1200.0 },
    { vehicleId: vehicle4.id, category: 'VARIABLE' as const, expenseKey: 'fuel', label: 'Fuel (truck + reefer)', monthlyAmount: 4100.0 },
    { vehicleId: vehicle4.id, category: 'VARIABLE' as const, expenseKey: 'tires', label: 'Tires (amortized)', monthlyAmount: 550.0 },
    { vehicleId: vehicle4.id, category: 'SERVICE' as const, expenseKey: 'reefer_service', label: 'Reefer Unit Service', monthlyAmount: 600.0 },
  ];

  for (const expense of allExpenses) {
    await prisma.truckExpense.upsert({
      where: { vehicleId_expenseKey: { vehicleId: expense.vehicleId, expenseKey: expense.expenseKey } },
      update: {},
      create: expense,
    });
  }

  process.stdout.write('TruckExpenses: created for all vehicles\n');

  // ---------------------------------------------------------------------------
  // Driver-Vehicle assignments
  // ---------------------------------------------------------------------------
  await prisma.vehicle.update({ where: { id: vehicle1.id }, data: { driverId: 'seed-driver-company-1' } });
  await prisma.vehicle.update({ where: { id: vehicle2.id }, data: { driverId: 'seed-driver-company-2' } });
  await prisma.vehicle.update({ where: { id: vehicle3.id }, data: { driverId: 'seed-driver-ownerop-1' } });
  await prisma.vehicle.update({ where: { id: vehicle4.id }, data: { driverId: 'seed-driver-external-1' } });

  process.stdout.write('Driver-Vehicle assignments: 4 created\n');

  // ---------------------------------------------------------------------------
  // CarrierNotes
  // ---------------------------------------------------------------------------
  await prisma.carrierNote.deleteMany({
    where: { carrierId: { in: [companyCarrier.id, ownerOpCarrier.id, externalCarrier.id] } },
  });

  await prisma.carrierNote.createMany({
    data: [
      { carrierId: companyCarrier.id, text: 'Company asset carrier. All docs current through 2027.', authorName: 'System' },
      { carrierId: companyCarrier.id, text: 'Prefers Southeast regional lanes. Excellent communication.', authorName: 'Tom Bradley' },
      { carrierId: ownerOpCarrier.id, text: 'Owner-op, single truck. Reliable on long-haul SE to Midwest.', authorName: 'System' },
      { carrierId: ownerOpCarrier.id, text: 'Insurance expiring Sep 2026 — flag for renewal 60 days out.', authorName: 'System' },
      { carrierId: externalCarrier.id, text: 'External carrier based in Dallas. Reefer-equipped.', authorName: 'System' },
      { carrierId: externalCarrier.id, text: 'Driver Maria prefers TX-origin long-haul to Midwest/Mountain West.', authorName: 'System' },
    ],
  });

  process.stdout.write('CarrierNotes: created\n');

  // ===========================================================================
  // PLACES
  // ===========================================================================
  await prisma.place.upsert({
    where: { id: 'seed-place-charlotte-warehouse' },
    update: {},
    create: {
      id: 'seed-place-charlotte-warehouse',
      organizationId: org.id,
      contactId: 'seed-contact-3',
      customerId: customerAce.id,
      name: 'Ace Manufacturing — Charlotte',
      address: '1200 Industrial Blvd',
      city: 'Charlotte',
      state: 'NC',
      zip: '28201',
      latitude: 35.2271,
      longitude: -80.8431,
      geoSource: 'AUTO',
      facilityType: 'MANUFACTURING',
      operatingHours: 'Mon-Fri 06:00-16:00',
      receivingHours: 'Mon-Fri 06:00-15:30',
      appointmentRequired: true,
      dockType: 'DOCK_HIGH',
      contactName: 'Dave Kowalski',
      contactPhone: '704-555-0101',
      checkInProcedures: 'Check in at guard shack with BOL and driver ID. Wait for dock assignment.',
      lumperRequired: false,
      ppeRequired: true,
      notes: 'Safety vest and steel-toed boots required on dock.',
    },
  });

  await prisma.place.upsert({
    where: { id: 'seed-place-chicago-dc' },
    update: {},
    create: {
      id: 'seed-place-chicago-dc',
      organizationId: org.id,
      contactId: 'seed-contact-6',
      name: 'Midwest Distribution Center — Chicago',
      address: '4500 Logistics Way',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      latitude: 41.8781,
      longitude: -87.6298,
      geoSource: 'AUTO',
      facilityType: 'DISTRIBUTION_CENTER',
      operatingHours: 'Mon-Sat 05:00-22:00',
      receivingHours: 'Mon-Sat 06:00-18:00',
      appointmentRequired: true,
      dockType: 'DOCK_HIGH',
      contactName: 'Linda Chen',
      contactPhone: '312-555-0200',
      checkInProcedures: 'Pre-register BOL in portal 24h before arrival. Check in at dock office.',
      lumperRequired: true,
      ppeRequired: false,
      notes: 'Average unload time 3-4 hours. Detention kicks in after 2 free hours.',
    },
  });

  await prisma.place.upsert({
    where: { id: 'seed-place-atlanta-dropyard' },
    update: {},
    create: {
      id: 'seed-place-atlanta-dropyard',
      organizationId: org.id,
      name: 'Atlanta Drop Yard — Fulton Industrial',
      address: '800 Fulton Industrial Blvd SW',
      city: 'Atlanta',
      state: 'GA',
      zip: '30336',
      latitude: 33.749,
      longitude: -84.388,
      geoSource: 'MANUAL',
      facilityType: 'DROP_YARD',
      operatingHours: '24/7',
      appointmentRequired: false,
      dockType: 'NONE',
      checkInProcedures: 'Open lot — no check-in. Text dispatcher with unit number on drop.',
      lumperRequired: false,
      ppeRequired: false,
      notes: 'Secure fenced yard. Relay point for SE-to-Midwest loads.',
    },
  });

  await prisma.place.upsert({
    where: { id: 'seed-place-dallas-warehouse' },
    update: {},
    create: {
      id: 'seed-place-dallas-warehouse',
      organizationId: org.id,
      contactId: 'seed-contact-4',
      customerId: customerSunbelt.id,
      name: 'Sunbelt Products — Dallas',
      address: '8900 Commerce Pkwy',
      city: 'Dallas',
      state: 'TX',
      zip: '75247',
      latitude: 32.7767,
      longitude: -96.797,
      geoSource: 'AUTO',
      facilityType: 'WAREHOUSE',
      operatingHours: 'Mon-Fri 07:00-17:00',
      receivingHours: 'Mon-Fri 08:00-16:00',
      appointmentRequired: true,
      dockType: 'DOCK_HIGH',
      contactName: 'Angela Torres',
      contactPhone: '214-555-0341',
      checkInProcedures: 'Check in at shipping office. Present BOL.',
      lumperRequired: false,
      ppeRequired: true,
    },
  });

  await prisma.place.upsert({
    where: { id: 'seed-place-houston-terminal' },
    update: {},
    create: {
      id: 'seed-place-houston-terminal',
      organizationId: org.id,
      contactId: 'seed-contact-7',
      name: 'Gulf Coast Distribution — Houston',
      address: '12400 Bay Area Blvd',
      city: 'Houston',
      state: 'TX',
      zip: '77058',
      latitude: 29.7604,
      longitude: -95.3698,
      geoSource: 'AUTO',
      facilityType: 'DISTRIBUTION_CENTER',
      operatingHours: 'Mon-Sat 06:00-20:00',
      receivingHours: 'Mon-Fri 07:00-17:00',
      appointmentRequired: true,
      dockType: 'BOTH',
      contactName: 'Ray Patterson',
      contactPhone: '713-555-0150',
      lumperRequired: false,
      ppeRequired: true,
      notes: 'Hard hats required in warehouse area.',
    },
  });

  process.stdout.write('Places: 5 created with coordinates\n');

  // ===========================================================================
  // LOADS — 10 loads across all status stages
  // ===========================================================================
  // Delete existing seed loads and their stops first (cascade)
  const seedLoadIds = [
    'seed-load-1', 'seed-load-2', 'seed-load-3', 'seed-load-4', 'seed-load-5',
    'seed-load-6', 'seed-load-7', 'seed-load-8', 'seed-load-9', 'seed-load-10',
  ];
  await prisma.stop.deleteMany({ where: { loadId: { in: seedLoadIds } } });
  await prisma.invoice.deleteMany({ where: { loadId: { in: seedLoadIds } } });
  await prisma.load.deleteMany({ where: { id: { in: seedLoadIds } } });

  // Load 1 — PAID (Charlotte → Chicago, delivered last week)
  await prisma.load.create({
    data: {
      id: 'seed-load-1',
      organizationId: org.id,
      loadNumber: 'LD-2026-000001',
      carrierId: companyCarrier.id,
      driverId: 'seed-driver-company-1',
      vehicleId: vehicle1.id,
      contactId: 'seed-contact-1',
      customerId: customerCoyote.id,
      externalRefNumber: 'COY-482916',
      equipmentType: 'DRY_VAN',
      commodity: 'Auto Parts',
      weight: 38000,
      pieceCount: 24,
      loadedMiles: 756,
      deadheadMiles: 15,
      totalMiles: 771,
      customerRate: 2850.0,
      carrierRate: 2565.0,
      dispatchFee: 285.0,
      ratePerMile: 3.77,
      status: 'PAID',
      invoiceReadiness: 'INVOICE_CREATED',
      rateConReceivedAt: daysAgo(14),
      bolSignedAt: daysAgo(8),
      dispatcherNotes: 'Regular lane — good rate.',
      createdAt: daysAgo(14),
      updatedAt: daysAgo(3),
      stops: {
        create: [
          { type: 'PICKUP', sequence: 1, placeId: 'seed-place-charlotte-warehouse', facilityName: 'Ace Manufacturing', city: 'Charlotte', state: 'NC', address: '1200 Industrial Blvd', zip: '28201', appointmentDate: daysAgo(10), appointmentTime: '08:00', arrivalTime: daysAgo(10), departureTime: daysAgo(10) },
          { type: 'DELIVERY', sequence: 2, placeId: 'seed-place-chicago-dc', facilityName: 'Midwest Distribution Center', city: 'Chicago', state: 'IL', address: '4500 Logistics Way', zip: '60601', appointmentDate: daysAgo(8), appointmentTime: '14:00', arrivalTime: daysAgo(8), departureTime: daysAgo(8) },
        ],
      },
    },
  });

  // Load 2 — INVOICED (Dallas → Houston, delivered 5 days ago)
  await prisma.load.create({
    data: {
      id: 'seed-load-2',
      organizationId: org.id,
      loadNumber: 'LD-2026-000002',
      carrierId: externalCarrier.id,
      driverId: 'seed-driver-external-1',
      vehicleId: vehicle4.id,
      contactId: 'seed-contact-4',
      customerId: customerSunbelt.id,
      equipmentType: 'REEFER',
      commodity: 'Frozen Poultry',
      weight: 42000,
      pieceCount: 18,
      loadedMiles: 239,
      deadheadMiles: 25,
      totalMiles: 264,
      customerRate: 1850.0,
      carrierRate: 1702.0,
      dispatchFee: 148.0,
      ratePerMile: 7.74,
      status: 'INVOICED',
      invoiceReadiness: 'INVOICE_CREATED',
      rateConReceivedAt: daysAgo(8),
      bolSignedAt: daysAgo(5),
      createdAt: daysAgo(8),
      updatedAt: daysAgo(2),
      stops: {
        create: [
          { type: 'PICKUP', sequence: 1, placeId: 'seed-place-dallas-warehouse', facilityName: 'Sunbelt Products', city: 'Dallas', state: 'TX', address: '8900 Commerce Pkwy', zip: '75247', appointmentDate: daysAgo(6), appointmentTime: '09:00', arrivalTime: daysAgo(6), departureTime: daysAgo(6) },
          { type: 'DELIVERY', sequence: 2, placeId: 'seed-place-houston-terminal', facilityName: 'Gulf Coast Distribution', city: 'Houston', state: 'TX', address: '12400 Bay Area Blvd', zip: '77058', appointmentDate: daysAgo(5), appointmentTime: '13:00', arrivalTime: daysAgo(5), departureTime: daysAgo(5) },
        ],
      },
    },
  });

  // Load 3 — DELIVERED (Atlanta → Charlotte, awaiting invoice)
  await prisma.load.create({
    data: {
      id: 'seed-load-3',
      organizationId: org.id,
      loadNumber: 'LD-2026-000003',
      carrierId: companyCarrier.id,
      driverId: 'seed-driver-company-2',
      vehicleId: vehicle2.id,
      contactId: 'seed-contact-5',
      customerId: customerPremier.id,
      externalRefNumber: 'PSC-10492',
      equipmentType: 'FLATBED',
      commodity: 'Steel Beams',
      weight: 44000,
      pieceCount: 6,
      loadedMiles: 244,
      deadheadMiles: 10,
      totalMiles: 254,
      customerRate: 2200.0,
      carrierRate: 1980.0,
      dispatchFee: 220.0,
      ratePerMile: 9.02,
      status: 'DELIVERED',
      invoiceReadiness: 'READY',
      rateConReceivedAt: daysAgo(5),
      bolSignedAt: daysAgo(2),
      isTarp: true,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(2),
      stops: {
        create: [
          { type: 'PICKUP', sequence: 1, placeId: 'seed-place-atlanta-dropyard', facilityName: 'Atlanta Drop Yard', city: 'Atlanta', state: 'GA', address: '800 Fulton Industrial Blvd SW', zip: '30336', appointmentDate: daysAgo(3), appointmentTime: '07:00', arrivalTime: daysAgo(3), departureTime: daysAgo(3) },
          { type: 'DELIVERY', sequence: 2, placeId: 'seed-place-charlotte-warehouse', facilityName: 'Ace Manufacturing', city: 'Charlotte', state: 'NC', address: '1200 Industrial Blvd', zip: '28201', appointmentDate: daysAgo(2), appointmentTime: '10:00', arrivalTime: daysAgo(2), departureTime: daysAgo(2) },
        ],
      },
    },
  });

  // Load 4 — IN_TRANSIT (Charlotte → Atlanta)
  await prisma.load.create({
    data: {
      id: 'seed-load-4',
      organizationId: org.id,
      loadNumber: 'LD-2026-000004',
      carrierId: companyCarrier.id,
      driverId: 'seed-driver-company-1',
      vehicleId: vehicle1.id,
      contactId: 'seed-contact-2',
      customerId: customerEcho.id,
      externalRefNumber: 'ECHO-78421',
      equipmentType: 'DRY_VAN',
      commodity: 'Consumer Electronics',
      weight: 32000,
      pieceCount: 42,
      loadedMiles: 244,
      deadheadMiles: 0,
      totalMiles: 244,
      customerRate: 1650.0,
      carrierRate: 1485.0,
      dispatchFee: 165.0,
      ratePerMile: 6.76,
      status: 'IN_TRANSIT',
      rateConReceivedAt: daysAgo(2),
      driverInstructions: 'Receiver requires appointment confirmation 2hr before arrival.',
      createdAt: daysAgo(2),
      updatedAt: daysAgo(0),
      stops: {
        create: [
          { type: 'PICKUP', sequence: 1, placeId: 'seed-place-charlotte-warehouse', facilityName: 'Ace Manufacturing', city: 'Charlotte', state: 'NC', address: '1200 Industrial Blvd', zip: '28201', appointmentDate: daysAgo(1), appointmentTime: '06:00', arrivalTime: daysAgo(1), departureTime: daysAgo(1) },
          { type: 'DELIVERY', sequence: 2, placeId: 'seed-place-atlanta-dropyard', facilityName: 'Atlanta Drop Yard', city: 'Atlanta', state: 'GA', address: '800 Fulton Industrial Blvd SW', zip: '30336', appointmentDate: daysFromNow(0), appointmentTime: '14:00' },
        ],
      },
    },
  });

  // Load 5 — DISPATCHED (Nashville → Dallas)
  await prisma.load.create({
    data: {
      id: 'seed-load-5',
      organizationId: org.id,
      loadNumber: 'LD-2026-000005',
      carrierId: ownerOpCarrier.id,
      driverId: 'seed-driver-ownerop-1',
      vehicleId: vehicle3.id,
      contactId: 'seed-contact-1',
      customerId: customerCoyote.id,
      externalRefNumber: 'COY-503718',
      equipmentType: 'DRY_VAN',
      commodity: 'Paper Products',
      weight: 36000,
      pieceCount: 30,
      loadedMiles: 660,
      deadheadMiles: 20,
      totalMiles: 680,
      customerRate: 2100.0,
      carrierRate: 1848.0,
      dispatchFee: 252.0,
      ratePerMile: 3.18,
      status: 'DISPATCHED',
      rateConReceivedAt: daysAgo(1),
      driverInstructions: 'Driver has rate con and BOL. Pickup appointment confirmed.',
      createdAt: daysAgo(1),
      updatedAt: daysAgo(0),
      stops: {
        create: [
          { type: 'PICKUP', sequence: 1, facilityName: 'Nashville Paper Warehouse', city: 'Nashville', state: 'TN', address: '200 Industrial Dr', zip: '37210', appointmentDate: daysFromNow(1), appointmentTime: '08:00', contactName: 'Kim Nguyen', contactPhone: '615-555-0310' },
          { type: 'DELIVERY', sequence: 2, placeId: 'seed-place-dallas-warehouse', facilityName: 'Sunbelt Products', city: 'Dallas', state: 'TX', address: '8900 Commerce Pkwy', zip: '75247', appointmentDate: daysFromNow(2), appointmentTime: '14:00' },
        ],
      },
    },
  });

  // Load 6 — BOOKED (Houston → Chicago)
  await prisma.load.create({
    data: {
      id: 'seed-load-6',
      organizationId: org.id,
      loadNumber: 'LD-2026-000006',
      carrierId: externalCarrier.id,
      driverId: 'seed-driver-external-1',
      vehicleId: vehicle4.id,
      contactId: 'seed-contact-2',
      customerId: customerEcho.id,
      externalRefNumber: 'ECHO-79105',
      equipmentType: 'REEFER',
      commodity: 'Pharmaceuticals',
      weight: 28000,
      pieceCount: 16,
      loadedMiles: 1090,
      deadheadMiles: 30,
      totalMiles: 1120,
      customerRate: 4200.0,
      carrierRate: 3864.0,
      dispatchFee: 336.0,
      ratePerMile: 3.85,
      status: 'BOOKED',
      rateConReceivedAt: daysAgo(0),
      dispatcherNotes: 'High-value load — temp-controlled. Driver confirmed.',
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
      stops: {
        create: [
          { type: 'PICKUP', sequence: 1, placeId: 'seed-place-houston-terminal', facilityName: 'Gulf Coast Distribution', city: 'Houston', state: 'TX', address: '12400 Bay Area Blvd', zip: '77058', appointmentDate: daysFromNow(2), appointmentTime: '07:00' },
          { type: 'DELIVERY', sequence: 2, placeId: 'seed-place-chicago-dc', facilityName: 'Midwest Distribution Center', city: 'Chicago', state: 'IL', address: '4500 Logistics Way', zip: '60601', appointmentDate: daysFromNow(4), appointmentTime: '10:00' },
        ],
      },
    },
  });

  // Load 7 — BOOKED (no assignment yet — Charlotte → Houston)
  await prisma.load.create({
    data: {
      id: 'seed-load-7',
      organizationId: org.id,
      loadNumber: 'LD-2026-000007',
      contactId: 'seed-contact-5',
      customerId: customerPremier.id,
      externalRefNumber: 'PSC-10521',
      equipmentType: 'DRY_VAN',
      commodity: 'Household Goods',
      weight: 34000,
      pieceCount: 50,
      loadedMiles: 1065,
      totalMiles: 1065,
      customerRate: 3400.0,
      ratePerMile: 3.19,
      status: 'BOOKED',
      dispatcherNotes: 'Need to assign carrier — looking for backhaul from Charlotte area.',
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
      stops: {
        create: [
          { type: 'PICKUP', sequence: 1, placeId: 'seed-place-charlotte-warehouse', facilityName: 'Ace Manufacturing', city: 'Charlotte', state: 'NC', address: '1200 Industrial Blvd', zip: '28201', appointmentDate: daysFromNow(3), appointmentTime: '09:00' },
          { type: 'DELIVERY', sequence: 2, placeId: 'seed-place-houston-terminal', facilityName: 'Gulf Coast Distribution', city: 'Houston', state: 'TX', address: '12400 Bay Area Blvd', zip: '77058', appointmentDate: daysFromNow(5), appointmentTime: '14:00' },
        ],
      },
    },
  });

  // Load 8 — QUOTED (Dallas → Atlanta)
  await prisma.load.create({
    data: {
      id: 'seed-load-8',
      organizationId: org.id,
      loadNumber: 'LD-2026-000008',
      contactId: 'seed-contact-1',
      customerId: customerCoyote.id,
      externalRefNumber: 'COY-509241',
      equipmentType: 'DRY_VAN',
      commodity: 'Automotive Accessories',
      weight: 30000,
      loadedMiles: 781,
      totalMiles: 781,
      customerRate: 2400.0,
      ratePerMile: 3.07,
      status: 'QUOTED',
      dispatcherNotes: 'Rate competitive. Waiting for broker confirmation.',
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
      stops: {
        create: [
          { type: 'PICKUP', sequence: 1, placeId: 'seed-place-dallas-warehouse', facilityName: 'Sunbelt Products', city: 'Dallas', state: 'TX', address: '8900 Commerce Pkwy', zip: '75247', appointmentDate: daysFromNow(4), appointmentTime: '08:00' },
          { type: 'DELIVERY', sequence: 2, placeId: 'seed-place-atlanta-dropyard', facilityName: 'Atlanta Drop Yard', city: 'Atlanta', state: 'GA', address: '800 Fulton Industrial Blvd SW', zip: '30336', appointmentDate: daysFromNow(6), appointmentTime: '16:00' },
        ],
      },
    },
  });

  // Load 9 — EXCEPTION (Chicago → Charlotte, issue at delivery)
  await prisma.load.create({
    data: {
      id: 'seed-load-9',
      organizationId: org.id,
      loadNumber: 'LD-2026-000009',
      carrierId: companyCarrier.id,
      driverId: 'seed-driver-company-2',
      vehicleId: vehicle2.id,
      contactId: 'seed-contact-2',
      customerId: customerEcho.id,
      externalRefNumber: 'ECHO-77893',
      equipmentType: 'FLATBED',
      commodity: 'Lumber',
      weight: 45000,
      pieceCount: 12,
      loadedMiles: 756,
      deadheadMiles: 40,
      totalMiles: 796,
      customerRate: 3100.0,
      carrierRate: 2790.0,
      dispatchFee: 310.0,
      ratePerMile: 4.10,
      status: 'EXCEPTION',
      isTarp: true,
      rateConReceivedAt: daysAgo(6),
      dispatcherNotes: 'EXCEPTION: Receiver refused partial — 3 bundles damaged in transit. Filing claim.',
      createdAt: daysAgo(6),
      updatedAt: daysAgo(1),
      stops: {
        create: [
          { type: 'PICKUP', sequence: 1, placeId: 'seed-place-chicago-dc', facilityName: 'Midwest Distribution Center', city: 'Chicago', state: 'IL', address: '4500 Logistics Way', zip: '60601', appointmentDate: daysAgo(4), appointmentTime: '06:00', arrivalTime: daysAgo(4), departureTime: daysAgo(4) },
          { type: 'DELIVERY', sequence: 2, placeId: 'seed-place-charlotte-warehouse', facilityName: 'Ace Manufacturing', city: 'Charlotte', state: 'NC', address: '1200 Industrial Blvd', zip: '28201', appointmentDate: daysAgo(2), appointmentTime: '10:00', arrivalTime: daysAgo(2), notes: 'Receiver rejected 3 of 12 bundles — water damage during transit' },
        ],
      },
    },
  });

  // Load 10 — PAID (older, for weekly gross data)
  await prisma.load.create({
    data: {
      id: 'seed-load-10',
      organizationId: org.id,
      loadNumber: 'LD-2026-000010',
      carrierId: companyCarrier.id,
      driverId: 'seed-driver-company-1',
      vehicleId: vehicle1.id,
      contactId: 'seed-contact-1',
      customerId: customerCoyote.id,
      externalRefNumber: 'COY-471385',
      equipmentType: 'DRY_VAN',
      commodity: 'Packaged Food',
      weight: 40000,
      pieceCount: 32,
      loadedMiles: 380,
      deadheadMiles: 10,
      totalMiles: 390,
      customerRate: 1650.0,
      carrierRate: 1485.0,
      dispatchFee: 165.0,
      ratePerMile: 4.34,
      status: 'PAID',
      invoiceReadiness: 'INVOICE_CREATED',
      rateConReceivedAt: daysAgo(21),
      bolSignedAt: daysAgo(16),
      createdAt: daysAgo(21),
      updatedAt: daysAgo(10),
      stops: {
        create: [
          { type: 'PICKUP', sequence: 1, facilityName: 'Charlotte Food Depot', city: 'Charlotte', state: 'NC', address: '300 Depot Rd', zip: '28202', appointmentDate: daysAgo(18), appointmentTime: '07:00', arrivalTime: daysAgo(18), departureTime: daysAgo(18) },
          { type: 'DELIVERY', sequence: 2, placeId: 'seed-place-atlanta-dropyard', facilityName: 'Atlanta Drop Yard', city: 'Atlanta', state: 'GA', address: '800 Fulton Industrial Blvd SW', zip: '30336', appointmentDate: daysAgo(16), appointmentTime: '12:00', arrivalTime: daysAgo(16), departureTime: daysAgo(16) },
        ],
      },
    },
  });

  process.stdout.write('Loads: 10 created across all status stages\n');

  // ===========================================================================
  // INVOICES
  // ===========================================================================
  // Invoice for Load 1 (PAID)
  await prisma.invoice.create({
    data: {
      id: 'seed-invoice-1',
      loadId: 'seed-load-1',
      carrierId: companyCarrier.id,
      customerId: customerCoyote.id,
      invoiceNumber: 'INV-2026-000001',
      type: 'CUSTOMER',
      subtotal: 2850.0,
      accessorials: 0,
      totalAmount: 2850.0,
      paymentTerms: 'net_30',
      paymentTermsDays: 30,
      dueDate: daysAgo(3),
      status: 'PAID',
      sentAt: daysAgo(7),
      sentTo: 'settlements@coyote.com',
      paidAt: daysAgo(3),
      paidAmount: 2850.0,
      paymentMethod: 'ACH',
      paymentReference: 'ACH-COY-48291',
    },
  });

  // Invoice for Load 2 (INVOICED → SENT)
  await prisma.invoice.create({
    data: {
      id: 'seed-invoice-2',
      loadId: 'seed-load-2',
      carrierId: externalCarrier.id,
      customerId: customerSunbelt.id,
      invoiceNumber: 'INV-2026-000002',
      type: 'CUSTOMER',
      subtotal: 1850.0,
      accessorials: 0,
      totalAmount: 1850.0,
      paymentTerms: 'net_30',
      paymentTermsDays: 30,
      dueDate: daysFromNow(25),
      status: 'SENT',
      sentAt: daysAgo(2),
      sentTo: 'logistics@sunbeltproducts.com',
    },
  });

  // Invoice for Load 3 (DELIVERED → DRAFT, ready to approve)
  await prisma.invoice.create({
    data: {
      id: 'seed-invoice-3',
      loadId: 'seed-load-3',
      carrierId: companyCarrier.id,
      customerId: customerPremier.id,
      invoiceNumber: 'INV-2026-000003',
      type: 'CUSTOMER',
      subtotal: 2200.0,
      accessorials: 0,
      totalAmount: 2200.0,
      paymentTerms: 'net_30',
      paymentTermsDays: 30,
      dueDate: daysFromNow(28),
      status: 'DRAFT',
    },
  });

  // Dispatch fee invoice for Load 1
  await prisma.invoice.create({
    data: {
      id: 'seed-invoice-4',
      loadId: 'seed-load-1',
      carrierId: companyCarrier.id,
      invoiceNumber: 'INV-2026-000004',
      type: 'DISPATCH_FEE',
      subtotal: 285.0,
      accessorials: 0,
      totalAmount: 285.0,
      paymentTerms: 'net_30',
      paymentTermsDays: 30,
      dueDate: daysAgo(3),
      status: 'PAID',
      paidAt: daysAgo(3),
      paidAmount: 285.0,
    },
  });

  // Invoice for Load 10 (PAID — older)
  await prisma.invoice.create({
    data: {
      id: 'seed-invoice-5',
      loadId: 'seed-load-10',
      carrierId: companyCarrier.id,
      customerId: customerCoyote.id,
      invoiceNumber: 'INV-2026-000005',
      type: 'CUSTOMER',
      subtotal: 1650.0,
      accessorials: 0,
      totalAmount: 1650.0,
      paymentTerms: 'net_30',
      paymentTermsDays: 30,
      dueDate: daysAgo(10),
      status: 'PAID',
      sentAt: daysAgo(14),
      paidAt: daysAgo(10),
      paidAmount: 1650.0,
      paymentMethod: 'ACH',
      paymentReference: 'ACH-COY-47138',
    },
  });

  // Overdue invoice (for attention items)
  await prisma.invoice.create({
    data: {
      id: 'seed-invoice-6',
      loadId: 'seed-load-10',
      carrierId: companyCarrier.id,
      invoiceNumber: 'INV-2026-000006',
      type: 'DISPATCH_FEE',
      subtotal: 165.0,
      accessorials: 0,
      totalAmount: 165.0,
      paymentTerms: 'net_30',
      paymentTermsDays: 30,
      dueDate: daysAgo(5),
      status: 'SENT',
      sentAt: daysAgo(15),
    },
  });

  process.stdout.write('Invoices: 6 created (customer + dispatch fee, various statuses)\n');

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
