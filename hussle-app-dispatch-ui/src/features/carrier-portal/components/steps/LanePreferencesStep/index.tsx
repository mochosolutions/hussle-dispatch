// ---------------------------------------------------------------------------
// LanePreferencesStep — dedicated renderer for the `lane-preferences` engine step.
//
// US-22 AC-19 UI side:
//   - Fleet default scope (default): 3 sections (Lanes, Weekly schedule, Freight types).
//   - Per-driver scope: DriverChip bar with All / Customized filter + edge-fade scroll.
//   - Per-driver sections render at opacity 0.65 when inherited; show OverrideBadge +
//     reset link when overridden.
//   - Submit dispatches `saveLanePreferences` with `{ fleet, overrides }`.
//   - Owner-operator (0 drivers): per-driver tab is disabled.
// ---------------------------------------------------------------------------

import { useCallback, useMemo, useState } from 'react';
import { Box, Button, ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
  AcUnit,
  BlockOutlined,
  DirectionsCar,
  Inventory2Outlined,
  LayersOutlined,
  LocalShipping,
  OpenInFullOutlined,
  PeopleAltOutlined,
  PowerOutlined,
  ViewModuleOutlined,
  WarningAmberOutlined,
  WaterDropOutlined,
} from '@mui/icons-material';

import { useDispatch, useSelector } from 'store';
import { Body, BodyMuted } from 'components/Typography';

import type { Step } from 'features/carrier-portal/engine';
import LaneStateMap, {
  type LanePreferences,
} from 'features/carrier-portal/components/LaneStateMap';
import ScopeBar from 'features/carrier-portal/components/ScopeBar';
import type { ScopeBarOption } from 'features/carrier-portal/components/ScopeBar';
import DriverChip from 'features/carrier-portal/components/DriverChip';
import SectionHead from 'features/carrier-portal/components/SectionHead';
import OverrideBadge from 'features/carrier-portal/components/OverrideBadge';
import EditingCallout from 'features/carrier-portal/components/EditingCallout';
import ScheduleGrid, {
  type WeeklySchedule,
} from 'features/carrier-portal/components/ScheduleGrid';
import SchedulePresetGroup, {
  type SchedulePresetOption,
} from 'features/carrier-portal/components/SchedulePresetGroup';
import OptCard from 'features/carrier-portal/components/OptCard';
import FreightChip, {
  type FreightChipState,
} from 'features/carrier-portal/components/FreightChip';
import { useStepNavigation } from 'features/carrier-portal/components/StepNavContext';

import { carrierPortalV2Actions } from '../../../store/reducers/carrierPortalSlice';
import { selectLoading, selectSession } from '../../../store/selectors/carrierPortalSelectors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ScopeMode = 'fleet' | 'per_driver';

type DriverFilter = 'all' | 'customized';

type SchedulePreset =
  | 'weekdays'
  | 'weekdays_flex_fri'
  | 'long_haul'
  | 'regional_61'
  | 'custom';

type FreightTypeId =
  | 'dry_van'
  | 'reefer'
  | 'flatbed'
  | 'step_deck'
  | 'power_only'
  | 'containers'
  | 'hazmat'
  | 'oversize'
  | 'auto_haul'
  | 'tanker';

interface FreightType {
  id: FreightTypeId;
  label: string;
  icon: React.ReactNode;
}

interface DriverEntry {
  id: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
}

interface FleetPrefs {
  lanes: LanePreferences;
  schedule: WeeklySchedule;
  schedulePreset: SchedulePreset | null;
  maxMiles: number;
  maxDays: number;
  freight: Record<FreightTypeId, FreightChipState>;
}

interface SectionOverrides {
  lanes?: LanePreferences;
  schedule?: WeeklySchedule;
  schedulePreset?: SchedulePreset | null;
  maxMiles?: number;
  maxDays?: number;
  freight?: Record<FreightTypeId, FreightChipState>;
}

interface LanePreferencesStepProps {
  step: Step;
}

interface DriversListAnswers {
  entries?: DriverEntry[];
}

interface LanePreferencesAnswers {
  fleet?: Partial<FleetPrefs>;
  overrides?: Record<string, SectionOverrides>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPTY_LANES: LanePreferences = {};

const DEFAULT_SCHEDULE: WeeklySchedule = {
  mon: 'on',
  tue: 'on',
  wed: 'on',
  thu: 'on',
  fri: 'on',
  sat: 'off',
  sun: 'off',
};

const DEFAULT_FREIGHT: Record<FreightTypeId, FreightChipState> = {
  dry_van: 'neutral',
  reefer: 'neutral',
  flatbed: 'neutral',
  step_deck: 'neutral',
  power_only: 'neutral',
  containers: 'neutral',
  hazmat: 'neutral',
  oversize: 'neutral',
  auto_haul: 'neutral',
  tanker: 'neutral',
};

const FREIGHT_TYPES: FreightType[] = [
  { id: 'dry_van', label: 'Dry van', icon: <LocalShipping /> },
  { id: 'reefer', label: 'Reefer', icon: <AcUnit /> },
  { id: 'flatbed', label: 'Flatbed', icon: <ViewModuleOutlined /> },
  { id: 'step_deck', label: 'Step-deck', icon: <LayersOutlined /> },
  { id: 'power_only', label: 'Power-only', icon: <PowerOutlined /> },
  { id: 'containers', label: 'Containers', icon: <Inventory2Outlined /> },
  { id: 'hazmat', label: 'Hazmat', icon: <WarningAmberOutlined /> },
  { id: 'oversize', label: 'Oversize', icon: <OpenInFullOutlined /> },
  { id: 'auto_haul', label: 'Auto-haul', icon: <DirectionsCar /> },
  { id: 'tanker', label: 'Tanker', icon: <WaterDropOutlined /> },
];

const FREIGHT_CYCLE: Record<FreightChipState, FreightChipState> = {
  neutral: 'on',
  on: 'avoid',
  avoid: 'neutral',
};

const SCHEDULE_PRESET_OPTIONS: SchedulePresetOption<SchedulePreset>[] = [
  { value: 'weekdays', title: '5 / 2 weekdays', sub: 'Mon–Fri on, weekends off' },
  { value: 'weekdays_flex_fri', title: '5 / 2 + Flex Fri', sub: 'Friday last-minute OK' },
  { value: 'long_haul', title: 'Long-haul OTR', sub: '14 on, 7 off' },
  { value: 'regional_61', title: 'Regional 6 / 1', sub: 'Home Sundays only' },
  { value: 'custom', title: 'Custom', sub: 'Set each day' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const driverName = (d: DriverEntry): string => {
  const parts = [d.firstName, d.lastName].filter(Boolean).join(' ');
  return parts || d.nickname || `Driver ${d.id.slice(0, 6)}`;
};

const driverInitials = (d: DriverEntry): string => {
  const first = d.firstName?.[0] ?? '';
  const last = d.lastName?.[0] ?? '';
  if (first || last) {
    return `${first}${last}`.toUpperCase();
  }
  return d.id.slice(0, 2).toUpperCase();
};

const isFreightTypeId = (id: string): id is FreightTypeId =>
  [
    'dry_van',
    'reefer',
    'flatbed',
    'step_deck',
    'power_only',
    'containers',
    'hazmat',
    'oversize',
    'auto_haul',
    'tanker',
  ].includes(id);

// ---------------------------------------------------------------------------
// Backend payload mappers
//
// The backend `lanePreferencesValidator` (api/src/carrier-portal/validators/
// lanePreferencesValidator.ts) is the source of truth: `schedule` (not
// `weeklySchedule`), `freightTypes` (not `freightPreferences`),
// `maxMilesFromHome` (not `maxMilesFromHomeBase`). It also rejects `'neutral'`
// — those entries are local UI state only — and accepts the `'no_limit'`
// sentinel for unlimited radius (UI stores that as `-1`).
// ---------------------------------------------------------------------------

const toBackendLanes = (
  lanes: LanePreferences,
): Record<string, 'preferred' | 'avoid'> => {
  const out: Record<string, 'preferred' | 'avoid'> = {};
  for (const [state, value] of Object.entries(lanes)) {
    if (value === 'preferred' || value === 'avoid') {
      out[state] = value;
    }
  }
  return out;
};

const toBackendFreight = (
  freight: Record<FreightTypeId, FreightChipState>,
): Record<string, 'on' | 'avoid'> => {
  const out: Record<string, 'on' | 'avoid'> = {};
  for (const [id, state] of Object.entries(freight)) {
    if (state === 'on' || state === 'avoid') {
      out[id] = state;
    }
  }
  return out;
};

const NO_LIMIT_SENTINEL = -1;

const toBackendMaxMiles = (value: number): number | 'no_limit' =>
  value === NO_LIMIT_SENTINEL ? 'no_limit' : value;

const buildInitialFleet = (existing: Partial<FleetPrefs>): FleetPrefs => ({
  lanes: existing.lanes ?? EMPTY_LANES,
  schedule: existing.schedule ?? DEFAULT_SCHEDULE,
  schedulePreset: existing.schedulePreset ?? 'weekdays',
  maxMiles: existing.maxMiles ?? 600,
  maxDays: existing.maxDays ?? 5,
  freight: existing.freight ?? { ...DEFAULT_FREIGHT },
});

// ---------------------------------------------------------------------------
// LinkButton (local — not shared)
// ---------------------------------------------------------------------------

interface LinkButtonProps {
  label: string;
  onClick?: () => void;
  size?: 'sm' | 'md';
  color?: 'primary' | 'muted';
}

const LinkButton: React.FC<LinkButtonProps> = ({
  label,
  onClick,
  size = 'md',
  color = 'primary',
}) => (
  <Button
    onClick={onClick}
    variant="text"
    sx={{
      p: 0,
      minWidth: 0,
      textTransform: 'none',
      fontSize: size === 'sm' ? 12 : 12.5,
      fontWeight: color === 'primary' ? 600 : 500,
      color: color === 'primary' ? 'primary.main' : 'text.secondary',
      textDecoration: 'underline',
      textUnderlineOffset: '3px',
      '&:hover': {
        bgcolor: 'transparent',
        color: color === 'primary' ? 'primary.dark' : 'text.primary',
      },
    }}
  >
    {label}
  </Button>
);

// ---------------------------------------------------------------------------
// DriverBar — chip row with All / Customized filter + edge-fade scroll
// ---------------------------------------------------------------------------

interface DriverBarProps {
  drivers: DriverEntry[];
  overrides: Record<string, SectionOverrides>;
  activeId: string;
  onSelect: (id: string) => void;
}

const DriverBar: React.FC<DriverBarProps> = ({ drivers, overrides, activeId, onSelect }) => {
  const [filter, setFilter] = useState<DriverFilter>('all');

  const customizedCount = useMemo(
    () => drivers.filter((d) => Object.keys(overrides[d.id] ?? {}).length > 0).length,
    [drivers, overrides],
  );

  const visible = useMemo(
    () =>
      filter === 'all'
        ? drivers
        : drivers.filter((d) => Object.keys(overrides[d.id] ?? {}).length > 0),
    [filter, drivers, overrides],
  );

  const handleFilterChange = (_e: React.SyntheticEvent, next: DriverFilter | null): void => {
    if (next !== null) {
      setFilter(next);
    }
  };

  return (
    <Box sx={{ mb: 2.25 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mb: 1,
          flexWrap: 'wrap',
        }}
      >
        <BodyMuted sx={{ fontSize: 12, fontWeight: 500 }}>
          <strong style={{ color: 'inherit' }}>{customizedCount}</strong> of {drivers.length}{' '}
          customized
        </BodyMuted>
        <ToggleButtonGroup
          size="small"
          value={filter}
          exclusive
          onChange={handleFilterChange}
          aria-label="Driver filter"
          sx={{
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              fontSize: 12,
              fontWeight: 600,
              px: 1.25,
              py: 0.375,
              borderColor: 'grey.200',
              color: 'text.secondary',
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'common.white',
                '&:hover': { bgcolor: 'primary.dark' },
              },
            },
          }}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="customized">Customized only</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Edge-fade scroll container */}
      <Box
        sx={{
          position: 'relative',
          '&::before, &::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            bottom: 8,
            width: 24,
            pointerEvents: 'none',
            zIndex: 1,
          },
          '&::before': {
            left: 0,
            background: (theme) =>
              `linear-gradient(to right, ${theme.palette.background.paper}, rgba(255,255,255,0))`,
          },
          '&::after': {
            right: 0,
            background: (theme) =>
              `linear-gradient(to left, ${theme.palette.background.paper}, rgba(255,255,255,0))`,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            pb: 1,
            px: 0.25,
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(15, 23, 42, 0.15)',
              borderRadius: 3,
            },
          }}
        >
          {visible.map((driver) => {
            const hasOverrides = Object.keys(overrides[driver.id] ?? {}).length > 0;
            return (
              <DriverChip
                key={driver.id}
                initials={driverInitials(driver)}
                name={driverName(driver)}
                subLabel={hasOverrides ? 'Custom overrides' : 'Uses fleet default'}
                status={hasOverrides ? 'overridden' : 'default'}
                active={activeId === driver.id}
                onClick={() => onSelect(driver.id)}
              />
            );
          })}
          {visible.length === 0 ? (
            <BodyMuted sx={{ fontSize: 12, py: 1, px: 1, fontStyle: 'italic' }}>
              No customized drivers yet. Pick one from &quot;All&quot;.
            </BodyMuted>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// SectionWrapper
// ---------------------------------------------------------------------------

const SectionWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ mb: 3.5 }}>{children}</Box>
);

// ---------------------------------------------------------------------------
// LanePreferencesStep
// ---------------------------------------------------------------------------

const LanePreferencesStep: React.FC<LanePreferencesStepProps> = ({ step }) => {
  const dispatch = useDispatch();
  const session = useSelector(selectSession);
  const saveStatus = useSelector(selectLoading('lanePreferences'));

  // ---------------------------------------------------------------------------
  // Drivers from session
  // ---------------------------------------------------------------------------

  const drivers = useMemo<DriverEntry[]>(() => {
    if (!session) {
      return [];
    }
    const driversAnswers = (session.answers['drivers-list'] ?? {}) as DriversListAnswers;
    const entries = driversAnswers.entries;
    return Array.isArray(entries)
      ? entries.filter((d): d is DriverEntry => Boolean(d?.id))
      : [];
  }, [session]);

  // ---------------------------------------------------------------------------
  // Existing answers (for initialization)
  // ---------------------------------------------------------------------------

  const existingAnswers = useMemo<LanePreferencesAnswers>(() => {
    if (!session) {
      return {};
    }
    // After the B6 migration, session.answers[step.id] is empty (the saga
    // only writes engine state). session.lanePreferences.mirror carries the
    // full server-projected payload (fleet + per-driver overrides) — fall
    // back to it so back-navigation and refresh prefill the form.
    const fromAnswers = session.answers[step.id];
    if (fromAnswers && Object.keys(fromAnswers).length > 0) {
      return fromAnswers as LanePreferencesAnswers;
    }
    const mirror = session.lanePreferences?.mirror;
    return (mirror ?? {}) as LanePreferencesAnswers;
  }, [session, step.id]);

  // ---------------------------------------------------------------------------
  // Local state
  // ---------------------------------------------------------------------------

  const [scope, setScope] = useState<ScopeMode>('fleet');
  const [selectedDriverId, setSelectedDriverId] = useState<string>(() => drivers[0]?.id ?? '');
  const [fleet, setFleet] = useState<FleetPrefs>(() => buildInitialFleet(existingAnswers.fleet ?? {}));
  const [overrides, setOverrides] = useState<Record<string, SectionOverrides>>(
    () => existingAnswers.overrides ?? {},
  );

  // ---------------------------------------------------------------------------
  // Scope switch: disabled if no drivers (owner-operator)
  // ---------------------------------------------------------------------------

  const hasDrivers = drivers.length > 0;

  const scopeOptions: ScopeBarOption<ScopeMode>[] = [
    {
      value: 'fleet',
      label: 'Fleet default',
      icon: <LocalShipping />,
      count: hasDrivers ? `applies to ${drivers.length}` : 'owner-operator',
    },
    {
      value: 'per_driver',
      label: 'Per-driver overrides',
      icon: <PeopleAltOutlined />,
      count: hasDrivers
        ? `${Object.keys(overrides).filter((id) => Object.keys(overrides[id] ?? {}).length > 0).length} of ${drivers.length}`
        : 'N/A',
    },
  ];

  const handleScopeChange = (next: ScopeMode): void => {
    if (next === 'per_driver' && !hasDrivers) {
      return;
    }
    setScope(next);
    if (next === 'per_driver' && !selectedDriverId && drivers[0]) {
      setSelectedDriverId(drivers[0].id);
    }
  };

  // ---------------------------------------------------------------------------
  // Section update helpers
  // ---------------------------------------------------------------------------

  const updateFleetSection = (patch: Partial<FleetPrefs>): void => {
    setFleet((prev) => ({ ...prev, ...patch }));
  };

  const updateDriverSection = (section: keyof SectionOverrides, value: unknown): void => {
    if (!selectedDriverId) {
      return;
    }
    setOverrides((prev) => ({
      ...prev,
      [selectedDriverId]: {
        ...prev[selectedDriverId],
        [section]: value,
      },
    }));
  };

  const resetDriverSection = (section: keyof SectionOverrides): void => {
    if (!selectedDriverId) {
      return;
    }
    setOverrides((prev) => {
      const driverOverride = { ...(prev[selectedDriverId] ?? {}) };
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete driverOverride[section];
      return {
        ...prev,
        [selectedDriverId]: driverOverride,
      };
    });
  };

  // ---------------------------------------------------------------------------
  // Per-driver derived values
  // ---------------------------------------------------------------------------

  const activeDriverOverrides: SectionOverrides = overrides[selectedDriverId] ?? {};
  const activeDriver = drivers.find((d) => d.id === selectedDriverId);

  // Effective values: override if present, else fleet default
  const effectiveLanes =
    scope === 'per_driver' && activeDriverOverrides.lanes !== undefined
      ? activeDriverOverrides.lanes
      : fleet.lanes;

  const effectiveSchedule =
    scope === 'per_driver' && activeDriverOverrides.schedule !== undefined
      ? activeDriverOverrides.schedule
      : fleet.schedule;

  const effectiveSchedulePreset =
    scope === 'per_driver' && activeDriverOverrides.schedulePreset !== undefined
      ? activeDriverOverrides.schedulePreset
      : fleet.schedulePreset;

  const effectiveMaxMiles =
    scope === 'per_driver' && activeDriverOverrides.maxMiles !== undefined
      ? activeDriverOverrides.maxMiles
      : fleet.maxMiles;

  const effectiveMaxDays =
    scope === 'per_driver' && activeDriverOverrides.maxDays !== undefined
      ? activeDriverOverrides.maxDays
      : fleet.maxDays;

  const effectiveFreight =
    scope === 'per_driver' && activeDriverOverrides.freight !== undefined
      ? activeDriverOverrides.freight
      : fleet.freight;

  // Section inherited (opacity 0.65) when in per-driver scope and no override set
  const lanesInherited = scope === 'per_driver' && activeDriverOverrides.lanes === undefined;
  const scheduleInherited =
    scope === 'per_driver' && activeDriverOverrides.schedule === undefined;
  const freightInherited = scope === 'per_driver' && activeDriverOverrides.freight === undefined;

  // ---------------------------------------------------------------------------
  // Lane summary counts
  // ---------------------------------------------------------------------------

  const preferredLaneCount = Object.values(effectiveLanes).filter((v) => v === 'preferred').length;
  const avoidedLaneCount = Object.values(effectiveLanes).filter((v) => v === 'avoid').length;
  const onFreightCount = Object.values(effectiveFreight).filter((v) => v === 'on').length;
  const avoidFreightCount = Object.values(effectiveFreight).filter((v) => v === 'avoid').length;

  // ---------------------------------------------------------------------------
  // Section handlers
  // ---------------------------------------------------------------------------

  const handleLanesChange = (next: LanePreferences): void => {
    if (scope === 'fleet') {
      updateFleetSection({ lanes: next });
    } else {
      updateDriverSection('lanes', next);
    }
  };

  const handleScheduleChange = (next: WeeklySchedule): void => {
    if (scope === 'fleet') {
      updateFleetSection({ schedule: next });
    } else {
      updateDriverSection('schedule', next);
    }
  };

  const handleSchedulePresetChange = (next: SchedulePreset): void => {
    if (scope === 'fleet') {
      updateFleetSection({ schedulePreset: next });
    } else {
      updateDriverSection('schedulePreset', next);
    }
  };

  const handleMaxMilesChange = (next: number): void => {
    if (scope === 'fleet') {
      updateFleetSection({ maxMiles: next });
    } else {
      updateDriverSection('maxMiles', next);
    }
  };

  const handleMaxDaysChange = (next: number): void => {
    if (scope === 'fleet') {
      updateFleetSection({ maxDays: next });
    } else {
      updateDriverSection('maxDays', next);
    }
  };

  const handleFreightClick = (id: FreightTypeId): void => {
    const current = effectiveFreight[id];
    const next = FREIGHT_CYCLE[current];
    if (scope === 'fleet') {
      updateFleetSection({ freight: { ...effectiveFreight, [id]: next } });
    } else {
      // When clicking freight in per-driver scope and currently inherited,
      // initialize override from fleet defaults first
      const base = activeDriverOverrides.freight ?? { ...fleet.freight };
      updateDriverSection('freight', { ...base, [id]: FREIGHT_CYCLE[base[id] ?? 'neutral'] });
    }
  };

  const handleOverrideFreightClick = (id: FreightTypeId): void => {
    // Initialize override from fleet
    updateDriverSection('freight', { ...fleet.freight });
    // Update the specific freight type
    const base = { ...fleet.freight };
    updateDriverSection('freight', { ...base, [id]: FREIGHT_CYCLE[base[id]] });
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = useCallback((): void => {
    const payload: Record<string, unknown> = {
      fleet: {
        lanes: toBackendLanes(fleet.lanes),
        schedule: fleet.schedule,
        schedulePreset: fleet.schedulePreset,
        freightTypes: toBackendFreight(fleet.freight),
        maxMilesFromHome: toBackendMaxMiles(fleet.maxMiles),
        maxDaysOut: fleet.maxDays,
      },
      overrides: Object.fromEntries(
        Object.entries(overrides)
          .filter(([, v]) => Object.keys(v).length > 0)
          .map(([driverId, driverOverride]) => [
            driverId,
            {
              ...(driverOverride.lanes !== undefined
                ? { lanes: toBackendLanes(driverOverride.lanes) }
                : {}),
              ...(driverOverride.schedule !== undefined
                ? { schedule: driverOverride.schedule }
                : {}),
              ...(driverOverride.schedulePreset !== undefined
                ? { schedulePreset: driverOverride.schedulePreset }
                : {}),
              ...(driverOverride.freight !== undefined
                ? { freightTypes: toBackendFreight(driverOverride.freight) }
                : {}),
              ...(driverOverride.maxMiles !== undefined
                ? { maxMilesFromHome: toBackendMaxMiles(driverOverride.maxMiles) }
                : {}),
              ...(driverOverride.maxDays !== undefined
                ? { maxDaysOut: driverOverride.maxDays }
                : {}),
            },
          ]),
      ),
    };
    dispatch(carrierPortalV2Actions.saveLanePreferences(payload));
  }, [dispatch, fleet, overrides]);

  const isPending = saveStatus === 'pending';

  useStepNavigation({
    canContinue: !isPending,
    onContinue: handleSubmit,
    isPending,
  });

  // ---------------------------------------------------------------------------
  // Guard
  // ---------------------------------------------------------------------------

  if (!session) {
    return null;
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderLanesSection = (): React.ReactNode => (
    <SectionWrapper>
      <Box sx={{ opacity: lanesInherited ? 0.65 : 1 }}>
        <SectionHead
          number={1}
          title="Lanes"
          titleSuffix={
            scope === 'per_driver' && !lanesInherited ? <OverrideBadge /> : undefined
          }
          rightSlot={
            scope === 'per_driver' ? (
              <Box
                component="span"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}
              >
                <span>
                  {preferredLaneCount} preferred · {avoidedLaneCount} avoided
                </span>
                {!lanesInherited ? (
                  <LinkButton
                    label="reset"
                    size="sm"
                    color="muted"
                    onClick={() => resetDriverSection('lanes')}
                  />
                ) : null}
              </Box>
            ) : (
              `${preferredLaneCount} preferred · ${avoidedLaneCount} avoided`
            )
          }
        />
        <LaneStateMap
          value={effectiveLanes}
          onChange={lanesInherited ? () => undefined : handleLanesChange}
        />
      </Box>
    </SectionWrapper>
  );

  const renderScheduleSection = (): React.ReactNode => (
    <SectionWrapper>
      <Box sx={{ opacity: scheduleInherited ? 0.65 : 1 }}>
        <SectionHead
          number={2}
          title="Weekly schedule"
          titleSuffix={
            scope === 'per_driver' && !scheduleInherited ? <OverrideBadge /> : undefined
          }
          rightSlot={
            scope === 'per_driver' ? (
              <Box
                component="span"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}
              >
                <span>Schedule</span>
                {!scheduleInherited ? (
                  <LinkButton
                    label="reset"
                    size="sm"
                    color="muted"
                    onClick={() => {
                      resetDriverSection('schedule');
                      resetDriverSection('schedulePreset');
                      resetDriverSection('maxMiles');
                      resetDriverSection('maxDays');
                    }}
                  />
                ) : null}
              </Box>
            ) : undefined
          }
        />
        <ScheduleGrid
          value={effectiveSchedule}
          onChange={scheduleInherited ? () => undefined : handleScheduleChange}
        />
        <SchedulePresetGroup<SchedulePreset>
          options={SCHEDULE_PRESET_OPTIONS}
          value={effectiveSchedulePreset}
          onChange={scheduleInherited ? () => undefined : handleSchedulePresetChange}
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1.75,
            mt: 2,
          }}
        >
          <OptCard<number>
            label="Max miles from home base"
            amount={effectiveMaxMiles}
            unit="mi radius"
            options={[
              { value: 250, label: '250' },
              { value: 500, label: '500' },
              { value: 600, label: '600' },
              { value: 1000, label: '1,000' },
              { value: -1, label: 'No limit' },
            ]}
            value={effectiveMaxMiles}
            onChange={scheduleInherited ? () => undefined : handleMaxMilesChange}
          />
          <OptCard<number>
            label="Max days out per trip"
            amount={effectiveMaxDays}
            unit="days"
            options={[
              { value: 2, label: '2' },
              { value: 3, label: '3' },
              { value: 5, label: '5' },
              { value: 7, label: '7' },
              { value: 14, label: '14' },
            ]}
            value={effectiveMaxDays}
            onChange={scheduleInherited ? () => undefined : handleMaxDaysChange}
          />
        </Box>
      </Box>
    </SectionWrapper>
  );

  const renderFreightSection = (): React.ReactNode => (
    <SectionWrapper>
      <Box sx={{ opacity: freightInherited ? 0.65 : 1 }}>
        <SectionHead
          number={3}
          title="Freight types"
          titleSuffix={
            scope === 'per_driver' && !freightInherited ? <OverrideBadge /> : undefined
          }
          rightSlot={
            scope === 'per_driver' && !freightInherited ? (
              <Box
                component="span"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}
              >
                <span>Tap to include · tap again to avoid</span>
                <LinkButton
                  label="reset"
                  size="sm"
                  color="muted"
                  onClick={() => resetDriverSection('freight')}
                />
              </Box>
            ) : (
              'Tap to include · tap again to avoid'
            )
          }
        />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {FREIGHT_TYPES.map((type) => {
            const chipState = isFreightTypeId(type.id) ? effectiveFreight[type.id] : 'neutral';
            return (
              <FreightChip
                key={type.id}
                state={chipState}
                label={type.label}
                icon={type.icon}
                onClick={
                  freightInherited
                    ? undefined
                    : () => {
                        if (isFreightTypeId(type.id)) {
                          handleFreightClick(type.id);
                        }
                      }
                }
              />
            );
          })}
        </Box>
        <BodyMuted sx={{ fontSize: 12, mt: 1.25 }}>
          {onFreightCount} preferred · {avoidFreightCount} avoided · rest neutral
        </BodyMuted>
        {freightInherited ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.25 }}>
            <LinkButton
              label={`Override freight for ${activeDriver ? driverName(activeDriver) : 'this driver'}`}
              size="sm"
              onClick={() => {
                if (FREIGHT_TYPES[0] && isFreightTypeId(FREIGHT_TYPES[0].id)) {
                  handleOverrideFreightClick(FREIGHT_TYPES[0].id);
                }
              }}
            />
            <Body sx={{ fontSize: 12, color: 'text.secondary' }}>
              to set different freight types just for them.
            </Body>
          </Box>
        ) : null}
      </Box>
    </SectionWrapper>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box sx={{ width: '100%', maxWidth: 960 }}>
      <ScopeBar<ScopeMode>
        options={scopeOptions}
        value={scope}
        onChange={handleScopeChange}
      />

      {scope === 'per_driver' && hasDrivers ? (
        <>
          <DriverBar
            drivers={drivers}
            overrides={overrides}
            activeId={selectedDriverId}
            onSelect={setSelectedDriverId}
          />
          {activeDriver ? (
            <EditingCallout
              message={
                <>
                  You&apos;re editing <strong>{driverName(activeDriver)}&apos;s</strong>{' '}
                  preferences. Only what you change here overrides the fleet default.
                </>
              }
            />
          ) : null}
        </>
      ) : null}

      {renderLanesSection()}
      {renderScheduleSection()}
      {renderFreightSection()}
    </Box>
  );
};

export default LanePreferencesStep;
