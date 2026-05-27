import { useMemo, useState } from 'react';
import { Box, Button, ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
  AcUnit,
  DirectionsCar,
  Inventory2Outlined,
  LayersOutlined,
  LocalShipping,
  OpenInFullOutlined,
  PeopleAltOutlined,
  PowerOutlined,
  ViewInArOutlined,
  ViewModuleOutlined,
  WarningAmberOutlined,
  WaterDropOutlined,
} from '@mui/icons-material';

import { BodyMuted, KpiLabel, PageTitle } from 'components/Typography';

import PortalShell from '../../../components/PortalShell';
import PortalNavActions from '../../../components/PortalNavActions';
import PortalStepper, {
  type PortalStepperPhase,
} from '../../../components/PortalStepper';
import PortalFooterBar from '../../../components/PortalFooterBar';
import OnboardingCard from '../../../components/OnboardingCard';
import LaneStateMap, {
  type LanePreferences,
} from '../../../components/LaneStateMap';
import ScopeBar from '../../../components/ScopeBar';
import DriverChip from '../../../components/DriverChip';
import SectionHead from '../../../components/SectionHead';
import OverrideBadge from '../../../components/OverrideBadge';
import EditingCallout from '../../../components/EditingCallout';
import ScheduleGrid, {
  type WeeklySchedule,
} from '../../../components/ScheduleGrid';
import SchedulePresetGroup, {
  type SchedulePresetOption,
} from '../../../components/SchedulePresetGroup';
import OptCard from '../../../components/OptCard';
import FreightChip, {
  type FreightChipState,
} from '../../../components/FreightChip';

// ---------------------------------------------------------------------------
// Chrome
// ---------------------------------------------------------------------------

const PHASE_LABELS = ['Company', 'Equipment', 'Drivers', 'Costs', 'Preferences', 'Documents'];

const STEPPER_AT_PREFERENCES: PortalStepperPhase[] = PHASE_LABELS.map((label, index) => {
  if (index < 4) return { id: label.toLowerCase(), label, state: 'done' };
  if (index === 4) return { id: label.toLowerCase(), label, state: 'active' };
  return { id: label.toLowerCase(), label, state: 'pending' };
});

const noop = () => undefined;

// ---------------------------------------------------------------------------
// Types + presets
// ---------------------------------------------------------------------------

type SchedulePreset = 'weekdays' | 'weekdays_flex_fri' | 'long_haul' | 'regional_61' | 'custom';

const SCHEDULE_PRESET_OPTIONS: SchedulePresetOption<SchedulePreset>[] = [
  { value: 'weekdays', title: '5 / 2 weekdays', sub: 'Mon–Fri on, weekends off' },
  { value: 'weekdays_flex_fri', title: '5 / 2 + Flex Fri', sub: 'Friday last-minute OK' },
  { value: 'long_haul', title: 'Long-haul OTR', sub: '14 on, 7 off' },
  { value: 'regional_61', title: 'Regional 6 / 1', sub: 'Home Sundays only' },
  { value: 'custom', title: 'Custom', sub: 'Set each day' },
];

const NORTHEAST_PRESET: LanePreferences = {
  ME: 'preferred',
  NY: 'preferred',
  VT: 'preferred',
  NH: 'preferred',
  PA: 'preferred',
  NJ: 'preferred',
  MA: 'preferred',
  RI: 'preferred',
  CT: 'preferred',
  MT: 'avoid',
  WY: 'avoid',
};

const SOUTHEAST_PRESET: LanePreferences = {
  KY: 'preferred',
  WV: 'preferred',
  VA: 'preferred',
  TN: 'preferred',
  NC: 'preferred',
  SC: 'preferred',
  GA: 'preferred',
};

const WEEKDAYS_FLEX_FRI: WeeklySchedule = {
  mon: 'on',
  tue: 'on',
  wed: 'on',
  thu: 'on',
  fri: 'flex',
  sat: 'off',
  sun: 'off',
};

const REGIONAL_61: WeeklySchedule = {
  mon: 'on',
  tue: 'on',
  wed: 'on',
  thu: 'on',
  fri: 'on',
  sat: 'on',
  sun: 'off',
};

// ---------------------------------------------------------------------------
// Freight type catalog
// ---------------------------------------------------------------------------

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

const FLEET_FREIGHT_STATE: Record<FreightTypeId, FreightChipState> = {
  dry_van: 'on',
  reefer: 'on',
  flatbed: 'neutral',
  step_deck: 'neutral',
  power_only: 'neutral',
  containers: 'neutral',
  hazmat: 'avoid',
  oversize: 'avoid',
  auto_haul: 'neutral',
  tanker: 'neutral',
};

const FREIGHT_CYCLE: Record<FreightChipState, FreightChipState> = {
  neutral: 'on',
  on: 'avoid',
  avoid: 'neutral',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LinkButton: React.FC<{
  label: string;
  onClick?: () => void;
  size?: 'sm' | 'md';
  color?: 'primary' | 'muted';
}> = ({ label, onClick, size = 'md', color = 'primary' }) => (
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
      '&:hover': { bgcolor: 'transparent', color: color === 'primary' ? 'primary.dark' : 'text.primary' },
    }}
  >
    {label}
  </Button>
);

interface StateFrameProps {
  label: string;
  children: React.ReactNode;
}

const StateFrame: React.FC<StateFrameProps> = ({ label, children }) => (
  <Box sx={{ mb: 4 }}>
    <KpiLabel sx={{ mb: 1.25, display: 'block' }}>{label}</KpiLabel>
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 1.5,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
      }}
    >
      {children}
    </Box>
  </Box>
);

const SectionWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ mb: 3.5 }}>{children}</Box>
);

// ---------------------------------------------------------------------------
// Scope option metadata
// ---------------------------------------------------------------------------

type ScopeMode = 'fleet' | 'driver';

const SCOPE_OPTIONS = [
  {
    value: 'fleet' as ScopeMode,
    label: 'Fleet default',
    icon: <LocalShipping />,
    count: 'applies to 10',
  },
  {
    value: 'driver' as ScopeMode,
    label: 'Per-driver overrides',
    icon: <PeopleAltOutlined />,
    count: '0 of 10',
  },
];

// ---------------------------------------------------------------------------
// State A — Fleet default
// ---------------------------------------------------------------------------

const StateA: React.FC = () => {
  const [scope, setScope] = useState<ScopeMode>('fleet');
  const [lanes, setLanes] = useState<LanePreferences>(NORTHEAST_PRESET);
  const [schedule, setSchedule] = useState<WeeklySchedule>(WEEKDAYS_FLEX_FRI);
  const [preset, setPreset] = useState<SchedulePreset>('weekdays_flex_fri');
  const [maxMiles, setMaxMiles] = useState<number>(600);
  const [maxDays, setMaxDays] = useState<number>(5);
  const [freight, setFreight] = useState<Record<FreightTypeId, FreightChipState>>(
    FLEET_FREIGHT_STATE,
  );

  const preferredCount = Object.values(lanes).filter((v) => v === 'preferred').length;
  const avoidedCount = Object.values(lanes).filter((v) => v === 'avoid').length;
  const onCount = Object.values(freight).filter((v) => v === 'on').length;
  const avoidFreightCount = Object.values(freight).filter((v) => v === 'avoid').length;

  return (
    <PortalShell
      headerActions={<PortalNavActions onSaveExit={noop} />}
      stepper={<PortalStepper phases={STEPPER_AT_PREFERENCES} />}
      footer={
        <PortalFooterBar
          phaseLabel="Preferences · fleet default"
          metaText="Step 5 of 6 · Applies to 10 drivers"
          onBack={noop}
          onContinue={noop}
        />
      }
    >
      <OnboardingCard
        phase="Preferences · lanes & schedule"
        title="Where do you want to run, and when?"
        subtitle="Set a fleet default that applies to every driver, then override per-driver only when you need to. Dispatch uses this to filter loads before they ever hit your phone."
        width="lg"
      >
        <ScopeBar<ScopeMode> options={SCOPE_OPTIONS} value={scope} onChange={setScope} />

        <SectionWrapper>
          <SectionHead
            number={1}
            title="Lanes"
            rightSlot={`${preferredCount} preferred · ${avoidedCount} avoided`}
          />
          <LaneStateMap value={lanes} onChange={setLanes} />
        </SectionWrapper>

        <SectionWrapper>
          <SectionHead
            number={2}
            title="Weekly schedule"
            rightSlot="5 days on · 2 off · home weekends"
          />
          <ScheduleGrid value={schedule} onChange={setSchedule} />
          <SchedulePresetGroup<SchedulePreset>
            options={SCHEDULE_PRESET_OPTIONS}
            value={preset}
            onChange={setPreset}
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
              amount={maxMiles}
              unit="mi radius"
              options={[
                { value: 250, label: '250' },
                { value: 500, label: '500' },
                { value: 600, label: '600' },
                { value: 1000, label: '1,000' },
                { value: -1, label: 'No limit' },
              ]}
              value={maxMiles}
              onChange={setMaxMiles}
            />
            <OptCard<number>
              label="Max days out per trip"
              amount={maxDays}
              unit="days"
              options={[
                { value: 2, label: '2' },
                { value: 3, label: '3' },
                { value: 5, label: '5' },
                { value: 7, label: '7' },
                { value: 14, label: '14' },
              ]}
              value={maxDays}
              onChange={setMaxDays}
            />
          </Box>
        </SectionWrapper>

        <SectionWrapper>
          <SectionHead
            number={3}
            title="Freight types"
            rightSlot="Tap to include · tap again to avoid"
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {FREIGHT_TYPES.map((type) => (
              <FreightChip
                key={type.id}
                state={freight[type.id]}
                label={type.label}
                icon={type.icon}
                onClick={() =>
                  setFreight((prev) => ({
                    ...prev,
                    [type.id]: FREIGHT_CYCLE[prev[type.id]],
                  }))
                }
              />
            ))}
          </Box>
          <BodyMuted sx={{ fontSize: 12, mt: 1.25 }}>
            {onCount} preferred · {avoidFreightCount} avoided · rest neutral
          </BodyMuted>
        </SectionWrapper>
      </OnboardingCard>
    </PortalShell>
  );
};

// ---------------------------------------------------------------------------
// State B — Per-driver editing Maya
// ---------------------------------------------------------------------------

interface Driver {
  id: string;
  initials: string;
  name: string;
  subLabel: string;
  status: 'default' | 'overridden';
}

const DRIVERS: Driver[] = [
  { id: 'jm', initials: 'JM', name: 'James Miller', subLabel: 'Uses fleet default', status: 'default' },
  { id: 'mc', initials: 'MC', name: 'Maya Carter', subLabel: 'Custom · lanes + schedule', status: 'overridden' },
  { id: 'dr', initials: 'DR', name: 'Daniel Rivera', subLabel: 'Uses fleet default', status: 'default' },
  { id: 'ap', initials: 'AP', name: 'Aisha Patel', subLabel: 'Uses fleet default', status: 'default' },
  { id: 'cr', initials: 'CR', name: 'Carlos Ruiz', subLabel: 'Custom · schedule', status: 'overridden' },
  { id: 'bn', initials: 'BN', name: 'Beth Nguyen', subLabel: 'Uses fleet default', status: 'default' },
  { id: 'th', initials: 'TH', name: 'Tariq Holloway', subLabel: 'Uses fleet default', status: 'default' },
  { id: 'lp', initials: 'LP', name: 'Linda Park', subLabel: 'Custom · freight types', status: 'overridden' },
  { id: 'mch', initials: 'MC', name: 'Marcus Chen', subLabel: 'Uses fleet default', status: 'default' },
  { id: 'os', initials: 'OS', name: 'Olivia Singh', subLabel: 'Uses fleet default', status: 'default' },
];

const SCOPE_OPTIONS_B = [
  {
    value: 'fleet' as ScopeMode,
    label: 'Fleet default',
    icon: <LocalShipping />,
    count: 'applies to 10',
  },
  {
    value: 'driver' as ScopeMode,
    label: 'Per-driver overrides',
    icon: <PeopleAltOutlined />,
    count: '3 of 10',
  },
];

type DriverFilter = 'all' | 'customized';

const DriverBar: React.FC<{
  drivers: Driver[];
  activeId: string;
  onChange: (id: string) => void;
}> = ({ drivers, activeId, onChange }) => {
  const [filter, setFilter] = useState<DriverFilter>('all');
  const customizedCount = drivers.filter((d) => d.status === 'overridden').length;
  const visible = useMemo(
    () => (filter === 'all' ? drivers : drivers.filter((d) => d.status === 'overridden')),
    [filter, drivers],
  );

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
          onChange={(_e, next: DriverFilter | null) => {
            if (next !== null) setFilter(next);
          }}
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

      <Box
        sx={{
          position: 'relative',
          // Edge fade masks so the scrolling content visibly extends past the viewport
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
            // Make the scrollbar subtle but visible
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(15, 23, 42, 0.15)',
              borderRadius: 3,
            },
          }}
        >
          {visible.map((driver) => (
            <DriverChip
              key={driver.id}
              initials={driver.initials}
              name={driver.name}
              subLabel={driver.subLabel}
              status={driver.status}
              active={activeId === driver.id}
              onClick={() => onChange(driver.id)}
            />
          ))}
          {visible.length === 0 ? (
            <BodyMuted sx={{ fontSize: 12, py: 1, px: 1, fontStyle: 'italic' }}>
              No customized drivers yet. Pick one from “All”.
            </BodyMuted>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
};

const StateB: React.FC = () => {
  const [scope, setScope] = useState<ScopeMode>('driver');
  const [activeDriverId, setActiveDriverId] = useState<string>('mc');
  const [lanes, setLanes] = useState<LanePreferences>(SOUTHEAST_PRESET);
  const [schedule, setSchedule] = useState<WeeklySchedule>(REGIONAL_61);
  const [preset, setPreset] = useState<SchedulePreset>('regional_61');
  const [maxMiles, setMaxMiles] = useState<number>(400);
  const [maxDays, setMaxDays] = useState<number>(3);

  // Freight types in State B inherit from fleet — show dimmed, not editable
  const inheritedFreight = FLEET_FREIGHT_STATE;
  const preferredCount = Object.values(lanes).filter((v) => v === 'preferred').length;
  const avoidedCount = Object.values(lanes).filter((v) => v === 'avoid').length;
  const onCount = Object.values(inheritedFreight).filter((v) => v === 'on').length;
  const avoidFreightCount = Object.values(inheritedFreight).filter((v) => v === 'avoid').length;

  return (
    <PortalShell
      headerActions={<PortalNavActions onSaveExit={noop} />}
      stepper={<PortalStepper phases={STEPPER_AT_PREFERENCES} />}
      footer={
        <PortalFooterBar
          phaseLabel="Preferences · Maya Carter"
          metaText="Step 5 of 6 · 2 of 3 sections overridden · 3 of 10 drivers customized"
          onBack={noop}
          onContinue={noop}
          secondaryAction={{
            label: "Apply Maya's settings to all",
            onClick: noop,
          }}
        />
      }
    >
      <OnboardingCard
        phase="Preferences · per-driver override"
        title="Tune preferences per driver."
        subtitle="Each driver starts on the fleet default. Open one to override only what's different — their other settings stay synced to the fleet."
        width="lg"
      >
        <ScopeBar<ScopeMode> options={SCOPE_OPTIONS_B} value={scope} onChange={setScope} />

        <DriverBar
          drivers={DRIVERS}
          activeId={activeDriverId}
          onChange={setActiveDriverId}
        />

        <EditingCallout
          message={
            <>
              You&apos;re editing <strong>Maya Carter&apos;s</strong> preferences. Only what you
              change here overrides the fleet default.
            </>
          }
          actions={
            <>
              <LinkButton label="Copy from fleet" size="sm" onClick={noop} />
              <LinkButton label="Reset to default" size="sm" onClick={noop} />
            </>
          }
        />

        <SectionWrapper>
          <SectionHead
            number={1}
            title="Lanes"
            titleSuffix={<OverrideBadge />}
            rightSlot={
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                <span>
                  {preferredCount} preferred (SE region) · {avoidedCount} avoided
                </span>
                <LinkButton label="reset" size="sm" color="muted" onClick={noop} />
              </Box>
            }
          />
          <LaneStateMap value={lanes} onChange={setLanes} />
          <BodyMuted sx={{ fontSize: 12, mt: 1, fontStyle: 'italic' }}>
            Maya lives in NC — she wants to stay close.
          </BodyMuted>
        </SectionWrapper>

        <SectionWrapper>
          <SectionHead
            number={2}
            title="Weekly schedule"
            titleSuffix={<OverrideBadge />}
            rightSlot={
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                <span>Regional 6/1 · home Sundays</span>
                <LinkButton label="reset" size="sm" color="muted" onClick={noop} />
              </Box>
            }
          />
          <ScheduleGrid value={schedule} onChange={setSchedule} offLabel="Home" />
          <SchedulePresetGroup<SchedulePreset>
            options={SCHEDULE_PRESET_OPTIONS}
            value={preset}
            onChange={setPreset}
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
              amount={maxMiles}
              unit="mi radius"
              options={[
                { value: 250, label: '250' },
                { value: 400, label: '400' },
                { value: 600, label: '600' },
                { value: 1000, label: '1,000' },
                { value: -1, label: 'No limit' },
              ]}
              value={maxMiles}
              onChange={setMaxMiles}
            />
            <OptCard<number>
              label="Max days out per trip"
              amount={maxDays}
              unit="days"
              options={[
                { value: 2, label: '2' },
                { value: 3, label: '3' },
                { value: 5, label: '5' },
                { value: 7, label: '7' },
                { value: 14, label: '14' },
              ]}
              value={maxDays}
              onChange={setMaxDays}
            />
          </Box>
        </SectionWrapper>

        <SectionWrapper>
          <SectionHead
            number={3}
            title="Freight types"
            titleSuffix={
              <Box
                component="span"
                sx={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'text.secondary',
                  ml: 1,
                }}
              >
                · inherits from fleet
              </Box>
            }
            rightSlot="Dry van + Reefer · avoiding Hazmat & Oversize"
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, opacity: 0.65 }}>
            {FREIGHT_TYPES.map((type) => (
              <FreightChip
                key={type.id}
                state={inheritedFreight[type.id]}
                label={type.label}
                icon={<ViewInArOutlined />}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.25 }}>
            <LinkButton label="Override for Maya" size="sm" onClick={noop} />
            <BodyMuted sx={{ fontSize: 12 }}>
              to set different freight types just for her.
            </BodyMuted>
          </Box>
          <BodyMuted sx={{ fontSize: 11.5, mt: 0.5 }}>
            {onCount} preferred · {avoidFreightCount} avoided (fleet-level)
          </BodyMuted>
        </SectionWrapper>
      </OnboardingCard>
    </PortalShell>
  );
};

// ---------------------------------------------------------------------------
// Preview index
// ---------------------------------------------------------------------------

const LanePreferencesPreview: React.FC = () => (
  <Box sx={{ maxWidth: 1280, mx: 'auto', p: { xs: 2, md: 4 }, bgcolor: 'grey.200' }}>
    <Box sx={{ mb: 4 }}>
      <KpiLabel>Carrier portal · Preferences phase</KpiLabel>
      <PageTitle sx={{ mb: 1 }}>lane-preferences</PageTitle>
      <BodyMuted sx={{ fontSize: 13 }}>
        Source: <code>docs/screenshots/mockups/onboarding/lane-preferences.html</code>. Two scopes
        (Fleet default / Per-driver) — three sections per scope: lanes, schedule, freight types.
        Override badges + reset links surface the inheritance model. Scaled to 10 drivers with
        an All / Customized-only filter. Colorblind-safe: state cells and chips carry shape
        glyphs (✓ / ✕ / ⊘) and strikethrough alongside color.
      </BodyMuted>
    </Box>

    <StateFrame label="State A · fleet default · 10 drivers inherit · NE preferred + MT/WY avoided + Mon–Fri">
      <StateA />
    </StateFrame>

    <StateFrame label="State B · per-driver · 10-driver bar (3 customized) with All/Customized filter; editing Maya">
      <StateB />
    </StateFrame>
  </Box>
);

export default LanePreferencesPreview;
