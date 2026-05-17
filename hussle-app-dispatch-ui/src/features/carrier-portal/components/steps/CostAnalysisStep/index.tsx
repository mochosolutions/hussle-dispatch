// ---------------------------------------------------------------------------
// CostAnalysisStep — dedicated renderer for the `cost-analysis` engine step.
//
// US-21 AC-18 UI side:
//   - Three `LedgerSection`s (fixed monthly, variable per-mile, operating).
//   - Per-asset `AssetPaymentRow` keyed by `Vehicle.id` read from the upstream
//     equipment-entry answers.
//   - Dynamic policies + subscriptions via `EditableExpenseRow`.
//   - Live `RateCard` shows cost-per-mile + break-even/min-book-rate using the
//     pure `computeDerivedValues` helper (same math as the API service).
//   - Empty-state (no vehicles persisted) → RateCard renders empty, Continue
//     button is disabled, payload cannot be assembled.
//   - Submit dispatches `saveCostAnalysis` with the transactional payload shape
//     the API validator expects (vehicleId-keyed equipmentPayments[]).
// ---------------------------------------------------------------------------

import { useMemo } from 'react';
import type { ChangeEvent } from 'react';
import { Box, Stack } from '@mui/material';
import {
  AccountBalanceWalletOutlined,
  TimelineOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import { Formik, Form } from 'formik';
import type { FormikProps } from 'formik';

import { useDispatch, useSelector } from 'store';
import { BodyMuted, PageTitle } from 'components/Typography';

import type { Step } from 'features/carrier-portal/engine';
import LedgerSection from 'features/carrier-portal/components/LedgerSection';
import LedgerGroup from 'features/carrier-portal/components/LedgerGroup';
import LedgerAddRow from 'features/carrier-portal/components/LedgerAddRow';
import ExpenseRow from 'features/carrier-portal/components/ExpenseRow';
import EditableExpenseRow from 'features/carrier-portal/components/EditableExpenseRow';
import AssetPaymentRow from 'features/carrier-portal/components/AssetPaymentRow';
import type { AssetPaymentOwnership } from 'features/carrier-portal/components/AssetPaymentRow';
import RateCard from 'features/carrier-portal/components/RateCard';
import { useStepNavigation } from 'features/carrier-portal/components/StepNavContext';

import { carrierPortalV2Actions } from '../../../store/reducers/carrierPortalSlice';
import {
  selectLoading,
  selectSession,
} from '../../../store/selectors/carrierPortalSelectors';
import {
  computeDerivedValues,
  hasAnyCostData,
  type CostInputs,
  type EquipmentOwnership,
  type EquipmentPayment,
  type NamedMonthlyItem,
  type OwnerPayBasis,
} from './computations';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CostAnalysisStepProps {
  step: Step;
}

interface VehicleEntry {
  id: string;
  nickname?: string;
  year?: string | number;
  make?: string;
  model?: string;
  type?: string;
  ownership?: EquipmentOwnership;
  loanPayment?: number | string;
  insuranceMonthlyCost?: number | string;
}

interface EquipmentRowValues {
  assetId: string;
  ownership: EquipmentOwnership;
  monthlyAmount: string;
  insuranceMonthlyAmount: string;
  // Display-only:
  assetName: string;
  tagLabel: string;
  tagVariant: 'truck' | 'trailer';
}

interface NamedItemValues {
  id: string;
  name: string;
  amount: string;
}

interface FormValues {
  equipmentPayments: EquipmentRowValues[];
  policies: NamedItemValues[];
  subscriptions: NamedItemValues[];
  overhead: {
    officeUtilities: string;
    accountingLegal: string;
    bankFeesCardsFactoring: string;
  };
  ownerPay: {
    perTruckWeekly: string;
    payBasis: OwnerPayBasis;
  };
  fuel: {
    dieselPrice: string;
    mpg: string;
  };
  wearOps: {
    maintenance: string;
    tires: string;
    def: string;
    tolls: string;
  };
  operating: {
    loadedMilesPerMonth: string;
    deadheadPct: string;
    marginPct: string;
  };
}

interface CostAnalysisAnswers {
  equipmentPayments?: {
    assetId?: string;
    ownership?: EquipmentOwnership;
    monthlyAmount?: number;
    insuranceMonthlyAmount?: number;
  }[];
  policies?: { id?: string; name?: string; monthlyAmount?: number }[];
  subscriptions?: { id?: string; name?: string; monthlyAmount?: number }[];
  overhead?: Partial<FormValues['overhead']> & {
    officeUtilities?: number;
    accountingLegal?: number;
    bankFeesCardsFactoring?: number;
  };
  ownerPay?: { perTruckWeekly?: number; payBasis?: OwnerPayBasis };
  fuel?: { dieselPrice?: number; mpg?: number };
  wearOps?: {
    maintenance?: number;
    tires?: number;
    def?: number;
    tolls?: number;
  };
  operating?: {
    loadedMilesPerMonth?: number;
    deadheadPct?: number;
    marginPct?: number;
  };
}

interface EquipmentEntryAnswers {
  vehicles?: VehicleEntry[];
}

type FormikLike = FormikProps<FormValues>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TRAILER_TYPES = new Set(['trailer', 'reefer_trailer', 'flatbed_trailer', 'dryvan_trailer']);

const formatMoney = (amount: number, fractionDigits = 0): string =>
  amount.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

const toMoneyString = (value: number | string | undefined): string => {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  return String(value);
};

const parseMoney = (value: string): number => {
  if (!value) {
    return 0;
  }
  const cleaned = value.replace(/[^\d.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const generateId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const labelForVehicle = (v: VehicleEntry): string => {
  const parts = [v.year, v.make, v.model].filter(Boolean).map(String);
  if (parts.length > 0) {
    return parts.join(' ');
  }
  if (v.nickname) {
    return v.nickname;
  }
  return 'Vehicle';
};

const tagFromVehicleType = (type: string | undefined): { label: string; variant: 'truck' | 'trailer' } => {
  if (type && TRAILER_TYPES.has(type)) {
    return { label: 'Trailer', variant: 'trailer' };
  }
  return { label: 'Truck', variant: 'truck' };
};

const buildInitialValues = (vehicles: VehicleEntry[], existing: CostAnalysisAnswers): FormValues => {
  const equipmentByAssetId = new Map<string, NonNullable<CostAnalysisAnswers['equipmentPayments']>[number]>();
  for (const ep of existing.equipmentPayments ?? []) {
    if (ep.assetId) {
      equipmentByAssetId.set(ep.assetId, ep);
    }
  }

  const equipmentPayments: EquipmentRowValues[] = vehicles.map((v) => {
    const prior = equipmentByAssetId.get(v.id);
    const tag = tagFromVehicleType(v.type);
    const ownership: EquipmentOwnership =
      prior?.ownership ?? v.ownership ?? 'financed';
    return {
      assetId: v.id,
      ownership,
      monthlyAmount:
        prior?.monthlyAmount !== undefined
          ? String(prior.monthlyAmount)
          : toMoneyString(v.loanPayment),
      insuranceMonthlyAmount:
        prior?.insuranceMonthlyAmount !== undefined
          ? String(prior.insuranceMonthlyAmount)
          : toMoneyString(v.insuranceMonthlyCost),
      assetName: labelForVehicle(v),
      tagLabel: tag.label,
      tagVariant: tag.variant,
    };
  });

  return {
    equipmentPayments,
    policies: (existing.policies ?? []).map((p) => ({
      id: p.id ?? generateId('policy'),
      name: p.name ?? '',
      amount: p.monthlyAmount !== undefined ? String(p.monthlyAmount) : '',
    })),
    subscriptions: (existing.subscriptions ?? []).map((s) => ({
      id: s.id ?? generateId('sub'),
      name: s.name ?? '',
      amount: s.monthlyAmount !== undefined ? String(s.monthlyAmount) : '',
    })),
    overhead: {
      officeUtilities:
        existing.overhead?.officeUtilities !== undefined
          ? String(existing.overhead.officeUtilities)
          : '',
      accountingLegal:
        existing.overhead?.accountingLegal !== undefined
          ? String(existing.overhead.accountingLegal)
          : '',
      bankFeesCardsFactoring:
        existing.overhead?.bankFeesCardsFactoring !== undefined
          ? String(existing.overhead.bankFeesCardsFactoring)
          : '',
    },
    ownerPay: {
      perTruckWeekly:
        existing.ownerPay?.perTruckWeekly !== undefined
          ? String(existing.ownerPay.perTruckWeekly)
          : '',
      payBasis: existing.ownerPay?.payBasis ?? 'net',
    },
    fuel: {
      dieselPrice:
        existing.fuel?.dieselPrice !== undefined ? String(existing.fuel.dieselPrice) : '',
      mpg: existing.fuel?.mpg !== undefined ? String(existing.fuel.mpg) : '',
    },
    wearOps: {
      maintenance:
        existing.wearOps?.maintenance !== undefined
          ? String(existing.wearOps.maintenance)
          : '',
      tires: existing.wearOps?.tires !== undefined ? String(existing.wearOps.tires) : '',
      def: existing.wearOps?.def !== undefined ? String(existing.wearOps.def) : '',
      tolls: existing.wearOps?.tolls !== undefined ? String(existing.wearOps.tolls) : '',
    },
    operating: {
      loadedMilesPerMonth:
        existing.operating?.loadedMilesPerMonth !== undefined
          ? String(existing.operating.loadedMilesPerMonth)
          : '',
      deadheadPct:
        existing.operating?.deadheadPct !== undefined
          ? String(existing.operating.deadheadPct)
          : '',
      marginPct:
        existing.operating?.marginPct !== undefined ? String(existing.operating.marginPct) : '',
    },
  };
};

const valuesToCostInputs = (values: FormValues): CostInputs => ({
  equipmentPayments: values.equipmentPayments.map<EquipmentPayment>((e) => ({
    assetId: e.assetId,
    ownership: e.ownership,
    monthlyAmount: parseMoney(e.monthlyAmount),
    insuranceMonthlyAmount: parseMoney(e.insuranceMonthlyAmount),
  })),
  policies: values.policies.map<NamedMonthlyItem>((p) => ({
    id: p.id,
    name: p.name,
    monthlyAmount: parseMoney(p.amount),
  })),
  subscriptions: values.subscriptions.map<NamedMonthlyItem>((s) => ({
    id: s.id,
    name: s.name,
    monthlyAmount: parseMoney(s.amount),
  })),
  overhead: {
    officeUtilities: parseMoney(values.overhead.officeUtilities),
    accountingLegal: parseMoney(values.overhead.accountingLegal),
    bankFeesCardsFactoring: parseMoney(values.overhead.bankFeesCardsFactoring),
  },
  ownerPay: {
    perTruckWeekly: parseMoney(values.ownerPay.perTruckWeekly),
    payBasis: values.ownerPay.payBasis,
  },
  fuel: {
    dieselPrice: parseMoney(values.fuel.dieselPrice),
    mpg: parseMoney(values.fuel.mpg),
  },
  wearOps: {
    maintenance: parseMoney(values.wearOps.maintenance),
    tires: parseMoney(values.wearOps.tires),
    def: parseMoney(values.wearOps.def),
    tolls: parseMoney(values.wearOps.tolls),
  },
  operating: {
    loadedMilesPerMonth: parseMoney(values.operating.loadedMilesPerMonth),
    deadheadPct: parseMoney(values.operating.deadheadPct),
    marginPct: parseMoney(values.operating.marginPct),
  },
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CostAnalysisStep: React.FC<CostAnalysisStepProps> = ({ step }) => {
  const dispatch = useDispatch();
  const session = useSelector(selectSession);
  const saveStatus = useSelector(selectLoading('costAnalysis'));

  const vehicles = useMemo<VehicleEntry[]>(() => {
    if (!session) {
      return [];
    }
    const equipmentAnswers = (session.answers['equipment-entry'] ?? {}) as EquipmentEntryAnswers;
    const list = equipmentAnswers.vehicles;
    return Array.isArray(list) ? list.filter((v): v is VehicleEntry => Boolean(v?.id)) : [];
  }, [session]);

  const existingAnswers = useMemo<CostAnalysisAnswers>(() => {
    if (!session) {
      return {};
    }
    return (session.answers[step.id] ?? {}) as CostAnalysisAnswers;
  }, [session, step.id]);

  const initialValues = useMemo<FormValues>(
    () => buildInitialValues(vehicles, existingAnswers),
    [vehicles, existingAnswers],
  );

  if (!session) {
    return null;
  }

  const hasVehicles = vehicles.length > 0;
  const isPending = saveStatus === 'pending';

  const handleSubmit = (values: FormValues): void => {
    if (!hasVehicles) {
      return;
    }
    const inputs = valuesToCostInputs(values);
    const payload: Record<string, unknown> = {
      equipmentPayments: inputs.equipmentPayments,
      policies: inputs.policies,
      subscriptions: inputs.subscriptions,
      overhead: inputs.overhead,
      ownerPay: inputs.ownerPay,
      fuel: inputs.fuel,
      wearOps: inputs.wearOps,
      operating: inputs.operating,
    };
    dispatch(carrierPortalV2Actions.saveCostAnalysis(payload));
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 960 }}>
      {step.title ? <PageTitle sx={{ mb: 1 }}>{step.title}</PageTitle> : null}
      {step.subtitle ? <BodyMuted sx={{ mb: 3 }}>{step.subtitle}</BodyMuted> : null}

      <Formik initialValues={initialValues} enableReinitialize onSubmit={handleSubmit}>
        {(formik: FormikLike) => {
          const derived = computeDerivedValues(valuesToCostInputs(formik.values));
          const hasData = hasAnyCostData(derived) && hasVehicles;
          const rateCardEmpty = !hasData;

          const handleEquipmentField =
            (index: number, field: 'monthlyAmount' | 'insuranceMonthlyAmount') =>
            (event: ChangeEvent<HTMLInputElement>): void => {
              formik.setFieldValue(
                `equipmentPayments.${index}.${field}`,
                event.target.value,
              );
            };

          const handleEquipmentOwnership =
            (index: number) =>
            (next: AssetPaymentOwnership): void => {
              formik.setFieldValue(`equipmentPayments.${index}.ownership`, next);
            };

          const addPolicy = (): void => {
            formik.setFieldValue('policies', [
              ...formik.values.policies,
              { id: generateId('policy'), name: '', amount: '' },
            ]);
          };

          const removePolicy = (id: string): void => {
            formik.setFieldValue(
              'policies',
              formik.values.policies.filter((p) => p.id !== id),
            );
          };

          const updatePolicy = (id: string, patch: Partial<NamedItemValues>): void => {
            formik.setFieldValue(
              'policies',
              formik.values.policies.map((p) => (p.id === id ? { ...p, ...patch } : p)),
            );
          };

          const addSubscription = (): void => {
            formik.setFieldValue('subscriptions', [
              ...formik.values.subscriptions,
              { id: generateId('sub'), name: '', amount: '' },
            ]);
          };

          const removeSubscription = (id: string): void => {
            formik.setFieldValue(
              'subscriptions',
              formik.values.subscriptions.filter((s) => s.id !== id),
            );
          };

          const updateSubscription = (id: string, patch: Partial<NamedItemValues>): void => {
            formik.setFieldValue(
              'subscriptions',
              formik.values.subscriptions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
            );
          };

          return (
            <Form noValidate>
              <Stack spacing={3}>
                {!hasVehicles ? (
                  <BodyMuted sx={{ fontStyle: 'italic' }}>
                    Add at least one vehicle in the equipment phase to enable cost analysis.
                  </BodyMuted>
                ) : null}

                <LedgerSection
                  icon={<AccountBalanceWalletOutlined />}
                  iconVariant="indigo"
                  title="Fixed costs · monthly"
                  subtitle="Costs you pay whether the truck rolls or not."
                  totalLabel="Subtotal"
                  totalValue={`$${formatMoney(derived.fixedMonthly)} / mo`}
                >
                  <LedgerGroup
                    label="Equipment payments"
                    subTotal={`$${formatMoney(derived.equipmentMonthly)} / mo`}
                  >
                    {formik.values.equipmentPayments.map((row, index) => (
                      <AssetPaymentRow
                        key={row.assetId}
                        name={`equipmentPayments-${row.assetId}`}
                        assetName={row.assetName}
                        tagLabel={row.tagLabel}
                        tagVariant={row.tagVariant}
                        ownership={row.ownership}
                        onOwnershipChange={handleEquipmentOwnership(index)}
                        amount={row.monthlyAmount}
                        onAmountChange={handleEquipmentField(index, 'monthlyAmount')}
                      />
                    ))}
                  </LedgerGroup>

                  <LedgerGroup
                    label="Insurance & permits"
                    subTotal={`$${formatMoney(derived.policiesMonthly)} / mo`}
                  >
                    {formik.values.policies.map((policy) => (
                      <EditableExpenseRow
                        key={policy.id}
                        name={policy.id}
                        nameValue={policy.name}
                        onNameChange={(next) => updatePolicy(policy.id, { name: next })}
                        namePlaceholder="Policy name"
                        prefix="$"
                        suffix="/mo"
                        amount={policy.amount}
                        amountPlaceholder="0"
                        onAmountChange={(event) =>
                          updatePolicy(policy.id, { amount: event.target.value })
                        }
                        onRemove={() => removePolicy(policy.id)}
                      />
                    ))}
                    <LedgerAddRow label="Add a policy" onClick={addPolicy} />
                  </LedgerGroup>

                  <LedgerGroup
                    label="Tech & subscriptions"
                    subTotal={`$${formatMoney(derived.subscriptionsMonthly)} / mo`}
                  >
                    {formik.values.subscriptions.map((sub) => (
                      <EditableExpenseRow
                        key={sub.id}
                        name={sub.id}
                        nameValue={sub.name}
                        onNameChange={(next) => updateSubscription(sub.id, { name: next })}
                        namePlaceholder="Subscription name"
                        prefix="$"
                        suffix="/mo"
                        amount={sub.amount}
                        amountPlaceholder="0"
                        onAmountChange={(event) =>
                          updateSubscription(sub.id, { amount: event.target.value })
                        }
                        onRemove={() => removeSubscription(sub.id)}
                      />
                    ))}
                    <LedgerAddRow label="Add a subscription" onClick={addSubscription} />
                  </LedgerGroup>

                  <LedgerGroup
                    label="Overhead & admin"
                    subTotal={`$${formatMoney(derived.overheadMonthly)} / mo`}
                  >
                    <ExpenseRow
                      name="officeUtilities"
                      label="Office, parking, utilities"
                      prefix="$"
                      suffix="/mo"
                      value={formik.values.overhead.officeUtilities}
                      onChange={(e) =>
                        formik.setFieldValue('overhead.officeUtilities', e.target.value)
                      }
                      placeholder="0"
                    />
                    <ExpenseRow
                      name="accountingLegal"
                      label="Accounting & legal"
                      prefix="$"
                      suffix="/mo"
                      value={formik.values.overhead.accountingLegal}
                      onChange={(e) =>
                        formik.setFieldValue('overhead.accountingLegal', e.target.value)
                      }
                      placeholder="0"
                    />
                    <ExpenseRow
                      name="bankFeesCardsFactoring"
                      label="Bank fees, cards, factoring"
                      prefix="$"
                      suffix="/mo"
                      value={formik.values.overhead.bankFeesCardsFactoring}
                      onChange={(e) =>
                        formik.setFieldValue('overhead.bankFeesCardsFactoring', e.target.value)
                      }
                      placeholder="0"
                    />
                  </LedgerGroup>

                  <LedgerGroup
                    label="Owner / driver pay"
                    subTotal={`$${formatMoney(derived.ownerPayMonthly)} / mo`}
                  >
                    <ExpenseRow
                      name="perTruckWeekly"
                      label="Target income per truck per week"
                      prefix="$"
                      suffix="/wk"
                      value={formik.values.ownerPay.perTruckWeekly}
                      onChange={(e) =>
                        formik.setFieldValue('ownerPay.perTruckWeekly', e.target.value)
                      }
                      placeholder="0"
                    />
                  </LedgerGroup>
                </LedgerSection>

                <LedgerSection
                  icon={<TrendingUpOutlined />}
                  iconVariant="amber"
                  title="Variable costs · per mile"
                  subtitle="Costs that scale with how far you run."
                  totalLabel="Subtotal"
                  totalValue={`$${derived.variablePerMile.toFixed(2)} / mi`}
                >
                  <LedgerGroup label="Fuel">
                    <ExpenseRow
                      name="dieselPrice"
                      label="Diesel price"
                      prefix="$"
                      suffix="/gal"
                      value={formik.values.fuel.dieselPrice}
                      onChange={(e) =>
                        formik.setFieldValue('fuel.dieselPrice', e.target.value)
                      }
                      placeholder="0.00"
                    />
                    <ExpenseRow
                      name="mpg"
                      label="Fleet avg fuel economy"
                      suffix="MPG"
                      value={formik.values.fuel.mpg}
                      onChange={(e) => formik.setFieldValue('fuel.mpg', e.target.value)}
                      placeholder="0.0"
                    />
                  </LedgerGroup>

                  <LedgerGroup label="Wear & ops">
                    <ExpenseRow
                      name="maintenance"
                      label="Maintenance reserve"
                      prefix="$"
                      suffix="/mi"
                      value={formik.values.wearOps.maintenance}
                      onChange={(e) =>
                        formik.setFieldValue('wearOps.maintenance', e.target.value)
                      }
                      placeholder="0.00"
                    />
                    <ExpenseRow
                      name="tires"
                      label="Tires reserve"
                      prefix="$"
                      suffix="/mi"
                      value={formik.values.wearOps.tires}
                      onChange={(e) => formik.setFieldValue('wearOps.tires', e.target.value)}
                      placeholder="0.00"
                    />
                    <ExpenseRow
                      name="def"
                      label="DEF / additives"
                      prefix="$"
                      suffix="/mi"
                      value={formik.values.wearOps.def}
                      onChange={(e) => formik.setFieldValue('wearOps.def', e.target.value)}
                      placeholder="0.00"
                    />
                    <ExpenseRow
                      name="tolls"
                      label="Tolls (avg)"
                      prefix="$"
                      suffix="/mi"
                      value={formik.values.wearOps.tolls}
                      onChange={(e) => formik.setFieldValue('wearOps.tolls', e.target.value)}
                      placeholder="0.00"
                    />
                  </LedgerGroup>
                </LedgerSection>

                <LedgerSection
                  icon={<TimelineOutlined />}
                  iconVariant="emerald"
                  title="Operating assumptions"
                  subtitle="How we turn fixed costs into per-mile."
                  totalLabel="Annualized"
                  totalValue={`${formatMoney(derived.annualizedMiles)} mi / yr`}
                >
                  <LedgerGroup label="Mileage & margin">
                    <ExpenseRow
                      name="loadedMilesPerMonth"
                      label="Loaded miles per month"
                      suffix="mi"
                      value={formik.values.operating.loadedMilesPerMonth}
                      onChange={(e) =>
                        formik.setFieldValue('operating.loadedMilesPerMonth', e.target.value)
                      }
                      placeholder="0"
                    />
                    <ExpenseRow
                      name="deadheadPct"
                      label="Deadhead percentage"
                      suffix="%"
                      value={formik.values.operating.deadheadPct}
                      onChange={(e) =>
                        formik.setFieldValue('operating.deadheadPct', e.target.value)
                      }
                      placeholder="0"
                    />
                    <ExpenseRow
                      name="marginPct"
                      label="Target profit margin"
                      suffix="%"
                      value={formik.values.operating.marginPct}
                      onChange={(e) =>
                        formik.setFieldValue('operating.marginPct', e.target.value)
                      }
                      placeholder="0"
                    />
                  </LedgerGroup>
                </LedgerSection>

                <RateCard
                  eyebrow="Your minimum book rate"
                  amount={rateCardEmpty ? '—' : `$${derived.minRatePerMile.toFixed(2)}`}
                  unit="/loaded mi"
                  emptyState={rateCardEmpty}
                  secondary={{
                    eyebrow: 'Cost per mile',
                    amount: rateCardEmpty ? '—' : `$${derived.breakEvenCpm.toFixed(2)}`,
                    unit: '/loaded mi · break-even',
                  }}
                  explain={
                    rateCardEmpty
                      ? 'Fill in your fleet P&L and operating assumptions to see your break-even cost and minimum book rate.'
                      : `Fixed $${formatMoney(derived.fixedMonthly)}/mo ÷ ${formatMoney(derived.loadedAdjustedMiles)} loaded mi + variable $${derived.variablePerMile.toFixed(2)}/mi + ${parseMoney(formik.values.operating.marginPct).toFixed(0)}% margin.`
                  }
                />

                <CostAnalysisNavRegister
                  formik={formik}
                  hasVehicles={hasVehicles}
                  isPending={isPending}
                />
              </Stack>
            </Form>
          );
        }}
      </Formik>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// CostAnalysisNavRegister — inner registrar so we can read `formik.submitForm`
// inside the Formik render-prop and surface it to the footer.
// ---------------------------------------------------------------------------

interface CostAnalysisNavRegisterProps {
  formik: FormikLike;
  hasVehicles: boolean;
  isPending: boolean;
}

const CostAnalysisNavRegister: React.FC<CostAnalysisNavRegisterProps> = ({
  formik,
  hasVehicles,
  isPending,
}) => {
  const { submitForm } = formik;
  useStepNavigation({
    canContinue: hasVehicles && !isPending,
    onContinue: submitForm,
    isPending,
  });
  return null;
};

export default CostAnalysisStep;
