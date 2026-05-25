import type { LoadStatus, PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type {
  CarrierAssignmentQueryPort,
  DriverAssignmentQueryPort,
  LoadRepoPort,
  LoadQueryInput,
  OrgSettingsQueryPort,
  VehicleAssignmentQueryPort,
} from '../types/loadTypes';

const LOAD_DETAIL_INCLUDE = {
  stops: {
    orderBy: { sequence: 'asc' as const },
    include: {
      place: {
        select: { latitude: true, longitude: true },
      },
    },
  },
  carrier: true,
  driver: true,
  vehicle: true,
  contact: true,
  customer: true,
  statusHistory: {
    orderBy: { createdAt: 'desc' as const },
    include: { changedBy: { select: { id: true, firstName: true, lastName: true } } },
  },
  checkCalls: {
    orderBy: { createdAt: 'desc' as const },
    include: { calledBy: { select: { id: true, firstName: true, lastName: true } } },
  },
  accessorialCharges: {
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

const LOAD_LIST_INCLUDE = {
  stops: {
    orderBy: { sequence: 'asc' as const },
    include: {
      place: {
        select: { latitude: true, longitude: true },
      },
    },
  },
  carrier: {
    select: { id: true, name: true },
  },
  driver: {
    select: { id: true, firstName: true, lastName: true },
  },
  contact: {
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, ccEmails: true },
  },
  customer: {
    select: { id: true, companyName: true },
  },
  _count: {
    select: { accessorialCharges: true },
  },
} as const;

const buildListWhere = (organizationId: string, filters: LoadQueryInput['filters']) => {
  const where: Record<string, unknown> = {
    organizationId,
    deletedAt: null,
  };

  if (filters.status !== undefined && filters.status.length > 0) {
    where['status'] = { in: filters.status };
  }

  if (filters.carrierId !== undefined) {
    where['carrierId'] = filters.carrierId;
  }

  if (filters.customerId !== undefined) {
    where['customerId'] = filters.customerId;
  }

  if (filters.equipmentType !== undefined) {
    where['equipmentType'] = filters.equipmentType;
  }

  if (filters.dateFrom !== undefined || filters.dateTo !== undefined) {
    const createdAt: Record<string, Date> = {};
    if (filters.dateFrom !== undefined) {
      createdAt['gte'] = filters.dateFrom;
    }
    if (filters.dateTo !== undefined) {
      createdAt['lte'] = filters.dateTo;
    }
    where['createdAt'] = createdAt;
  }

  if (filters.search !== undefined && filters.search.length > 0) {
    where['OR'] = [
      { loadNumber: { contains: filters.search, mode: 'insensitive' } },
      { externalRefNumber: { contains: filters.search, mode: 'insensitive' } },
      { carrier: { name: { contains: filters.search, mode: 'insensitive' } } },
      { stops: { some: { city: { contains: filters.search, mode: 'insensitive' } } } },
    ];
  }

  return where;
};

const buildBlockingLoadWhere = <T extends string | undefined>(
  field: 'driverId' | 'vehicleId',
  entityId: string,
  statuses: readonly LoadStatus[],
  excludeLoadId?: T,
) => ({
  [field]: entityId,
  deletedAt: null,
  status: {
    in: [...statuses],
  },
  ...(excludeLoadId !== undefined ? { id: { not: excludeLoadId } } : {}),
});

export const loadRepositoryPrisma = (prisma: PrismaClient | PrismaTransaction): LoadRepoPort => ({
  create: async (organizationId, loadNumber, input) => {
    const { stops, accessorialCharges, ...loadData } = input;

    return prisma.load.create({
      data: {
        organizationId,
        loadNumber,
        ...loadData,
        stops: {
          create: stops.map((stop) => ({
            type: stop.type,
            sequence: stop.sequence,
            contactId: stop.contactId,
            placeId: stop.placeId,
            resolutionStatus: stop.resolutionStatus ?? 'UNRESOLVED',
            facilityName: stop.facilityName,
            address: stop.address,
            city: stop.city,
            state: stop.state,
            zip: stop.zip,
            schedulingType: stop.schedulingType,
            appointmentStart: stop.appointmentStart,
            appointmentEnd: stop.appointmentEnd,
            notificationHours: stop.notificationHours,
            appointmentNumber: stop.appointmentNumber,
            contactName: stop.contactName,
            contactPhone: stop.contactPhone,
            commodity: stop.commodity,
            weight: stop.weight,
            pieceCount: stop.pieceCount,
            isHazmat: stop.isHazmat ?? false,
            isTarp: stop.isTarp ?? false,
            isTempControlled: stop.isTempControlled ?? false,
            notes: stop.notes,
            callByTime: stop.callByTime,
            trailerNumber: stop.trailerNumber,
            yardLocation: stop.yardLocation,
          })),
        },
        ...(accessorialCharges !== undefined && accessorialCharges.length > 0
          ? {
              accessorialCharges: {
                create: accessorialCharges.map((charge) => ({
                  type: charge.type,
                  description: charge.description,
                  amount: charge.amount,
                  billTo: charge.billTo ?? 'customer',
                  isAutoGenerated: charge.isAutoGenerated ?? false,
                })),
              },
            }
          : {}),
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: input.status ?? 'QUOTED',
            notes: 'Load created',
          },
        },
      },
      include: LOAD_DETAIL_INCLUDE,
    });
  },

  findById: (id, organizationId) =>
    prisma.load.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: LOAD_DETAIL_INCLUDE,
    }),

  findByIdUnscoped: (id) =>
    prisma.load.findUnique({
      where: { id },
      include: LOAD_DETAIL_INCLUDE,
    }),

  list: ({ organizationId, filters, skip, take, orderBy }) =>
    prisma.load.findMany({
      where: buildListWhere(organizationId, filters),
      skip,
      take,
      orderBy,
      include: LOAD_LIST_INCLUDE,
    }),

  count: ({ organizationId, filters }) =>
    prisma.load.count({
      where: buildListWhere(organizationId, filters),
    }),

  update: async (id, input) => {
    const { stops, accessorialCharges, ...loadData } = input;

    // If accessorialCharges are provided, atomically replace them
    if (accessorialCharges !== undefined) {
      await prisma.accessorialCharge.deleteMany({ where: { loadId: id } });
    }

    // If stops are provided, replace them atomically
    if (stops !== undefined) {
      await prisma.stop.deleteMany({ where: { loadId: id } });
    }

    return prisma.load.update({
      where: { id },
      data: {
        ...loadData,
        ...(stops !== undefined
          ? {
              stops: {
                create: stops.map((stop) => ({
                  type: stop.type,
                  sequence: stop.sequence,
                  contactId: stop.contactId,
                  placeId: stop.placeId,
                  facilityName: stop.facilityName,
                  address: stop.address,
                  city: stop.city,
                  state: stop.state,
                  zip: stop.zip,
                  schedulingType: stop.schedulingType,
                  appointmentStart: stop.appointmentStart,
                  appointmentEnd: stop.appointmentEnd,
                  notificationHours: stop.notificationHours,
                  appointmentNumber: stop.appointmentNumber,
                  contactName: stop.contactName,
                  contactPhone: stop.contactPhone,
                  commodity: stop.commodity,
                  weight: stop.weight,
                  pieceCount: stop.pieceCount,
                  isHazmat: stop.isHazmat ?? false,
                  isTarp: stop.isTarp ?? false,
                  isTempControlled: stop.isTempControlled ?? false,
                  notes: stop.notes,
                  callByTime: stop.callByTime,
                  trailerNumber: stop.trailerNumber,
                  yardLocation: stop.yardLocation,
                })),
              },
            }
          : {}),
        ...(accessorialCharges !== undefined
          ? {
              accessorialCharges: {
                create: accessorialCharges.map((charge) => ({
                  type: charge.type,
                  description: charge.description,
                  amount: charge.amount,
                  billTo: charge.billTo ?? 'customer',
                  isAutoGenerated: charge.isAutoGenerated ?? false,
                })),
              },
            }
          : {}),
      },
      include: LOAD_DETAIL_INCLUDE,
    });
  },

  findBlockingLoadIdsByDriver: async (driverId, statuses, limit, excludeLoadId) => {
    const loads = await prisma.load.findMany({
      where: buildBlockingLoadWhere('driverId', driverId, statuses, excludeLoadId),
      select: {
        id: true,
      },
      take: limit,
    });

    return loads.map((load) => load.id);
  },

  findBlockingLoadIdsByVehicle: async (vehicleId, statuses, limit, excludeLoadId) => {
    const loads = await prisma.load.findMany({
      where: buildBlockingLoadWhere('vehicleId', vehicleId, statuses, excludeLoadId),
      select: {
        id: true,
      },
      take: limit,
    });

    return loads.map((load) => load.id);
  },

  softDelete: async (id, deletedAt) => {
    await prisma.load.update({
      where: { id },
      data: { deletedAt },
    });
  },

  createCheckCall: async (loadId, calledByUserId, input) => {
    return prisma.checkCall.create({
      data: {
        loadId,
        calledByUserId,
        location: input.location,
        latitude: input.latitude,
        longitude: input.longitude,
        status: input.status,
        eta: input.eta,
        notes: input.notes,
        brokerNotified: input.brokerNotified,
        brokerNotes: input.brokerNotes,
      },
      include: {
        calledBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  },

  listCheckCalls: async (loadId) => {
    return prisma.checkCall.findMany({
      where: { loadId },
      orderBy: { createdAt: 'desc' },
      include: {
        calledBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  },

  listStatusHistory: async (loadId) => {
    return prisma.loadStatusHistory.findMany({
      where: { loadId },
      orderBy: { createdAt: 'desc' },
      include: {
        changedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  },

  findFirstPickupCoordinates: async (loadId) => {
    const stop = await prisma.stop.findFirst({
      where: {
        loadId,
        type: 'PICKUP',
      },
      orderBy: { sequence: 'asc' },
      select: {
        place: {
          select: { latitude: true, longitude: true },
        },
      },
    });

    if (stop === null) {
      return null;
    }

    const place = stop.place;

    if (place === null || place.latitude === null || place.longitude === null) {
      return null;
    }

    return {
      lat: Number(place.latitude),
      lng: Number(place.longitude),
    };
  },

  findLastDeliveryCoordinates: async (driverId, organizationId) => {
    const lastDeliveredLoad = await prisma.load.findFirst({
      where: {
        driverId,
        organizationId,
        deletedAt: null,
        status: { in: ['DELIVERED', 'INVOICE_PENDING', 'INVOICED', 'PAID'] },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        stops: {
          where: { type: 'DELIVERY' },
          orderBy: { sequence: 'desc' },
          take: 1,
          select: {
            place: {
              select: { latitude: true, longitude: true },
            },
          },
        },
      },
    });

    if (lastDeliveredLoad === null) {
      return null;
    }

    const lastDeliveryStop = lastDeliveredLoad.stops[0];

    if (lastDeliveryStop === undefined) {
      return null;
    }

    const place = lastDeliveryStop.place;

    if (place === null || place.latitude === null || place.longitude === null) {
      return null;
    }

    return {
      lat: Number(place.latitude),
      lng: Number(place.longitude),
    };
  },

  listDocuments: async (loadId, organizationId) => {
    const docs = await prisma.document.findMany({
      where: {
        entityType: 'load',
        entityId: loadId,
        organizationId,
        isArchived: false,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        organizationId: true,
        entityId: true,
        type: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        uploadStatus: true,
        notes: true,
        createdAt: true,
      },
    });
    return docs.map((doc) => ({
      id: doc.id,
      organizationId: doc.organizationId,
      loadId: doc.entityId,
      type: doc.type,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      uploadStatus: doc.uploadStatus,
      notes: doc.notes,
      createdAt: doc.createdAt,
    }));
  },
});

export const orgSettingsQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): OrgSettingsQueryPort => ({
  getProhibitedCommodities: async (organizationId) => {
    const settings = await prisma.orgSettings.findUnique({
      where: { organizationId },
      select: { prohibitedCommodities: true },
    });

    return settings?.prohibitedCommodities ?? [];
  },
});

export const carrierAssignmentQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): CarrierAssignmentQueryPort => ({
  findDispatchableById: async (carrierId, organizationId) => {
    const carrier = await prisma.carrier.findFirst({
      where: {
        id: carrierId,
        managedByOrgId: organizationId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        type: true,
        tin: true,
      },
    });

    if (!carrier) {
      return null;
    }

    return {
      id: carrier.id,
      name: carrier.name,
      type: carrier.type,
      tinOnFile: carrier.tin != null,
    };
  },

  findRateSnapshot: async (carrierId, organizationId) => {
    const carrier = await prisma.carrier.findFirst({
      where: {
        id: carrierId,
        managedByOrgId: organizationId,
        deletedAt: null,
      },
      select: {
        dispatchFeeType: true,
        dispatchFeePercent: true,
        dispatchFeeAmount: true,
        partnerSplitPercent: true,
        feeIncludesAccessorials: true,
        payFromNet: true,
      },
    });

    if (!carrier) {
      return null;
    }

    return {
      dispatchFeeType: carrier.dispatchFeeType,
      dispatchFeePercent: String(carrier.dispatchFeePercent),
      dispatchFeeAmount: String(carrier.dispatchFeeAmount),
      partnerSplitPercent: String(carrier.partnerSplitPercent),
      feeIncludesAccessorials: carrier.feeIncludesAccessorials,
      payFromNet: carrier.payFromNet,
    };
  },
});

export const driverAssignmentQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): DriverAssignmentQueryPort => ({
  findAssignableById: async (driverId, organizationId) => {
    return prisma.driver.findFirst({
      where: {
        id: driverId,
        deletedAt: null,
        carrier: {
          managedByOrgId: organizationId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        carrierId: true,
        firstName: true,
        lastName: true,
        isAvailable: true,
      },
    });
  },

  findRateSnapshot: async (driverId, organizationId) => {
    const driver = await prisma.driver.findFirst({
      where: {
        id: driverId,
        deletedAt: null,
        carrier: {
          managedByOrgId: organizationId,
          deletedAt: null,
        },
      },
      select: {
        payType: true,
        payRate: true,
      },
    });

    if (!driver) {
      return null;
    }

    return {
      payType: driver.payType,
      payRate: String(driver.payRate),
    };
  },
});

export const vehicleAssignmentQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): VehicleAssignmentQueryPort => ({
  findAssignableById: async (vehicleId, organizationId) => {
    return prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        deletedAt: null,
        carrier: {
          managedByOrgId: organizationId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        carrierId: true,
        unitNumber: true,
        driverId: true,
        isActive: true,
      },
    });
  },
});
