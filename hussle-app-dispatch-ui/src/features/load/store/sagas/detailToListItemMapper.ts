import type { LoadDetail, LoadListItem } from '../../types';

/**
 * Maps a LoadDetail response to a LoadListItem for the entity store.
 * Used by sagas that receive a full detail response but need to update
 * the list-level entity.
 */
export const mapDetailToListItem = (load: LoadDetail): LoadListItem => {
  const origin = load.route.stops.find((s) => s.type === 'PICKUP');
  const deliveries = load.route.stops.filter((s) => s.type === 'DELIVERY');
  const lastDelivery = deliveries[deliveries.length - 1];

  return {
    id: load.id,
    loadNumber: load.loadNumber,
    status: load.status,
    equipmentType: load.equipmentType,
    invoiceReadiness: load.tracking.invoiceReadiness,
    accessorialChargeCount: load.activity.accessorialCharges.length,
    createdAt: load.createdAt,
    updatedAt: load.updatedAt,

    route: {
      originCity: origin?.city ?? null,
      originState: origin?.state ?? null,
      destinationCity: lastDelivery?.city ?? null,
      destinationState: lastDelivery?.state ?? null,
      totalMiles: load.route.totalMiles,
      pickupDate: origin?.appointmentStart ?? null,
      pickupSchedulingType: origin?.schedulingType ?? null,
      deliveryDate: lastDelivery?.appointmentStart ?? null,
      deliverySchedulingType: lastDelivery?.schedulingType ?? null,
      originLat: null,
      originLng: null,
      destLat: null,
      destLng: null,
    },

    cargo: {
      commodity: load.cargo.commodity,
      weight: load.cargo.weight,
      pieceCount: load.cargo.pieceCount,
      isHazmat: load.cargo.isHazmat,
      isTarp: load.cargo.isTarp,
    },

    financials: {
      customerRate: load.financials.customerRate,
      carrierRate: load.financials.carrierRate,
      ratePerMile: load.financials.ratePerMile,
      ratePerTotalMile: load.financials.ratePerTotalMile,
      companyMargin: load.financials.companyMargin,
      carrierPayout: load.financials.carrierPayout,
      companyNet: load.financials.companyNet,
    },

    assignment: {
      carrierId: load.assignment.carrier?.id ?? null,
      carrierName: load.assignment.carrier?.name ?? null,
      driverId: load.assignment.driver?.id ?? null,
      driverName: load.assignment.driver
        ? `${load.assignment.driver.firstName} ${load.assignment.driver.lastName}`
        : null,
    },

    customer: {
      customerName: load.customer?.companyName ?? null,
      contactName: load.contact
        ? `${load.contact.firstName} ${load.contact.lastName}`.trim()
        : null,
      contactEmail: load.contact?.email ?? null,
      contactPhone: load.contact?.phone ?? null,
    },
  };
};
