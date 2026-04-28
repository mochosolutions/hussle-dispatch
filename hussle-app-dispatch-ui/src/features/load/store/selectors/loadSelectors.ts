import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { LoadingState } from '@mocho/ui/redux';
import { loadSelectors } from '../reducers/loadEntitySlice';
import { STATUS_TO_KANBAN_GROUP, formatEquipmentType } from '../../constants';
import { formatTimestamp, formatCurrencyCompact } from '../../constants';
import formatPhone from 'utils/formatPhone';
import { isLoadDetail } from '../../types';
import type {
  BoardView,
  KanbanGroup,
  LoadDetail,
  LoadFilters,
  LoadListItem,
  Stop,
} from '../../types';

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
// Filtered loads selector — applies search + status filters from Redux state
// ---------------------------------------------------------------------------

export const selectFilteredLoads = createSelector(
  [selectAllLoads, selectLoadFilters],
  (loads, filters): LoadListItem[] => {
    let result = loads;

    if (filters.search) {
      const terms = filters.search.toLowerCase().split(/\s+/).filter(Boolean);
      result = result.filter((load) => {
        const searchableFields = [
          load.loadNumber.toLowerCase(),
          (load.assignment.carrierName ?? '').toLowerCase(),
          (load.assignment.driverName ?? '').toLowerCase(),
          (load.route.originCity ?? '').toLowerCase(),
          (load.route.destinationCity ?? '').toLowerCase(),
        ];
        return terms.every((term) => searchableFields.some((field) => field.includes(term)));
      });
    }

    if (filters.carrierName) {
      result = result.filter((load) => load.assignment.carrierName === filters.carrierName);
    }

    if (filters.status && filters.status.length > 0) {
      result = result.filter((load) => filters.status?.includes(load.status));
    }

    return result;
  },
);

export const selectUniqueCarrierNames = createSelector(
  [selectAllLoads],
  (loads): string[] =>
    [...new Set(loads.map((load) => load.assignment.carrierName).filter(Boolean))] as string[],
);

export const selectLoadsByKanbanGroup = createSelector(
  [selectAllLoads],
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
