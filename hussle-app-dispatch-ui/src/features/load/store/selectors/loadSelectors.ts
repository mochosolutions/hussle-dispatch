import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { LoadingState } from '@mocho/ui/redux';
import { loadSelectors } from '../reducers/loadEntitySlice';
import { STATUS_TO_KANBAN_GROUP, formatEquipmentType } from '../../constants';
import { formatAppointmentDateTime, formatCurrencyCompact } from '../../constants';
import { isLoadDetail } from '../../types';
import type {
  BoardView,
  FormattedLoadDetail,
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

export const selectLoadListLoading = (state: RootState) =>
  state.pages.loads.loading['getAll'] === LoadingState.Pending;

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

// ---------------------------------------------------------------------------
// Kanban grouping selector
// ---------------------------------------------------------------------------

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
          (load.carrierName ?? '').toLowerCase(),
          (load.driverName ?? '').toLowerCase(),
          (load.originCity ?? '').toLowerCase(),
          (load.destinationCity ?? '').toLowerCase(),
        ];
        return terms.every((term) => searchableFields.some((field) => field.includes(term)));
      });
    }

    if (filters.carrierName) {
      result = result.filter((load) => load.carrierName === filters.carrierName);
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
    [...new Set(loads.map((load) => load.carrierName).filter(Boolean))] as string[],
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

const getOriginStop = (stops: Stop[]): Stop | undefined => {
  const sorted = [...stops].sort((a, b) => a.sequence - b.sequence);
  return sorted.find((s) => s.type === 'PICKUP');
};

const getDestinationStop = (stops: Stop[]): Stop | undefined => {
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

export const selectFormattedLoadById = (id: string | undefined) =>
  createSelector(
    [(state: RootState) => (id ? loadSelectors.selectById(state, id) : undefined)],
    (load): FormattedLoadDetail | undefined => {
      if (!load || !isLoadDetail(load)) return undefined;

      const origin = getOriginStop(load.stops);
      const destination = getDestinationStop(load.stops);

      const routeLabel =
        [
          buildCityState(origin?.city ?? null, origin?.state ?? null),
          buildCityState(destination?.city ?? null, destination?.state ?? null),
        ]
          .filter(Boolean)
          .join(' → ') || '\u2014';

      const milesItems = [
        load.loadedMiles ? `${load.loadedMiles} loaded` : null,
        load.deadheadMiles ? `${load.deadheadMiles} DH` : null,
      ].filter(Boolean);
      const milesStr = milesItems.length > 0 ? milesItems.join(' + ') : '';

      return {
        ...load,
        summary: {
          pickup: {
            facilityName: origin?.facilityName ?? '\u2014',
            address: buildStopAddress(origin),
            schedule: origin
              ? formatAppointmentDateTime(origin.appointmentDate, origin.appointmentTime)
              : '\u2014',
            cityState: buildCityState(origin?.city ?? null, origin?.state ?? null),
            dateTime: origin
              ? formatAppointmentDateTime(origin.appointmentDate, origin.appointmentTime)
              : '\u2014',
            isCompleted: Boolean(origin?.arrivalTime),
          },
          delivery: {
            facilityName: destination?.facilityName ?? '\u2014',
            address: buildStopAddress(destination),
            schedule: destination
              ? formatAppointmentDateTime(destination.appointmentDate, destination.appointmentTime)
              : '\u2014',
            cityState: buildCityState(destination?.city ?? null, destination?.state ?? null),
            dateTime: destination
              ? formatAppointmentDateTime(destination.appointmentDate, destination.appointmentTime)
              : '\u2014',
            isCompleted: Boolean(destination?.departureTime),
          },
          load: {
            routeLabel,
            miles: milesStr,
            cargo:
              [load.commodity, load.weight ? `${load.weight.toLocaleString()} lbs` : null]
                .filter(Boolean)
                .join(' · ') || '',
            rate: formatCurrencyCompact(load.customerRate),
            ratePerMile: load.ratePerMile ? `$${parseFloat(load.ratePerMile).toFixed(2)}/mi` : '',
            weight: load.weight,
            isHazmat: load.isHazmat,
            isTarp: load.isTarp,
          },
          driver: {
            name: load.driver ? `${load.driver.firstName} ${load.driver.lastName}` : '\u2014',
            carrier: load.carrier?.name ?? '\u2014',
            vehicle: load.vehicle
              ? `#${load.vehicle.unitNumber} \u2014 ${formatEquipmentType(load.vehicle.type)}`
              : '\u2014',
            equipment: formatEquipmentType(load.equipmentType),
          },
        },
      };
    },
  );
