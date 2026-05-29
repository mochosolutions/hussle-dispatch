import { createSelector } from '@reduxjs/toolkit';
import { isWithinInterval, parseISO } from 'date-fns';
import type { RootState } from 'store';
import { LoadingState } from '@mocho/ui/redux';
import { loadSelectors } from '../reducers/loadEntitySlice';
import { STATUS_TO_KANBAN_GROUP, formatEquipmentType } from '../../constants';
import { formatTimestamp, formatCurrencyCompact } from '../../constants';
import formatPhone from 'utils/formatPhone';
import type {
  BoardView,
  DispatchBlocker,
  KanbanGroup,
  LoadDetail,
  LoadFilters,
  LoadListItem,
  Stop,
} from '../../types';

// Detail-only key — used to discriminate the wider LoadDetail shape
// from the LoadListItem subset stored in the same entity adapter.
const isLoadDetail = (entity: LoadListItem | LoadDetail): entity is LoadDetail =>
  'activity' in entity;

// ---------------------------------------------------------------------------
// Entity selectors
// ---------------------------------------------------------------------------

export const selectAllLoads = (state: RootState) => loadSelectors.selectAll(state);

export const selectLoadById = (id: string) => (state: RootState) =>
  loadSelectors.selectById(state, id);

/** Returns the entity only when it has been hydrated with full detail data. */
export const selectLoadDetailById =
  (id: string) =>
  (state: RootState): LoadDetail | undefined => {
    const entity = loadSelectors.selectById(state, id);
    if (entity && isLoadDetail(entity)) return entity;
    return undefined;
  };

// ---------------------------------------------------------------------------
// Page loading selectors
// ---------------------------------------------------------------------------

export const selectLoadListLoading = (state: RootState) => {
  const status = state.pages.loads.loading['getAll'];
  return status === undefined || status === LoadingState.Pending;
};

export const selectLoadCreateLoading = (state: RootState) =>
  state.pages.loads.loading['create'] === LoadingState.Pending;

export const selectLoadUpdateLoading = (id: string) => (state: RootState) =>
  state.pages.loads.loading[`update:${id}`] === LoadingState.Pending;

export const selectLoadDetailLoading = (id: string) => (state: RootState) =>
  state.pages.loads.loading[`getById:${id}`] === LoadingState.Pending;

export const selectLoadCreateFulfilled = (state: RootState) =>
  state.pages.loads.loading['create'] === LoadingState.Fulfilled;

export const selectLoadUpdateFulfilled = (id: string) => (state: RootState) =>
  state.pages.loads.loading[`update:${id}`] === LoadingState.Fulfilled;

export const selectLoadTransitionLoading = (id: string) => (state: RootState) =>
  state.pages.loads.loading[`transition:${id}`] === LoadingState.Pending;

export const selectLoadTransitionFulfilled = (id: string) => (state: RootState) =>
  state.pages.loads.loading[`transition:${id}`] === LoadingState.Fulfilled;

export const selectLoadAssignAndDispatchLoading = (id: string) => (state: RootState) =>
  state.pages.loads.loading[`assignAndDispatch:${id}`] === LoadingState.Pending;

export const selectLoadAssignAndDispatchFulfilled = (id: string) => (state: RootState) =>
  state.pages.loads.loading[`assignAndDispatch:${id}`] === LoadingState.Fulfilled;

// ---------------------------------------------------------------------------
// Board view selector
// ---------------------------------------------------------------------------

export const selectBoardView = (state: RootState): BoardView => state.pages.loads.boardView;

export const selectLoadFilters = (state: RootState): LoadFilters => state.pages.loads.filters;

export const selectLastRefreshed = (state: RootState): string | null =>
  state.pages.loads.lastRefreshed;

export const selectCommandCenterLayers = (state: RootState) =>
  state.pages.loads.commandCenterLayers;

export const selectOnboardingBlock = (state: RootState) =>
  state.pages.loads.onboardingBlock;

// ---------------------------------------------------------------------------
// Dispatch blocker selectors — structured 422 blockers for inline display
// ---------------------------------------------------------------------------

export const selectCreateBlockers = (state: RootState): DispatchBlocker[] =>
  state.pages.loads.createBlockers;

export const selectAssignBlockers =
  (loadId: string) =>
  (state: RootState): DispatchBlocker[] =>
    state.pages.loads.assignBlockers[loadId] ?? [];

// ---------------------------------------------------------------------------
// Load derivation helpers — pure functions over the canonical nested shape
// ---------------------------------------------------------------------------

type LoadShape = LoadListItem | LoadDetail;

const findFirstPickup = (load: LoadShape): Stop | undefined =>
  load.route.stops.find((s) => s.type === 'PICKUP');

const findLastDelivery = (load: LoadShape): Stop | undefined => {
  const deliveries = load.route.stops.filter((s) => s.type === 'DELIVERY');
  return deliveries[deliveries.length - 1];
};

export const selectLoadOriginCity = (load: LoadShape): string | null =>
  findFirstPickup(load)?.city ?? null;

export const selectLoadOriginState = (load: LoadShape): string | null =>
  findFirstPickup(load)?.state ?? null;

export const selectLoadPickupDate = (load: LoadShape): string | null =>
  findFirstPickup(load)?.appointmentStart ?? null;

export const selectLoadDestinationCity = (load: LoadShape): string | null =>
  findLastDelivery(load)?.city ?? null;

export const selectLoadDestinationState = (load: LoadShape): string | null =>
  findLastDelivery(load)?.state ?? null;

export const selectLoadDeliveryDate = (load: LoadShape): string | null =>
  findLastDelivery(load)?.appointmentStart ?? null;

export const selectLoadDriverName = (load: LoadShape): string | null =>
  load.assignment.driver
    ? `${load.assignment.driver.firstName} ${load.assignment.driver.lastName}`
    : null;

export const selectLoadDriverId = (load: LoadShape): string | null =>
  load.assignment.driver?.id ?? null;

export const selectLoadCarrierName = (load: LoadShape): string | null =>
  load.assignment.carrier?.name ?? null;

export const selectLoadCarrierId = (load: LoadShape): string | null =>
  load.assignment.carrier?.id ?? null;

export const selectLoadCustomerName = (load: LoadShape): string | null =>
  load.customer?.companyName ?? null;

export const selectLoadContactName = (load: LoadShape): string | null =>
  load.contact ? `${load.contact.firstName} ${load.contact.lastName}`.trim() : null;

export const selectLoadContactEmail = (load: LoadShape): string | null =>
  load.contact?.email ?? null;

export const selectLoadContactPhone = (load: LoadShape): string | null =>
  load.contact?.phone ?? null;

// ---------------------------------------------------------------------------
// Filtered loads selector — applies search + status + date filters from state
// ---------------------------------------------------------------------------

// A load matches the date window when its pickup OR delivery appointment falls
// within [dateFrom, dateTo] (inclusive). The date-filter UI always supplies a
// full-day-aligned range, so a same-day boundary still matches.
export const isLoadInDateRange = (
  load: LoadShape,
  dateFrom?: string,
  dateTo?: string,
): boolean => {
  if (!dateFrom && !dateTo) {
    return true;
  }

  const start = dateFrom ? parseISO(dateFrom) : new Date(-8640000000000000);
  const end = dateTo ? parseISO(dateTo) : new Date(8640000000000000);
  const interval = { start, end };

  const pickup = selectLoadPickupDate(load);
  const delivery = selectLoadDeliveryDate(load);

  const pickupInRange = pickup !== null && isWithinInterval(parseISO(pickup), interval);
  const deliveryInRange = delivery !== null && isWithinInterval(parseISO(delivery), interval);

  return pickupInRange || deliveryInRange;
};

export const selectFilteredLoads = createSelector(
  [selectAllLoads, selectLoadFilters],
  (loads, filters): LoadListItem[] => {
    let result = loads;

    if (filters.search) {
      const terms = filters.search.toLowerCase().split(/\s+/).filter(Boolean);
      result = result.filter((load) => {
        const searchableFields = [
          load.loadNumber.toLowerCase(),
          (selectLoadCarrierName(load) ?? '').toLowerCase(),
          (selectLoadDriverName(load) ?? '').toLowerCase(),
          (selectLoadOriginCity(load) ?? '').toLowerCase(),
          (selectLoadDestinationCity(load) ?? '').toLowerCase(),
        ];
        return terms.every((term) => searchableFields.some((field) => field.includes(term)));
      });
    }

    if (filters.carrierName) {
      result = result.filter((load) => selectLoadCarrierName(load) === filters.carrierName);
    }

    if (filters.status && filters.status.length > 0) {
      result = result.filter((load) => filters.status?.includes(load.status));
    }

    if (filters.dateFrom || filters.dateTo) {
      result = result.filter((load) =>
        isLoadInDateRange(load, filters.dateFrom, filters.dateTo),
      );
    }

    return result;
  },
);

export const selectUniqueCarrierNames = createSelector(
  [selectAllLoads],
  (loads): string[] =>
    [...new Set(loads.map((load) => selectLoadCarrierName(load)).filter(Boolean))] as string[],
);

// Kanban groups consume the filtered set so the toolbar filters (status,
// carrier, search, and the date window) apply consistently across every board
// view — previously Kanban read the unfiltered list and ignored the toolbar.
export const selectLoadsByKanbanGroup = createSelector(
  [selectFilteredLoads],
  (loads): Record<KanbanGroup, LoadListItem[]> => {
    const groups: Record<KanbanGroup, LoadListItem[]> = {
      NEW: [],
      BOOKED: [],
      ACTIVE: [],
      DELIVERED: [],
      COMPLETE: [],
      ISSUES: [],
    };

    loads.forEach((load) => {
      const group = STATUS_TO_KANBAN_GROUP[load.status] ?? 'ISSUES';
      groups[group].push(load);
    });

    return groups;
  },
);

const getOriginStop = (stops: Stop[] | undefined): Stop | undefined => {
  if (!stops || stops.length === 0) return undefined;
  const sorted = [...stops].sort((a, b) => a.sequence - b.sequence);
  return sorted.find((s) => s.type === 'PICKUP');
};

const getDestinationStop = (stops: Stop[] | undefined): Stop | undefined => {
  if (!stops || stops.length === 0) return undefined;
  const deliveries = stops.filter((s) => s.type === 'DELIVERY');
  return deliveries.sort((a, b) => b.sequence - a.sequence)[0];
};

const buildCityState = (city: string | null, state: string | null): string => {
  if (!city && !state) return '';
  if (city && state) return `${city}, ${state}`;
  return city ?? state ?? '';
};

const buildStopAddress = (stop: Stop | undefined): string => {
  if (!stop) return '';
  return [stop.address, buildCityState(stop.city, stop.state), stop.zip].filter(Boolean).join(', ');
};

const formatSchedule = (stop: Stop | undefined): string => {
  if (!stop) return '\u2014';
  return formatTimestamp(stop.appointmentStart);
};

export const selectFormattedLoadById = (id: string | undefined) =>
  createSelector(
    [(state: RootState) => (id ? loadSelectors.selectById(state, id) : undefined)],
    (load) => {
      if (!load || !isLoadDetail(load)) return undefined;

      const origin = getOriginStop(load.route.stops);
      const destination = getDestinationStop(load.route.stops);

      const routeLabel =
        [
          buildCityState(origin?.city ?? null, origin?.state ?? null),
          buildCityState(destination?.city ?? null, destination?.state ?? null),
        ]
          .filter(Boolean)
          .join(' \u2192 ') || '\u2014';

      const milesItems = [
        load.route.loadedMiles ? `${load.route.loadedMiles} loaded` : null,
        load.route.deadheadMiles ? `${load.route.deadheadMiles} DH` : null,
      ].filter(Boolean);

      const milesStr = milesItems.length > 0 ? milesItems.join(' + ') : '';

      const formattedStops = load.route.stops.map((s) => ({
        ...s,
        contactPhone: formatPhone(s.contactPhone),
      }));

      return {
        ...load,
        contact: load.contact
          ? { ...load.contact, phone: formatPhone(load.contact.phone) }
          : load.contact,
        route: { ...load.route, stops: formattedStops },
        summary: {
          pickup: {
            facilityName: origin?.facilityName ?? '\u2014',
            address: buildStopAddress(origin),
            schedule: formatSchedule(origin),
            cityState: buildCityState(origin?.city ?? null, origin?.state ?? null),
            dateTime: formatSchedule(origin),
            isCompleted: Boolean(origin?.arrivalTime),
          },
          delivery: {
            facilityName: destination?.facilityName ?? '\u2014',
            address: buildStopAddress(destination),
            schedule: formatSchedule(destination),
            cityState: buildCityState(destination?.city ?? null, destination?.state ?? null),
            dateTime: formatSchedule(destination),
            isCompleted: Boolean(destination?.departureTime),
          },
          load: {
            routeLabel,
            miles: milesStr,
            cargo:
              [
                load.cargo.commodity,
                load.cargo.weight ? `${load.cargo.weight.toLocaleString()} lbs` : null,
              ]
                .filter(Boolean)
                .join(' \u00b7 ') || '',
            rate: formatCurrencyCompact(load.financials.customerRate),
            ratePerMile: load.financials.ratePerMile
              ? `$${parseFloat(load.financials.ratePerMile).toFixed(2)}/mi`
              : '',
            weight: load.cargo.weight,
            isHazmat: load.cargo.isHazmat,
            isTarp: load.cargo.isTarp,
            externalRefNumber: load.externalRefNumber,
          },
          driver: {
            name: load.assignment.driver
              ? `${load.assignment.driver.firstName} ${load.assignment.driver.lastName}`
              : '\u2014',
            carrier: load.assignment.carrier?.name ?? '\u2014',
            vehicle: load.assignment.vehicle
              ? `#${load.assignment.vehicle.unitNumber} \u2014 ${formatEquipmentType(load.assignment.vehicle.type)}`
              : '\u2014',
            equipment: formatEquipmentType(load.equipmentType),
            driverId: load.assignment.driver?.id ?? null,
            carrierId: load.assignment.carrier?.id ?? null,
          },
        },
      };
    },
  );
