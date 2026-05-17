import { useMemo, useState, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { Box, ButtonBase } from '@mui/material';
import {
  AccountBalanceWalletOutlined,
  CalculateOutlined,
  EventNoteOutlined,
  LocalShipping,
  RvHookup,
  ScheduleOutlined,
  ShowChartOutlined,
  TimelineOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';

import { Body, BodyMuted, BodyStrong, KpiLabel, PageTitle } from 'components/Typography';

import PortalShell from '../../../components/PortalShell';
import PortalNavActions from '../../../components/PortalNavActions';
import PortalStepper, {
  type PortalStepperPhase,
} from '../../../components/PortalStepper';
import PortalFooterBar from '../../../components/PortalFooterBar';
import OnboardingCard from '../../../components/OnboardingCard';
import SelectionCardGrid, {
  type SelectionCardOption,
} from '../../../components/SelectionCardGrid';
import LedgerSection from '../../../components/LedgerSection';
import LedgerGroup from '../../../components/LedgerGroup';
import ExpenseRow from '../../../components/ExpenseRow';
import EditableExpenseRow from '../../../components/EditableExpenseRow';
import AssetPaymentRow, {
  type AssetPaymentOwnership,
} from '../../../components/AssetPaymentRow';
import LedgerAddRow from '../../../components/LedgerAddRow';
import ComputedLine from '../../../components/ComputedLine';
import RateCard from '../../../components/RateCard';

// ---------------------------------------------------------------------------
// Stepper + chrome
// ---------------------------------------------------------------------------

const PHASE_LABELS = ['Company', 'Equipment', 'Drivers', 'Costs', 'Preferences', 'Documents'];

const STEPPER_AT_COSTS: PortalStepperPhase[] = PHASE_LABELS.map((label, index) => {
  if (index < 3) return { id: label.toLowerCase(), label, state: 'done' };
  if (index === 3) return { id: label.toLowerCase(), label, state: 'active' };
  return { id: label.toLowerCase(), label, state: 'pending' };
});

const noop = () => undefined;

// ---------------------------------------------------------------------------
// Types + helpers
// ---------------------------------------------------------------------------

type CostMode = 'run' | 'later';
type PayBasis = 'gross' | 'net';

interface NamedAmount {
  id: string;
  name: string;
  amount: string;
}

interface CalculatorValues {
  truck1: string;
  truck1Ownership: AssetPaymentOwnership;
  truck2: string;
  truck2Ownership: AssetPaymentOwnership;
  trailer1: string;
  trailer1Ownership: AssetPaymentOwnership;
  policies: NamedAmount[];
  subscriptions: NamedAmount[];
  perTruckWeekly: string;
  payBasis: PayBasis;
  office: string;
  accounting: string;
  bankFees: string;
  dieselPrice: string;
  mpg: string;
  maintenance: string;
  tires: string;
  def: string;
  tolls: string;
  loadedMiles: string;
  deadheadPct: string;
  marginPct: string;
}

const EMPTY_VALUES: CalculatorValues = {
  truck1: '',
  truck1Ownership: 'financed',
  truck2: '',
  truck2Ownership: 'financed',
  trailer1: '',
  trailer1Ownership: 'financed',
  policies: [],
  subscriptions: [],
  perTruckWeekly: '',
  payBasis: 'net',
  office: '',
  accounting: '',
  bankFees: '',
  dieselPrice: '',
  mpg: '',
  maintenance: '',
  tires: '',
  def: '',
  tolls: '',
  loadedMiles: '',
  deadheadPct: '',
  marginPct: '',
};

const SAMPLE_VALUES: CalculatorValues = {
  truck1: '1,750',
  truck1Ownership: 'financed',
  truck2: '1,500',
  truck2Ownership: 'financed',
  trailer1: '420',
  trailer1Ownership: 'financed',
  policies: [
    { id: 'pol-1', name: 'Auto liability + cargo', amount: '1,200' },
    { id: 'pol-2', name: 'Occupational accident / health', amount: '180' },
    { id: 'pol-3', name: 'IRP / IFTA / UCR & permits', amount: '195' },
  ],
  subscriptions: [
    { id: 'sub-1', name: 'ELD & compliance', amount: '45' },
    { id: 'sub-2', name: 'Business phone & internet', amount: '90' },
  ],
  perTruckWeekly: '1,500',
  payBasis: 'net',
  office: '150',
  accounting: '150',
  bankFees: '85',
  dieselPrice: '3.75',
  mpg: '6.0',
  maintenance: '0.12',
  tires: '0.04',
  def: '0.02',
  tolls: '0.05',
  loadedMiles: '8,000',
  deadheadPct: '12',
  marginPct: '15',
};

const TRUCK_COUNT = 2;
const WEEKS_PER_MONTH = 52 / 12;

const parseMoney = (value: string): number => {
  const cleaned = String(value).replace(/[^\d.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (amount: number, fractionDigits = 0): string =>
  amount.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

const generateId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

// ---------------------------------------------------------------------------
// PillToggle (inline — generic 2-way pill, reused for gross/net + ownership)
// ---------------------------------------------------------------------------

interface PillToggleOption<T extends string> {
  value: T;
  label: string;
}

interface PillToggleProps<T extends string> {
  options: PillToggleOption<T>[];
  value: T;
  onChange: (next: T) => void;
}

const PillToggle = <T extends string>({ options, value, onChange }: PillToggleProps<T>) => (
  <Box
    role="radiogroup"
    sx={{
      display: 'inline-flex',
      border: '1.5px solid',
      borderColor: 'grey.200',
      borderRadius: '999px',
      overflow: 'hidden',
      bgcolor: 'background.paper',
      flexShrink: 0,
    }}
  >
    {options.map((option, idx) => {
      const isOn = value === option.value;
      return (
        <ButtonBase
          key={option.value}
          role="radio"
          aria-checked={isOn}
          onClick={() => onChange(option.value)}
          sx={{
            px: 1.5,
            py: 0.5,
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 600,
            color: isOn ? 'common.white' : 'text.secondary',
            bgcolor: isOn ? 'primary.main' : 'transparent',
            borderLeft: idx > 0 ? '1.5px solid' : 'none',
            borderColor: 'grey.200',
            transition: 'all 0.15s ease',
          }}
        >
          {option.label}
        </ButtonBase>
      );
    })}
  </Box>
);

// ---------------------------------------------------------------------------
// VehicleThumb
// ---------------------------------------------------------------------------

const VehicleThumb: React.FC<{ variant: 'truck' | 'trailer' }> = ({ variant }) => {
  const tokens =
    variant === 'trailer'
      ? { bg: 'rgba(254, 243, 199, 1)', color: 'rgba(120, 53, 15, 1)', icon: <RvHookup /> }
      : { bg: 'rgba(238, 242, 255, 1)', color: 'rgba(55, 48, 163, 1)', icon: <LocalShipping /> };
  return (
    <Box
      sx={{
        width: 28,
        height: 28,
        borderRadius: 0.75,
        bgcolor: tokens.bg,
        color: tokens.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        '& svg': { fontSize: 16 },
      }}
    >
      {tokens.icon}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Calculator (shared between empty + filled states)
// ---------------------------------------------------------------------------

const MODE_OPTIONS: SelectionCardOption<CostMode>[] = [
  {
    id: 'run',
    icon: <CalculateOutlined />,
    title: 'Run the calculator now',
    subline:
      'A single sheet for the whole operation. Most fields take 10 seconds — we pre-fill what we can.',
    footnote: 'Recommended · ~5 min',
  },
  {
    id: 'later',
    icon: <EventNoteOutlined />,
    title: "I'll do this later",
    subline:
      'Skip for now. Your dispatcher will schedule a 15-minute cost review with you after activation.',
    footnote: 'Default rate applies meanwhile',
  },
];

const Calculator: React.FC<{ initialValues: CalculatorValues; emptyMode: boolean }> = ({
  initialValues,
  emptyMode,
}) => {
  const [values, setValues] = useState<CalculatorValues>(initialValues);

  const setField = useCallback(
    <K extends keyof CalculatorValues>(key: K) =>
      (event: ChangeEvent<HTMLInputElement>) => {
        const next = event.target.value as CalculatorValues[K];
        setValues((prev) => ({ ...prev, [key]: next }));
      },
    [],
  );

  const setValue = useCallback(<K extends keyof CalculatorValues>(key: K, next: CalculatorValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: next }));
  }, []);

  const updateListItem = useCallback(
    (listKey: 'policies' | 'subscriptions', id: string, patch: Partial<NamedAmount>) => {
      setValues((prev) => ({
        ...prev,
        [listKey]: prev[listKey].map((item) => (item.id === id ? { ...item, ...patch } : item)),
      }));
    },
    [],
  );

  const removeListItem = useCallback((listKey: 'policies' | 'subscriptions', id: string) => {
    setValues((prev) => ({
      ...prev,
      [listKey]: prev[listKey].filter((item) => item.id !== id),
    }));
  }, []);

  const addListItem = useCallback((listKey: 'policies' | 'subscriptions') => {
    setValues((prev) => ({
      ...prev,
      [listKey]: [...prev[listKey], { id: generateId(listKey), name: '', amount: '' }],
    }));
  }, []);

  const equipmentTotal = useMemo(() => {
    const truck1 = values.truck1Ownership === 'owned' ? 0 : parseMoney(values.truck1);
    const truck2 = values.truck2Ownership === 'owned' ? 0 : parseMoney(values.truck2);
    const trailer1 = values.trailer1Ownership === 'owned' ? 0 : parseMoney(values.trailer1);
    return truck1 + truck2 + trailer1;
  }, [
    values.truck1,
    values.truck1Ownership,
    values.truck2,
    values.truck2Ownership,
    values.trailer1,
    values.trailer1Ownership,
  ]);

  const policiesTotal = useMemo(
    () => values.policies.reduce((sum, p) => sum + parseMoney(p.amount), 0),
    [values.policies],
  );

  const subscriptionsTotal = useMemo(
    () => values.subscriptions.reduce((sum, s) => sum + parseMoney(s.amount), 0),
    [values.subscriptions],
  );

  const overheadTotal = useMemo(
    () => parseMoney(values.office) + parseMoney(values.accounting) + parseMoney(values.bankFees),
    [values.office, values.accounting, values.bankFees],
  );

  const ownerPayMonthly = useMemo(() => {
    const perTruckWeekly = parseMoney(values.perTruckWeekly);
    return perTruckWeekly * TRUCK_COUNT * WEEKS_PER_MONTH;
  }, [values.perTruckWeekly]);

  const fixedTotal =
    equipmentTotal + policiesTotal + subscriptionsTotal + overheadTotal + ownerPayMonthly;

  const fuelCostPerMile = useMemo(() => {
    const diesel = parseMoney(values.dieselPrice);
    const mpg = parseMoney(values.mpg);
    return mpg > 0 ? diesel / mpg : 0;
  }, [values.dieselPrice, values.mpg]);

  const variablePerMile = useMemo(
    () =>
      fuelCostPerMile +
      parseMoney(values.maintenance) +
      parseMoney(values.tires) +
      parseMoney(values.def) +
      parseMoney(values.tolls),
    [fuelCostPerMile, values.maintenance, values.tires, values.def, values.tolls],
  );

  const loadedMiles = parseMoney(values.loadedMiles);
  const deadheadPct = parseMoney(values.deadheadPct);
  const marginPct = parseMoney(values.marginPct);

  const loadedAdjusted = loadedMiles * (1 - deadheadPct / 100);
  const fixedPerLoadedMile = loadedAdjusted > 0 ? fixedTotal / loadedAdjusted : 0;
  const deadheadAdj = variablePerMile * (deadheadPct / 100);
  const breakEven = fixedPerLoadedMile + variablePerMile + deadheadAdj;
  const margin = breakEven * (marginPct / 100);
  const minRate = breakEven + margin;
  const annualizedMi = loadedMiles * 12;

  const hasAnyData =
    fixedTotal > 0 || variablePerMile > 0 || loadedMiles > 0;
  const rateCardEmpty = !hasAnyData;

  const payBasisLabel = values.payBasis === 'net' ? 'take-home' : 'gross';
  const ownerPayHelper = `× ${TRUCK_COUNT} trucks × ${WEEKS_PER_MONTH.toFixed(2)} wk/mo = $${formatMoney(ownerPayMonthly)} / mo ${payBasisLabel}`;

  const footerMetaText = emptyMode
    ? 'Step 4 of 6 · fill in your fleet P&L to see your rate'
    : `Step 4 of 6 · Fleet P&L · $${formatMoney(fixedTotal)} fixed + $${variablePerMile.toFixed(2)}/mi variable`;

  return (
    <PortalShell
      headerActions={<PortalNavActions onSaveExit={noop} />}
      stepper={<PortalStepper phases={STEPPER_AT_COSTS} />}
      footer={
        <PortalFooterBar
          phaseLabel="Costs"
          metaText={footerMetaText}
          onBack={noop}
          onContinue={noop}
          continueDisabled={emptyMode}
          secondaryAction={{
            label: 'Skip — do this with my dispatcher',
            onClick: noop,
          }}
        />
      }
    >
      <OnboardingCard
        phase="Costs · break-even calculator"
        title="Your fleet's monthly P&L."
        subtitle="One sheet for the whole operation. Most owner-ops treat trucking as a single business — so do we. Equipment payments are the only line that splits per asset."
        width="lg"
      >
        {/* Fixed costs */}
        <LedgerSection
          icon={<AccountBalanceWalletOutlined />}
          iconVariant="indigo"
          title="Fixed costs · monthly"
          subtitle="Costs you pay whether the truck rolls or not."
          totalLabel="Subtotal"
          totalValue={`$${formatMoney(fixedTotal)} / mo`}
        >
          <LedgerGroup
            label="Equipment payments"
            subTotal={`$${formatMoney(equipmentTotal)} / mo`}
          >
            <AssetPaymentRow
              name="truck1"
              thumbnail={<VehicleThumb variant="truck" />}
              assetName="2022 Freightliner Cascadia"
              tagLabel="Truck"
              tagVariant="truck"
              ownership={values.truck1Ownership}
              onOwnershipChange={(next) => setValue('truck1Ownership', next)}
              amount={values.truck1}
              onAmountChange={setField('truck1')}
            />
            <AssetPaymentRow
              name="truck2"
              thumbnail={<VehicleThumb variant="truck" />}
              assetName="2019 Kenworth T680"
              tagLabel="Truck"
              tagVariant="truck"
              ownership={values.truck2Ownership}
              onOwnershipChange={(next) => setValue('truck2Ownership', next)}
              amount={values.truck2}
              onAmountChange={setField('truck2')}
            />
            <AssetPaymentRow
              name="trailer1"
              thumbnail={<VehicleThumb variant="trailer" />}
              assetName="53' Dry Van"
              tagLabel="Trailer"
              tagVariant="trailer"
              ownership={values.trailer1Ownership}
              onOwnershipChange={(next) => setValue('trailer1Ownership', next)}
              amount={values.trailer1}
              onAmountChange={setField('trailer1')}
            />
            <LedgerAddRow label="Add another truck or trailer" onClick={noop} />
          </LedgerGroup>

          <LedgerGroup
            label="Insurance & permits"
            subTotal={`$${formatMoney(policiesTotal)} / mo`}
          >
            {values.policies.length === 0 ? (
              <BodyMuted sx={{ fontSize: 12.5, py: 1, fontStyle: 'italic' }}>
                No policies added yet. Add your auto liability, cargo, occupational, IRP/IFTA
                permits — one row per policy.
              </BodyMuted>
            ) : (
              values.policies.map((policy) => (
                <EditableExpenseRow
                  key={policy.id}
                  name={policy.id}
                  nameValue={policy.name}
                  onNameChange={(next) => updateListItem('policies', policy.id, { name: next })}
                  namePlaceholder="Policy name (e.g., Auto liability + cargo)"
                  prefix="$"
                  suffix="/mo"
                  amount={policy.amount}
                  amountPlaceholder="0"
                  onAmountChange={(event) =>
                    updateListItem('policies', policy.id, { amount: event.target.value })
                  }
                  onRemove={() => removeListItem('policies', policy.id)}
                />
              ))
            )}
            <LedgerAddRow label="Add a policy" onClick={() => addListItem('policies')} />
          </LedgerGroup>

          <LedgerGroup
            label="Tech & subscriptions"
            subTotal={`$${formatMoney(subscriptionsTotal)} / mo`}
          >
            <ExpenseRow
              name="dispatchSoftware"
              label="Dispatch / TMS software"
              source={{ label: 'included', variant: 'green' }}
              prefix="$"
              suffix="/mo"
              value="0"
              readOnly
            />
            {values.subscriptions.length === 0 ? (
              <BodyMuted sx={{ fontSize: 12.5, py: 1, fontStyle: 'italic' }}>
                No subscriptions added yet. Add ELD, phone, ops software — one row per
                subscription.
              </BodyMuted>
            ) : (
              values.subscriptions.map((sub) => (
                <EditableExpenseRow
                  key={sub.id}
                  name={sub.id}
                  nameValue={sub.name}
                  onNameChange={(next) => updateListItem('subscriptions', sub.id, { name: next })}
                  namePlaceholder="Subscription name (e.g., ELD & compliance)"
                  prefix="$"
                  suffix="/mo"
                  amount={sub.amount}
                  amountPlaceholder="0"
                  onAmountChange={(event) =>
                    updateListItem('subscriptions', sub.id, { amount: event.target.value })
                  }
                  onRemove={() => removeListItem('subscriptions', sub.id)}
                />
              ))
            )}
            <LedgerAddRow
              label="Add a subscription"
              onClick={() => addListItem('subscriptions')}
            />
          </LedgerGroup>

          <LedgerGroup label="Overhead & admin" subTotal={`$${formatMoney(overheadTotal)} / mo`}>
            <ExpenseRow
              name="office"
              label="Office, parking, utilities"
              prefix="$"
              suffix="/mo"
              value={values.office}
              onChange={setField('office')}
              placeholder="0"
            />
            <ExpenseRow
              name="accounting"
              label="Accounting & legal"
              prefix="$"
              suffix="/mo"
              value={values.accounting}
              onChange={setField('accounting')}
              placeholder="0"
            />
            <ExpenseRow
              name="bankFees"
              label="Bank fees, cards, factoring"
              prefix="$"
              suffix="/mo"
              value={values.bankFees}
              onChange={setField('bankFees')}
              placeholder="0"
            />
            <LedgerAddRow label="Add a custom fixed expense" onClick={noop} />
          </LedgerGroup>

          <LedgerGroup
            label="Owner / driver pay"
            labelSuffix={
              <Body sx={{ fontSize: 11, fontWeight: 500, color: 'text.secondary' }}>
                · target income per truck
              </Body>
            }
            subTotal={`$${formatMoney(ownerPayMonthly)} / mo`}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 200px' },
                alignItems: 'center',
                gap: 1.5,
                py: 0.875,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.75,
                  alignItems: 'flex-start',
                }}
              >
                <Body sx={{ fontSize: 13.5, fontWeight: 500 }}>
                  Target income per truck per week
                </Body>
                <PillToggle<PayBasis>
                  options={[
                    { value: 'gross', label: 'Gross' },
                    { value: 'net', label: 'Net (take-home)' },
                  ]}
                  value={values.payBasis}
                  onChange={(next) => setValue('payBasis', next)}
                />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'stretch',
                  border: '1.5px solid',
                  borderColor: values.perTruckWeekly ? 'grey.300' : 'grey.200',
                  borderRadius: 0.75,
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                  transition: 'all 0.15s ease',
                  '&:focus-within': {
                    borderColor: 'primary.main',
                    boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.10)',
                  },
                }}
              >
                <Box
                  sx={{
                    px: 1.25,
                    bgcolor: 'grey.50',
                    color: 'text.secondary',
                    fontWeight: 700,
                    fontSize: 12.5,
                    display: 'flex',
                    alignItems: 'center',
                    borderRight: '1px solid',
                    borderColor: 'grey.200',
                  }}
                >
                  $
                </Box>
                <Box
                  component="input"
                  id="perTruckWeekly"
                  name="perTruckWeekly"
                  value={values.perTruckWeekly}
                  onChange={setField('perTruckWeekly')}
                  placeholder="0"
                  sx={{
                    flex: 1,
                    border: 0,
                    outline: 0,
                    px: 1.25,
                    py: 1,
                    fontFamily: 'inherit',
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'text.primary',
                    bgcolor: 'transparent',
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                />
                <Box
                  sx={{
                    px: 1.25,
                    bgcolor: 'grey.50',
                    color: 'text.secondary',
                    fontWeight: 700,
                    fontSize: 12.5,
                    display: 'flex',
                    alignItems: 'center',
                    borderLeft: '1px solid',
                    borderColor: 'grey.200',
                  }}
                >
                  /wk
                </Box>
              </Box>
            </Box>
            <ComputedLine label="Monthly target · computed" value={ownerPayHelper} />
          </LedgerGroup>
        </LedgerSection>

        {/* Variable costs */}
        <LedgerSection
          icon={<TrendingUpOutlined />}
          iconVariant="amber"
          title="Variable costs · per mile"
          subtitle="Costs that scale with how far you run."
          totalLabel="Subtotal"
          totalValue={`$${variablePerMile.toFixed(2)} / mi`}
        >
          <LedgerGroup label="Fuel">
            <ExpenseRow
              name="dieselPrice"
              label="Diesel price"
              helper="at the pump"
              prefix="$"
              suffix="/gal"
              value={values.dieselPrice}
              onChange={setField('dieselPrice')}
              placeholder="0.00"
            />
            <ExpenseRow
              name="mpg"
              label="Fleet avg fuel economy"
              suffix="MPG"
              value={values.mpg}
              onChange={setField('mpg')}
              placeholder="0.0"
            />
            <ComputedLine
              icon={<ShowChartOutlined />}
              label="Fuel cost · computed"
              value={`$${fuelCostPerMile.toFixed(3)} / mi`}
            />
          </LedgerGroup>

          <LedgerGroup label="Wear & ops">
            <ExpenseRow
              name="maintenance"
              label="Maintenance reserve"
              helper="repairs, fluids"
              prefix="$"
              suffix="/mi"
              value={values.maintenance}
              onChange={setField('maintenance')}
              placeholder="0.00"
            />
            <ExpenseRow
              name="tires"
              label="Tires reserve"
              prefix="$"
              suffix="/mi"
              value={values.tires}
              onChange={setField('tires')}
              placeholder="0.00"
            />
            <ExpenseRow
              name="def"
              label="DEF / additives"
              prefix="$"
              suffix="/mi"
              value={values.def}
              onChange={setField('def')}
              placeholder="0.00"
            />
            <ExpenseRow
              name="tolls"
              label="Tolls (avg)"
              prefix="$"
              suffix="/mi"
              value={values.tolls}
              onChange={setField('tolls')}
              placeholder="0.00"
            />
            <LedgerAddRow label="Add a custom per-mile expense" onClick={noop} />
          </LedgerGroup>
        </LedgerSection>

        {/* Operating assumptions */}
        <LedgerSection
          icon={<TimelineOutlined />}
          iconVariant="emerald"
          title="Operating assumptions"
          subtitle="How we turn fixed costs into per-mile."
          totalLabel="Annualized"
          totalValue={`${formatMoney(annualizedMi)} mi / yr`}
        >
          <LedgerGroup label="Mileage & margin">
            <ExpenseRow
              name="loadedMiles"
              label="Loaded miles per month"
              helper="across the fleet"
              suffix="mi"
              value={values.loadedMiles}
              onChange={setField('loadedMiles')}
              placeholder="0"
            />
            <ExpenseRow
              name="deadheadPct"
              label="Deadhead percentage"
              suffix="%"
              value={values.deadheadPct}
              onChange={setField('deadheadPct')}
              placeholder="0"
            />
            <ExpenseRow
              name="marginPct"
              label="Target profit margin"
              helper="on top of break-even"
              suffix="%"
              value={values.marginPct}
              onChange={setField('marginPct')}
              placeholder="0"
            />
          </LedgerGroup>
        </LedgerSection>

        <RateCard
          eyebrow="Your minimum book rate"
          amount={rateCardEmpty ? '—' : `$${minRate.toFixed(2)}`}
          unit="/loaded mi"
          emptyState={rateCardEmpty}
          secondary={{
            eyebrow: 'Cost per mile',
            amount: rateCardEmpty ? '—' : `$${breakEven.toFixed(2)}`,
            unit: '/loaded mi · break-even',
          }}
          explain={
            rateCardEmpty
              ? 'Fill in your fleet P&L and operating assumptions to see your break-even cost and minimum book rate.'
              : `Fixed $${formatMoney(fixedTotal)}/mo ÷ ${formatMoney(loadedAdjusted)} loaded mi + variable $${variablePerMile.toFixed(2)}/mi + ${marginPct.toFixed(0)}% margin.`
          }
          breakdown={
            rateCardEmpty
              ? undefined
              : [
                  { label: 'Fixed / loaded mi', value: `$${fixedPerLoadedMile.toFixed(2)}` },
                  { label: 'Variable / mi', value: `$${variablePerMile.toFixed(2)}` },
                  {
                    label: `Deadhead adj (${deadheadPct.toFixed(0)}%)`,
                    value: `$${deadheadAdj.toFixed(2)}`,
                  },
                  { label: 'Break-even', value: `$${breakEven.toFixed(2)}` },
                  { label: `Margin ${marginPct.toFixed(0)}%`, value: `$${margin.toFixed(2)}` },
                  { label: 'Min rate / mile', value: `$${minRate.toFixed(2)}`, isTotal: true },
                ]
          }
        />
      </OnboardingCard>
    </PortalShell>
  );
};

// ---------------------------------------------------------------------------
// State A — Mode chooser
// ---------------------------------------------------------------------------

const StateA: React.FC = () => {
  const [mode, setMode] = useState<CostMode>('run');
  return (
    <PortalShell
      headerActions={<PortalNavActions onSaveExit={noop} />}
      stepper={<PortalStepper phases={STEPPER_AT_COSTS} />}
      footer={
        <PortalFooterBar
          phaseLabel="Costs"
          metaText="Step 4 of 6 · pick your path"
          onBack={noop}
          onContinue={noop}
          continueLabel={mode === 'run' ? 'Start the calculator' : 'Continue without rate'}
        />
      }
    >
      <OnboardingCard
        phase="Costs · break-even calculator"
        title="Know what every mile costs you."
        subtitle="We'll run a single fleet-wide P&L — fixed costs (monthly), variable costs (per mile), and your operating mileage — then turn it into your minimum book rate. Or skip and let your dispatcher walk you through it after activation."
        width="lg"
      >
        <SelectionCardGrid<CostMode>
          options={MODE_OPTIONS}
          value={mode}
          onChange={setMode}
          columns={2}
          size="md"
          showRadio={false}
        />
        <BodyMuted
          sx={{ fontSize: 12.5, mt: 1.5, textAlign: 'center', fontStyle: 'italic' }}
        >
          You can always re-open the calculator from Dashboard → Costs.
        </BodyMuted>
      </OnboardingCard>
    </PortalShell>
  );
};

// ---------------------------------------------------------------------------
// State C — Skipped
// ---------------------------------------------------------------------------

const SkipConfirmBlock: React.FC = () => (
  <Box
    sx={{
      mt: 0.5,
      px: 3,
      py: 3.5,
      bgcolor: 'rgba(254, 243, 199, 1)',
      border: '1px solid',
      borderColor: 'rgba(253, 230, 138, 1)',
      borderLeft: '3px solid',
      borderLeftColor: 'rgba(217, 119, 6, 1)',
      borderRadius: 0.75,
      display: 'flex',
      alignItems: 'center',
      gap: 2.5,
    }}
  >
    <Box
      sx={{
        width: 52,
        height: 52,
        borderRadius: '50%',
        bgcolor: 'rgba(217, 119, 6, 1)',
        color: 'common.white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        '& svg': { fontSize: 28 },
      }}
    >
      <ScheduleOutlined />
    </Box>
    <Box sx={{ color: 'rgba(120, 53, 15, 1)', lineHeight: 1.55 }}>
      <BodyStrong
        sx={{ fontSize: 16, fontWeight: 700, color: 'rgba(66, 32, 6, 1)', mb: 0.5 }}
      >
        Your dispatcher will schedule a 15-minute cost review.
      </BodyStrong>
      <Body sx={{ fontSize: 14, color: 'rgba(120, 53, 15, 1)' }}>
        Until then, dispatch will book against the regional default rate ($2.10/mi for your
        equipment class). You can run the calculator any time from Dashboard → Costs.
      </Body>
    </Box>
  </Box>
);

const StateC: React.FC = () => (
  <PortalShell
    headerActions={<PortalNavActions onSaveExit={noop} />}
    stepper={<PortalStepper phases={STEPPER_AT_COSTS} />}
    footer={
      <PortalFooterBar
        phaseLabel="Costs · skipped"
        metaText="Default rate $2.10/mi applies until reviewed"
        onBack={noop}
        onContinue={noop}
        continueLabel="Continue without rate"
        secondaryAction={{
          label: 'Actually, let me run it now',
          onClick: noop,
        }}
      />
    }
  >
    <OnboardingCard
      phase="Costs · skipped"
      title="No problem — we'll handle this together."
      subtitle="You've chosen to skip cost analysis for now."
      width="lg"
    >
      <SkipConfirmBlock />
    </OnboardingCard>
  </PortalShell>
);

// ---------------------------------------------------------------------------
// Preview index
// ---------------------------------------------------------------------------

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

const CostAnalysisPreview: React.FC = () => {
  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', p: { xs: 2, md: 4 }, bgcolor: 'grey.200' }}>
      <Box sx={{ mb: 4 }}>
        <KpiLabel>Carrier portal · Costs phase</KpiLabel>
        <PageTitle sx={{ mb: 1 }}>cost-analysis</PageTitle>
        <BodyMuted sx={{ fontSize: 13 }}>
          Source: <code>docs/screenshots/mockups/onboarding/cost-analysis.html</code>, with empty
          state + multi-insurance + multi-subscription + per-truck weekly income target +
          cost-per-mile beside min-book-rate.
        </BodyMuted>
      </Box>

      <StateFrame label="State A · mode chooser · pick run-now or do-later">
        <StateA />
      </StateFrame>

      <StateFrame label="State B · calculator (empty) · just-arrived view, Continue disabled">
        <Calculator initialValues={EMPTY_VALUES} emptyMode />
      </StateFrame>

      <StateFrame label="State C · calculator (filled) · sample values, live CPM + min book rate">
        <Calculator initialValues={SAMPLE_VALUES} emptyMode={false} />
      </StateFrame>

      <StateFrame label="State D · skipped · default rate applies until dispatcher review">
        <StateC />
      </StateFrame>
    </Box>
  );
};

export default CostAnalysisPreview;
