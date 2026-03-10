/**
 * Seed script — populates the database with representative sample data
 * for development and testing.
 *
 * Run with: npx prisma db seed
 *
 * Idempotent: uses upsert or deleteMany + create patterns throughout.
 *
 * Creates:
 * - 1 Organization
 * - OrgSettings with PRD defaults
 * - 1 COMPANY_ASSET carrier with 2 drivers and 2 vehicles (with TruckExpenses)
 * - 1 EXTERNAL_CARRIER (fully onboarded) with 1 driver and 1 vehicle (with TruckExpenses)
 * - 3 Contacts: BROKER, SHIPPER, CONSIGNEE
 * - 3 Places with city/state/coordinates
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const runSeed = async (): Promise<void> => {
  process.stdout.write('Seeding database...\n');

  // ---------------------------------------------------------------------------
  // Organization
  // ---------------------------------------------------------------------------
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Dispatch Co.',
      slug: 'demo-org',
      email: 'admin@demodispatch.example',
    },
  });

  process.stdout.write(`Organization: ${org.name} (${org.id})\n`);

  // ---------------------------------------------------------------------------
  // OrgSettings — PRD defaults
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

  // ---------------------------------------------------------------------------
  // COMPANY_ASSET carrier
  // ---------------------------------------------------------------------------
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
      primaryContactName: 'Tom Bradley',
      primaryContactPhone: '555-100-9000',
      primaryContactEmail: 'tom@demofleet.example',
      dispatchFeePercent: 10,
      partnerSplitPercent: 50,
      city: 'Charlotte',
      state: 'NC',
      authorityStatus: 'active',
      status: 'active',
    },
  });

  // Driver 1 — company carrier
  await prisma.driver.upsert({
    where: { id: 'seed-driver-company-1' },
    update: {},
    create: {
      id: 'seed-driver-company-1',
      carrierId: companyCarrier.id,
      firstName: 'John',
      lastName: 'Smith',
      phone: '555-100-0001',
      cdlState: 'NC',
      homeBaseCity: 'Charlotte',
      homeBaseState: 'NC',
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

  // Driver 2 — company carrier
  await prisma.driver.upsert({
    where: { id: 'seed-driver-company-2' },
    update: {},
    create: {
      id: 'seed-driver-company-2',
      carrierId: companyCarrier.id,
      firstName: 'Robert',
      lastName: 'Johnson',
      phone: '555-100-0002',
      cdlState: 'GA',
      homeBaseCity: 'Atlanta',
      homeBaseState: 'GA',
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

  // Vehicle 1 — company carrier (dry van)
  const companyVehicle1 = await prisma.vehicle.upsert({
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
      licensePlate: 'ABC1234',
      licensePlateState: 'NC',
      monthlyGrossTarget: 18000.0,
      monthlyMilesTarget: 10000,
      workingDaysPerMonth: 22,
      isActive: true,
    },
  });

  // Vehicle 2 — company carrier (flatbed)
  const companyVehicle2 = await prisma.vehicle.upsert({
    where: { id: 'seed-vehicle-company-2' },
    update: {},
    create: {
      id: 'seed-vehicle-company-2',
      carrierId: companyCarrier.id,
      unitNumber: 'T-002',
      type: 'FLATBED',
      ownership: 'OWNED',
      year: 2021,
      make: 'Kenworth',
      model: 'W900',
      licensePlate: 'XYZ5678',
      licensePlateState: 'NC',
      monthlyGrossTarget: 20000.0,
      monthlyMilesTarget: 11000,
      workingDaysPerMonth: 22,
      isActive: true,
    },
  });

  process.stdout.write(`COMPANY_ASSET carrier: ${companyCarrier.name}\n`);

  // ---------------------------------------------------------------------------
  // TruckExpenses for company vehicles
  // ---------------------------------------------------------------------------

  // Vehicle 1 expenses (dry van)
  const vehicle1Expenses = [
    // FIXED
    {
      vehicleId: companyVehicle1.id,
      category: 'FIXED' as const,
      expenseKey: 'truck_payment',
      label: 'Truck Payment',
      monthlyAmount: 2200.0,
    },
    {
      vehicleId: companyVehicle1.id,
      category: 'FIXED' as const,
      expenseKey: 'trailer_payment',
      label: 'Trailer Payment',
      monthlyAmount: 650.0,
    },
    {
      vehicleId: companyVehicle1.id,
      category: 'FIXED' as const,
      expenseKey: 'insurance',
      label: 'Insurance (Physical Damage + Liability)',
      monthlyAmount: 900.0,
    },
    // VARIABLE
    {
      vehicleId: companyVehicle1.id,
      category: 'VARIABLE' as const,
      expenseKey: 'fuel',
      label: 'Fuel',
      monthlyAmount: 3200.0,
    },
    {
      vehicleId: companyVehicle1.id,
      category: 'VARIABLE' as const,
      expenseKey: 'tires',
      label: 'Tires (amortized)',
      monthlyAmount: 400.0,
    },
    {
      vehicleId: companyVehicle1.id,
      category: 'VARIABLE' as const,
      expenseKey: 'tolls',
      label: 'Tolls & Scales',
      monthlyAmount: 150.0,
    },
    // SERVICE
    {
      vehicleId: companyVehicle1.id,
      category: 'SERVICE' as const,
      expenseKey: 'oil_change',
      label: 'Oil Change & Filters',
      monthlyAmount: 300.0,
    },
    {
      vehicleId: companyVehicle1.id,
      category: 'SERVICE' as const,
      expenseKey: 'repairs',
      label: 'Repairs & Maintenance',
      monthlyAmount: 500.0,
    },
  ];

  for (const expense of vehicle1Expenses) {
    await prisma.truckExpense.upsert({
      where: {
        vehicleId_expenseKey: {
          vehicleId: expense.vehicleId,
          expenseKey: expense.expenseKey,
        },
      },
      update: {},
      create: expense,
    });
  }

  // Vehicle 2 expenses (flatbed — higher maintenance)
  const vehicle2Expenses = [
    // FIXED
    {
      vehicleId: companyVehicle2.id,
      category: 'FIXED' as const,
      expenseKey: 'truck_payment',
      label: 'Truck Payment',
      monthlyAmount: 2800.0,
    },
    {
      vehicleId: companyVehicle2.id,
      category: 'FIXED' as const,
      expenseKey: 'flatbed_payment',
      label: 'Flatbed Trailer Payment',
      monthlyAmount: 750.0,
    },
    {
      vehicleId: companyVehicle2.id,
      category: 'FIXED' as const,
      expenseKey: 'insurance',
      label: 'Insurance (Physical Damage + Liability)',
      monthlyAmount: 1050.0,
    },
    // VARIABLE
    {
      vehicleId: companyVehicle2.id,
      category: 'VARIABLE' as const,
      expenseKey: 'fuel',
      label: 'Fuel',
      monthlyAmount: 3600.0,
    },
    {
      vehicleId: companyVehicle2.id,
      category: 'VARIABLE' as const,
      expenseKey: 'tires',
      label: 'Tires (amortized)',
      monthlyAmount: 500.0,
    },
    {
      vehicleId: companyVehicle2.id,
      category: 'VARIABLE' as const,
      expenseKey: 'tarps_straps',
      label: 'Tarps & Straps Replacement',
      monthlyAmount: 120.0,
    },
    // SERVICE
    {
      vehicleId: companyVehicle2.id,
      category: 'SERVICE' as const,
      expenseKey: 'oil_change',
      label: 'Oil Change & Filters',
      monthlyAmount: 320.0,
    },
    {
      vehicleId: companyVehicle2.id,
      category: 'SERVICE' as const,
      expenseKey: 'repairs',
      label: 'Repairs & Maintenance',
      monthlyAmount: 650.0,
    },
  ];

  for (const expense of vehicle2Expenses) {
    await prisma.truckExpense.upsert({
      where: {
        vehicleId_expenseKey: {
          vehicleId: expense.vehicleId,
          expenseKey: expense.expenseKey,
        },
      },
      update: {},
      create: expense,
    });
  }

  process.stdout.write('TruckExpenses: created for company vehicles\n');

  // ---------------------------------------------------------------------------
  // EXTERNAL_CARRIER — fully onboarded
  // ---------------------------------------------------------------------------
  const externalCarrier = await prisma.carrier.upsert({
    where: { id: 'seed-carrier-external-1' },
    update: {},
    create: {
      id: 'seed-carrier-external-1',
      managedByOrgId: org.id,
      name: 'Independent Trucking Inc.',
      type: 'EXTERNAL_CARRIER',
      mcNumber: 'MC-999888',
      dotNumber: '1122334',
      phone: '555-300-0001',
      email: 'dispatch@independenttrucking.example',
      primaryContactName: 'Maria Garcia',
      primaryContactPhone: '555-200-0001',
      primaryContactEmail: 'mgarcia@example.com',
      city: 'Dallas',
      state: 'TX',
      dispatchFeePercent: 8,
      partnerSplitPercent: 50,
      // Fully onboarded — all three required documents on file
      dispatchAgreementOnFile: true,
      dispatchAgreementSignedAt: new Date('2025-06-15'),
      insuranceCertOnFile: true,
      insuranceExpiry: new Date('2026-12-31'),
      w9OnFile: true,
      carrierPacketOnFile: true,
      authorityStatus: 'active',
      status: 'active',
    },
  });

  // Driver — external carrier
  await prisma.driver.upsert({
    where: { id: 'seed-driver-external-1' },
    update: {},
    create: {
      id: 'seed-driver-external-1',
      carrierId: externalCarrier.id,
      firstName: 'Maria',
      lastName: 'Garcia',
      phone: '555-200-0001',
      email: 'mgarcia@example.com',
      cdlState: 'TX',
      homeBaseCity: 'Dallas',
      homeBaseState: 'TX',
      availableHours: 60,
      maxDaysOut: 10,
      preferredLanes: {
        origins: [
          { state: 'TX', city: 'Dallas' },
          { state: 'TX', city: 'Houston' },
          { state: 'TX', city: 'San Antonio' },
        ],
        destinations: [
          { state: 'IL', city: 'Chicago' },
          { state: 'MO', city: 'Kansas City' },
          { state: 'CO', city: 'Denver' },
          { state: 'AZ', city: 'Phoenix' },
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

  // Vehicle — external carrier (reefer)
  const externalVehicle = await prisma.vehicle.upsert({
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
      licensePlate: 'TX99001',
      licensePlateState: 'TX',
      monthlyGrossTarget: 22000.0,
      monthlyMilesTarget: 12000,
      workingDaysPerMonth: 26,
      isActive: true,
    },
  });

  // TruckExpenses — external carrier vehicle (reefer — higher variable costs)
  const externalVehicleExpenses = [
    // FIXED
    {
      vehicleId: externalVehicle.id,
      category: 'FIXED' as const,
      expenseKey: 'truck_payment',
      label: 'Truck Payment',
      monthlyAmount: 3100.0,
    },
    {
      vehicleId: externalVehicle.id,
      category: 'FIXED' as const,
      expenseKey: 'reefer_payment',
      label: 'Reefer Trailer Payment',
      monthlyAmount: 900.0,
    },
    {
      vehicleId: externalVehicle.id,
      category: 'FIXED' as const,
      expenseKey: 'insurance',
      label: 'Insurance (Physical Damage + Liability + Cargo)',
      monthlyAmount: 1200.0,
    },
    // VARIABLE
    {
      vehicleId: externalVehicle.id,
      category: 'VARIABLE' as const,
      expenseKey: 'fuel',
      label: 'Fuel (truck + reefer unit)',
      monthlyAmount: 4100.0,
    },
    {
      vehicleId: externalVehicle.id,
      category: 'VARIABLE' as const,
      expenseKey: 'tires',
      label: 'Tires (amortized)',
      monthlyAmount: 550.0,
    },
    // SERVICE
    {
      vehicleId: externalVehicle.id,
      category: 'SERVICE' as const,
      expenseKey: 'oil_change',
      label: 'Oil Change & Filters',
      monthlyAmount: 350.0,
    },
    {
      vehicleId: externalVehicle.id,
      category: 'SERVICE' as const,
      expenseKey: 'reefer_service',
      label: 'Reefer Unit Service & Maintenance',
      monthlyAmount: 600.0,
    },
  ];

  for (const expense of externalVehicleExpenses) {
    await prisma.truckExpense.upsert({
      where: {
        vehicleId_expenseKey: {
          vehicleId: expense.vehicleId,
          expenseKey: expense.expenseKey,
        },
      },
      update: {},
      create: expense,
    });
  }

  process.stdout.write(`EXTERNAL_CARRIER: ${externalCarrier.name} (fully onboarded)\n`);

  // ---------------------------------------------------------------------------
  // Driver-Vehicle assignments (1:1)
  // ---------------------------------------------------------------------------
  await prisma.vehicle.update({
    where: { id: 'seed-vehicle-company-1' },
    data: { driverId: 'seed-driver-company-1' },
  });

  await prisma.vehicle.update({
    where: { id: 'seed-vehicle-company-2' },
    data: { driverId: 'seed-driver-company-2' },
  });

  await prisma.vehicle.update({
    where: { id: 'seed-vehicle-external-1' },
    data: { driverId: 'seed-driver-external-1' },
  });

  process.stdout.write('Driver-Vehicle assignments: 3 assignments created\n');

  // ---------------------------------------------------------------------------
  // CarrierNotes — sample notes for each carrier
  // ---------------------------------------------------------------------------
  await prisma.carrierNote.deleteMany({
    where: {
      carrierId: { in: [companyCarrier.id, externalCarrier.id] },
    },
  });

  await prisma.carrierNote.createMany({
    data: [
      {
        carrierId: companyCarrier.id,
        text: 'Carrier prefers Southeast regional lanes. Good communication.',
        authorName: 'System',
      },
      {
        carrierId: companyCarrier.id,
        text: 'Insurance renewed through 2027. All docs current.',
        authorName: 'System',
      },
      {
        carrierId: externalCarrier.id,
        text: 'Fully onboarded. Dispatch agreement signed 2025-06-15.',
        authorName: 'System',
      },
      {
        carrierId: externalCarrier.id,
        text: 'Driver Maria prefers long-haul Midwest runs from TX origin.',
        authorName: 'System',
      },
    ],
  });

  process.stdout.write('CarrierNotes: sample notes created\n');

  // ---------------------------------------------------------------------------
  // Contacts — BROKER, SHIPPER, CONSIGNEE
  // ---------------------------------------------------------------------------
  await prisma.contact.upsert({
    where: { id: 'seed-contact-broker-1' },
    update: {},
    create: {
      id: 'seed-contact-broker-1',
      organizationId: org.id,
      type: 'BROKER',
      companyName: 'Coyote Logistics',
      contactName: 'Sarah Mitchell',
      phone: '800-225-5690',
      email: 'smitchell@coyotelogistics.example',
      city: 'Chicago',
      state: 'IL',
      paymentTerms: 'net_30',
      paymentTermsDays: 30,
      quickPayDiscount: 2.5,
    },
  });

  await prisma.contact.upsert({
    where: { id: 'seed-contact-shipper-1' },
    update: {},
    create: {
      id: 'seed-contact-shipper-1',
      organizationId: org.id,
      type: 'SHIPPER',
      companyName: 'Ace Manufacturing Corp.',
      contactName: 'Dave Kowalski',
      phone: '704-555-0100',
      email: 'shipping@acemfg.example',
      address: '1200 Industrial Blvd',
      city: 'Charlotte',
      state: 'NC',
      zip: '28201',
      paymentTerms: 'net_15',
      paymentTermsDays: 15,
      notes: 'Dock hours 06:00–16:00 Mon–Fri. Appointment required.',
    },
  });

  await prisma.contact.upsert({
    where: { id: 'seed-contact-consignee-1' },
    update: {},
    create: {
      id: 'seed-contact-consignee-1',
      organizationId: org.id,
      type: 'CONSIGNEE',
      companyName: 'Midwest Distribution Center',
      contactName: 'Linda Torres',
      phone: '312-555-0200',
      email: 'receiving@midwestdc.example',
      address: '4500 Logistics Way',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      paymentTerms: 'net_30',
      paymentTermsDays: 30,
      notes: 'Live unload only. Lumper required — carrier pays upfront, submit receipt for reimbursement.',
    },
  });

  process.stdout.write('Contacts: BROKER, SHIPPER, CONSIGNEE created\n');

  // ---------------------------------------------------------------------------
  // Places — 3 sample places with city/state/coordinates
  // ---------------------------------------------------------------------------
  await prisma.place.upsert({
    where: { id: 'seed-place-charlotte-warehouse' },
    update: {},
    create: {
      id: 'seed-place-charlotte-warehouse',
      organizationId: org.id,
      contactId: 'seed-contact-shipper-1',
      name: 'Ace Manufacturing — Charlotte',
      address: '1200 Industrial Blvd',
      city: 'Charlotte',
      state: 'NC',
      zip: '28201',
      latitude: 35.2271,
      longitude: -80.8431,
      geoSource: 'AUTO',
      facilityType: 'MANUFACTURING',
      operatingHours: 'Mon–Fri 06:00–16:00',
      receivingHours: 'Mon–Fri 06:00–15:30',
      appointmentRequired: true,
      dockType: 'DOCK_HIGH',
      contactName: 'Dave Kowalski',
      contactPhone: '704-555-0100',
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
      contactId: 'seed-contact-consignee-1',
      name: 'Midwest Distribution Center — Chicago',
      address: '4500 Logistics Way',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      latitude: 41.8781,
      longitude: -87.6298,
      geoSource: 'AUTO',
      facilityType: 'DISTRIBUTION_CENTER',
      operatingHours: 'Mon–Sat 05:00–22:00',
      receivingHours: 'Mon–Sat 06:00–18:00',
      appointmentRequired: true,
      dockType: 'DOCK_HIGH',
      contactName: 'Linda Torres',
      contactPhone: '312-555-0200',
      checkInProcedures: 'Pre-register BOL in their portal 24h before arrival. Check in at dock office.',
      lumperRequired: true,
      ppeRequired: false,
      notes: 'Average unload time 3–4 hours. Detention kicks in after 2 free hours.',
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
      checkInProcedures: 'Open lot — no check-in required. Text dispatcher with unit number on drop.',
      lumperRequired: false,
      ppeRequired: false,
      notes: 'Secure fenced yard. Used as relay point for SE-to-Midwest loads.',
    },
  });

  process.stdout.write('Places: 3 sample places with coordinates created\n');

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
