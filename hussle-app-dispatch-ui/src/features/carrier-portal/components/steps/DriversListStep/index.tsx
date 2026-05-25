// ---------------------------------------------------------------------------
// DriversListStep — dedicated list-builder for the drivers-list step.
//
// Replaces the generic InputStep fallback. Composes the shipped list-builder
// primitives (Empty / Item / InlineForm / AddMore). Local `entries[]` state;
// Continue dispatches `submitStep({ stepId, answers: { entries } })`.
// ---------------------------------------------------------------------------

import { useCallback, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { Formik } from 'formik';
import type { FormikProps } from 'formik';
import * as Yup from 'yup';
import { PeopleAltOutlined } from '@mui/icons-material';

import { useDispatch, useSelector } from 'store';
import { EmailField, PhoneField, SelectField, TextField } from 'mocho/components/form-fields';

import type { Step } from 'features/carrier-portal/engine';
import ListBuilderHeader from 'features/carrier-portal/components/ListBuilderHeader';
import ListBuilderEmptyState from 'features/carrier-portal/components/ListBuilderEmptyState';
import ListBuilderItem from 'features/carrier-portal/components/ListBuilderItem';
import ListBuilderAddMoreButton from 'features/carrier-portal/components/ListBuilderAddMoreButton';
import ListBuilderInlineForm from 'features/carrier-portal/components/ListBuilderInlineForm';
import FieldGroupLabel from 'features/carrier-portal/components/FieldGroupLabel';
import OnboardingCard from 'features/carrier-portal/components/OnboardingCard';
import { useStepNavigation } from 'features/carrier-portal/components/StepNavContext';

import { carrierPortalV2Actions } from '../../../store/reducers/carrierPortalSlice';
import { selectLoading, selectSession } from '../../../store/selectors/carrierPortalSelectors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Mirrors `DriverPayType` in the Prisma schema and the API validator's
// `oneOf` set (`hussle-app-dispatch-api/src/carrier-portal/validators/
// driversValidator.ts`). Uppercase enum is the canonical wire format; the
// UI used to emit lowercase variants which the API validator rejected.
type PayType = 'PERCENTAGE' | 'PER_MILE' | 'PER_HOUR' | 'FLAT_RATE';

interface DriverEntry {
  // Local-only React key, never submitted to the server (US-30).
  _tempKey: string;
  // Server-assigned UUID — present only after a successful submit round-trip.
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  payType: PayType;
  payRate: string;
}

interface DriverFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  payType: PayType;
  payRate: string;
}

interface DriversListStepProps {
  step: Step;
}

// Persisted shape from session.answers — server doesn't store _tempKey.
interface PersistedDriverEntry extends Omit<DriverEntry, '_tempKey'> {
  _tempKey?: string;
}

// Canonical key for the persisted drivers list inside session.answers is
// `drivers` (matches the Prisma model and the dedicated /carrier-portal/
// drivers endpoint). Legacy sessions may carry `entries` from before the
// shape was aligned; we read both on hydration and always write `drivers`.
interface DriversAnswers {
  drivers?: PersistedDriverEntry[];
  entries?: PersistedDriverEntry[];
}

interface DriverDraftState {
  sourceFingerprint: string;
  items: DriverEntry[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAY_TYPE_OPTIONS = [
  { value: 'PERCENTAGE', label: 'Percentage' },
  { value: 'PER_MILE', label: 'Per mile' },
  { value: 'PER_HOUR', label: 'Per hour' },
  { value: 'FLAT_RATE', label: 'Flat rate' },
];

const PAY_SUFFIX: Record<PayType, string> = {
  PERCENTAGE: '% of gross',
  PER_MILE: '/mi',
  PER_HOUR: '/hr',
  FLAT_RATE: '$ per load',
};

const PAY_LABEL: Record<PayType, string> = {
  PERCENTAGE: 'Percentage',
  PER_MILE: 'Per mile',
  PER_HOUR: 'Per hour',
  FLAT_RATE: 'Flat rate',
};

// Hand-rolled normaliser for legacy lowercase values that may exist in
// stored answers JSON from before the contract aligned. Server projection
// emits uppercase; this is a safety net for old session data only.
const LEGACY_PAY_TYPE_MAP: Record<string, PayType> = {
  percentage: 'PERCENTAGE',
  per_mile: 'PER_MILE',
  per_hour: 'PER_HOUR',
  flat_rate: 'FLAT_RATE',
};

const readDriversAnswers = (answers: DriversAnswers): PersistedDriverEntry[] => {
  if (Array.isArray(answers.drivers)) return answers.drivers;
  if (Array.isArray(answers.entries)) return answers.entries;
  return [];
};

const payRateToString = (raw: string | number | null | undefined): string => {
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number') return String(raw);
  return '';
};

const normalizePayType = (raw: string | null | undefined): PayType => {
  if (raw === 'PERCENTAGE' || raw === 'PER_MILE' || raw === 'PER_HOUR' || raw === 'FLAT_RATE') {
    return raw;
  }
  if (raw && raw in LEGACY_PAY_TYPE_MAP) {
    return LEGACY_PAY_TYPE_MAP[raw] ?? 'PERCENTAGE';
  }
  return 'PERCENTAGE';
};

const EMPTY_DRIVER_FORM: DriverFormValues = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  payType: 'PERCENTAGE',
  payRate: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Local-only key for React list rendering. Never submitted to the server.
const generateTempKey = (): string => crypto.randomUUID();

const driverNameOf = (d: DriverEntry): string => {
  const name = `${d.firstName} ${d.lastName}`.trim();
  return name.length > 0 ? name : 'Driver';
};

const driverInitialsOf = (d: DriverEntry): string => {
  const first = d.firstName.charAt(0).toUpperCase();
  const last = d.lastName.charAt(0).toUpperCase();
  const initials = `${first}${last}`;
  return initials.length > 0 ? initials : 'DR';
};

const driverMetaOf = (d: DriverEntry): string[] => {
  const meta: string[] = [];
  if (d.email) {
    meta.push(d.email);
  }
  if (d.phone) {
    meta.push(d.phone);
  }
  if (d.payRate) {
    meta.push(`${PAY_LABEL[d.payType]} · ${d.payRate}${PAY_SUFFIX[d.payType]}`);
  }
  return meta;
};

const isDriverFormComplete = (v: DriverFormValues): boolean =>
  v.firstName.trim().length > 0 &&
  v.lastName.trim().length > 0 &&
  v.phone.trim().length > 0 &&
  v.email.trim().length > 0 &&
  v.payRate.trim().length > 0;

// Mirrors `driversValidator.payRate` on the API
// (`hussle-app-dispatch-api/src/carrier-portal/validators/driversValidator.ts`).
// Range is 0..100 inclusive; the UI string is parsed before submit and we
// surface an inline error before the request goes out.
const driverFormValidationSchema = Yup.object({
  payRate: Yup.string()
    .test(
      'payRate-range',
      'Pay rate must be between 0 and 100',
      (value) => {
        if (typeof value !== 'string' || value.trim().length === 0) {
          // Empty values are handled by `isDriverFormComplete` (saveDisabled).
          return true;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100;
      },
    ),
});

// ---------------------------------------------------------------------------
// DriverAvatar
// ---------------------------------------------------------------------------

const DriverAvatar: React.FC<{ initials: string }> = ({ initials }) => (
  <Box
    sx={{
      width: 44,
      height: 44,
      borderRadius: 1,
      bgcolor: 'primary.dark',
      color: 'common.white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: 13,
      letterSpacing: '0.02em',
    }}
  >
    {initials}
  </Box>
);

// ---------------------------------------------------------------------------
// DriverForm — inline form for adding a driver
// ---------------------------------------------------------------------------

interface DriverFormProps {
  formNumber: number;
  initialValues: DriverFormValues;
  title?: string;
  saveLabel?: string;
  onCancel: () => void;
  onSave: (values: DriverFormValues) => void;
  onSaveAndAddAnother?: (values: DriverFormValues) => void;
}

const toDriverFormValues = (record: Record<string, unknown>): DriverFormValues => ({
  firstName: String(record.firstName ?? ''),
  lastName: String(record.lastName ?? ''),
  phone: String(record.phone ?? ''),
  email: String(record.email ?? ''),
  payType: normalizePayType(typeof record.payType === 'string' ? record.payType : null),
  payRate: String(record.payRate ?? ''),
});

const DriverForm: React.FC<DriverFormProps> = ({
  formNumber,
  initialValues,
  title = 'Add a driver',
  saveLabel = 'Save driver',
  onCancel,
  onSave,
  onSaveAndAddAnother,
}) => {
  const formikInitial: Record<string, unknown> = { ...initialValues };
  return (
    <Formik<Record<string, unknown>>
      initialValues={formikInitial}
      onSubmit={(values) => onSave(toDriverFormValues(values))}
      validationSchema={driverFormValidationSchema}
      enableReinitialize
    >
      {(formik: FormikProps<Record<string, unknown>>) => {
        const current = toDriverFormValues(formik.values);
        const suffix = PAY_SUFFIX[current.payType];
        const hasValidationErrors = Object.keys(formik.errors).length > 0;
        const saveDisabled = !isDriverFormComplete(current) || hasValidationErrors;
        return (
          <ListBuilderInlineForm
            number={formNumber}
            title={title}
            onCancel={onCancel}
            onSave={() => onSave(toDriverFormValues(formik.values))}
            saveLabel={saveLabel}
            onSaveAndAddAnother={
              onSaveAndAddAnother
                ? () => onSaveAndAddAnother(toDriverFormValues(formik.values))
                : undefined
            }
            saveAndAddAnotherLabel="Save driver & add another"
            saveDisabled={saveDisabled}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1.5,
              }}
            >
              <Box sx={{ gridColumn: '1 / -1' }}>
                <FieldGroupLabel>Name &amp; contact</FieldGroupLabel>
              </Box>

              <TextField
                name="firstName"
                label="First name"
                placeholder="Isaiah"
                required
                formik={formik}
              />
              <TextField
                name="lastName"
                label="Last name"
                placeholder="Williams"
                required
                formik={formik}
              />
              <PhoneField name="phone" label="Phone" required formik={formik} />
              <EmailField
                name="email"
                label="Email"
                placeholder="isaiah@example.com"
                required
                formik={formik}
              />

              <Box sx={{ gridColumn: '1 / -1' }}>
                <FieldGroupLabel>Pay structure</FieldGroupLabel>
              </Box>
              <SelectField
                name="payType"
                label="Pay type"
                data={PAY_TYPE_OPTIONS}
                required
                formik={formik}
              />
              <TextField
                name="payRate"
                label="Pay rate"
                placeholder="70"
                endAdornment={suffix}
                required
                formik={formik}
              />
            </Box>
          </ListBuilderInlineForm>
        );
      }}
    </Formik>
  );
};

// ---------------------------------------------------------------------------
// DriversListStep
// ---------------------------------------------------------------------------

const DriversListStep: React.FC<DriversListStepProps> = ({ step }) => {
  const dispatch = useDispatch();
  const session = useSelector(selectSession);
  const submitStatus = useSelector(selectLoading('drivers'));

  const persistedFingerprint = useMemo(() => {
    if (!session) {
      return '';
    }
    const answers = (session.answers[step.id] ?? {}) as DriversAnswers;
    return JSON.stringify(readDriversAnswers(answers));
  }, [session, step.id]);

  // Two sources, in priority order:
  //  1. `session.answers[step.id].drivers` (or legacy `.entries`) — last-
  //     submitted draft, primary source within a session.
  //  2. `session.drivers` — typed Driver table projection (durable across
  //     sessions; primary source on fresh page load when answers is empty).
  const initialDrivers = useMemo<DriverEntry[]>(() => {
    if (!session) {
      return [];
    }
    const answers = (session.answers[step.id] ?? {}) as DriversAnswers;
    const sourceEntries = readDriversAnswers(answers);
    if (sourceEntries.length > 0) {
      return sourceEntries.map((d) => ({
        ...d,
        _tempKey: d._tempKey ?? generateTempKey(),
        payType: normalizePayType(d.payType),
      }));
    }
    const projected = session.drivers ?? [];
    return projected.map((d) => {
      const payRate = payRateToString(d.payRate);
      return {
        _tempKey: generateTempKey(),
        id: d.id,
        firstName: d.firstName,
        lastName: d.lastName,
        phone: d.phone ?? '',
        email: d.email ?? '',
        payType: normalizePayType(d.payType),
        payRate,
      };
    });
  }, [session, step.id]);

  const [driverDraft, setDriverDraft] = useState<DriverDraftState>(() => ({
    sourceFingerprint: persistedFingerprint,
    items: initialDrivers,
  }));
  // `closed` — no form rendered. `add` — blank form for a new driver.
  // `edit:<_tempKey>` — form pre-filled with that driver's current values.
  type FormMode = { kind: 'closed' } | { kind: 'add' } | { kind: 'edit'; tempKey: string };
  const [formMode, setFormMode] = useState<FormMode>({ kind: 'closed' });

  // After a successful submit, session.answers[stepId].entries is replaced
  // with the server response containing Prisma UUIDs. When that fingerprint
  // changes, read from session until the carrier makes a new local edit.
  const drivers =
    driverDraft.sourceFingerprint === persistedFingerprint ? driverDraft.items : initialDrivers;

  const buildNewDriver = (values: DriverFormValues): DriverEntry => ({
    _tempKey: generateTempKey(),
    // `id` deliberately omitted — server assigns after submit.
    firstName: values.firstName,
    lastName: values.lastName,
    phone: values.phone,
    email: values.email,
    payType: values.payType,
    payRate: values.payRate,
  });

  const handleAddSaved = (values: DriverFormValues): void => {
    const next = buildNewDriver(values);
    setDriverDraft((prev) => {
      const baseItems =
        prev.sourceFingerprint === persistedFingerprint ? prev.items : initialDrivers;
      return { sourceFingerprint: persistedFingerprint, items: [...baseItems, next] };
    });
    setFormMode({ kind: 'closed' });
  };

  const handleAddSavedAndAddAnother = (values: DriverFormValues): void => {
    const next = buildNewDriver(values);
    setDriverDraft((prev) => {
      const baseItems =
        prev.sourceFingerprint === persistedFingerprint ? prev.items : initialDrivers;
      return { sourceFingerprint: persistedFingerprint, items: [...baseItems, next] };
    });
    setFormMode({ kind: 'add' });
  };

  // Replace an existing driver row in place. Preserves `_tempKey` and the
  // server-assigned `id` (when present) so the saga's upsert path can match
  // the edited row to an existing Driver record.
  const handleEditSaved = (tempKey: string, values: DriverFormValues): void => {
    setDriverDraft((prev) => {
      const baseItems =
        prev.sourceFingerprint === persistedFingerprint ? prev.items : initialDrivers;
      return {
        sourceFingerprint: persistedFingerprint,
        items: baseItems.map((d) =>
          d._tempKey === tempKey
            ? {
                ...d,
                firstName: values.firstName,
                lastName: values.lastName,
                phone: values.phone,
                email: values.email,
                payType: values.payType,
                payRate: values.payRate,
              }
            : d,
        ),
      };
    });
    setFormMode({ kind: 'closed' });
  };

  const handleRemove = (tempKey: string): void => {
    setDriverDraft((prev) => {
      const baseItems =
        prev.sourceFingerprint === persistedFingerprint ? prev.items : initialDrivers;
      return {
        sourceFingerprint: persistedFingerprint,
        items: baseItems.filter((d) => d._tempKey !== tempKey),
      };
    });
    if (formMode.kind === 'edit' && formMode.tempKey === tempKey) {
      setFormMode({ kind: 'closed' });
    }
  };

  const editingDriver =
    formMode.kind === 'edit'
      ? drivers.find((d) => d._tempKey === formMode.tempKey) ?? null
      : null;

  const driverToFormValues = (d: DriverEntry): DriverFormValues => ({
    firstName: d.firstName,
    lastName: d.lastName,
    phone: d.phone,
    email: d.email,
    payType: d.payType,
    payRate: d.payRate,
  });

  const handleContinue = useCallback((): void => {
    if (drivers.length === 0) {
      return;
    }
    // Strip local-only `_tempKey` from the payload. `id` is present only when
    // the server already assigned one (re-submit/edit case). Convert payRate
    // from the form's string representation to the number the API expects.
    const payloadDrivers = drivers.map(({ _tempKey: _omit, payRate, ...rest }) => {
      const parsed = Number(payRate);
      return {
        ...rest,
        payRate: Number.isFinite(parsed) ? parsed : 0,
      };
    });
    dispatch(
      carrierPortalV2Actions.saveDrivers({
        hasAdditionalDrivers: true,
        drivers: payloadDrivers,
      }),
    );
  }, [dispatch, drivers]);

  const isPending = submitStatus === 'pending';

  useStepNavigation({
    canContinue: drivers.length > 0 && !isPending,
    onContinue: handleContinue,
    isPending,
  });

  if (!session) {
    return null;
  }

  return (
    <OnboardingCard
      phase="Drivers"
      title={step.title ?? "Add each driver who'll run loads for you."}
      subtitle={
        step.subtitle ??
        'Drivers get their own login to receive dispatched loads, message you back, and submit BOLs.'
      }
      width="lg"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {drivers.length === 0 && formMode.kind === 'closed' ? (
          <ListBuilderEmptyState
            icon={<PeopleAltOutlined />}
            title="No drivers added"
            subtitle="Start with yourself if you drive, then add anyone else who runs your trucks."
            ctaLabel="Add your first driver"
            onCtaClick={() => setFormMode({ kind: 'add' })}
          />
        ) : null}

        {drivers.length > 0 ? (
          <ListBuilderHeader
            count={drivers.length === 1 ? '1 driver' : `${drivers.length} drivers`}
          />
        ) : null}

        {drivers.map((d) => (
          <ListBuilderItem
            key={d._tempKey}
            thumbnail={<DriverAvatar initials={driverInitialsOf(d)} />}
            name={driverNameOf(d)}
            meta={driverMetaOf(d)}
            onEdit={() => setFormMode({ kind: 'edit', tempKey: d._tempKey })}
            onRemove={() => handleRemove(d._tempKey)}
          />
        ))}

        {formMode.kind === 'add' ? (
          <DriverForm
            formNumber={drivers.length + 1}
            initialValues={EMPTY_DRIVER_FORM}
            onCancel={() => setFormMode({ kind: 'closed' })}
            onSave={handleAddSaved}
            onSaveAndAddAnother={handleAddSavedAndAddAnother}
          />
        ) : null}

        {formMode.kind === 'edit' && editingDriver ? (
          <DriverForm
            formNumber={drivers.findIndex((d) => d._tempKey === editingDriver._tempKey) + 1}
            initialValues={driverToFormValues(editingDriver)}
            title="Edit driver"
            saveLabel="Save changes"
            onCancel={() => setFormMode({ kind: 'closed' })}
            onSave={(values) => handleEditSaved(editingDriver._tempKey, values)}
          />
        ) : null}

        {formMode.kind === 'closed' && drivers.length > 0 ? (
          <ListBuilderAddMoreButton
            label="Add another driver"
            onClick={() => setFormMode({ kind: 'add' })}
          />
        ) : null}
      </Box>
    </OnboardingCard>
  );
};

export default DriversListStep;
