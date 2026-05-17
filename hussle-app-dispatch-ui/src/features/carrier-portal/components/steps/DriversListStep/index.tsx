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
import { PeopleAltOutlined } from '@mui/icons-material';

import { useDispatch, useSelector } from 'store';
import {
  EmailField,
  PhoneField,
  SelectField,
  TextField,
} from 'mocho/components/form-fields';

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
import {
  selectLoading,
  selectSession,
} from '../../../store/selectors/carrierPortalSelectors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PayType = 'percentage' | 'per_mile' | 'flat_rate';

interface DriverEntry {
  id: string;
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

interface DriversAnswers {
  entries?: DriverEntry[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAY_TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'per_mile', label: 'Per mile' },
  { value: 'flat_rate', label: 'Flat rate' },
];

const PAY_SUFFIX: Record<PayType, string> = {
  percentage: '% of gross',
  per_mile: '/mi',
  flat_rate: '$ per load',
};

const PAY_LABEL: Record<PayType, string> = {
  percentage: 'Percentage',
  per_mile: 'Per mile',
  flat_rate: 'Flat rate',
};

const EMPTY_DRIVER_FORM: DriverFormValues = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  payType: 'percentage',
  payRate: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const generateDriverId = (): string =>
  `driver-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

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
  onCancel: () => void;
  onSave: (values: DriverFormValues) => void;
  onSaveAndAddAnother?: (values: DriverFormValues) => void;
}

const toDriverFormValues = (record: Record<string, unknown>): DriverFormValues => ({
  firstName: String(record.firstName ?? ''),
  lastName: String(record.lastName ?? ''),
  phone: String(record.phone ?? ''),
  email: String(record.email ?? ''),
  payType: (record.payType as PayType | undefined) ?? 'percentage',
  payRate: String(record.payRate ?? ''),
});

const DriverForm: React.FC<DriverFormProps> = ({
  formNumber,
  initialValues,
  onCancel,
  onSave,
  onSaveAndAddAnother,
}) => {
  const formikInitial: Record<string, unknown> = { ...initialValues };
  return (
    <Formik<Record<string, unknown>>
      initialValues={formikInitial}
      onSubmit={(values) => onSave(toDriverFormValues(values))}
      enableReinitialize
    >
      {(formik: FormikProps<Record<string, unknown>>) => {
        const current = toDriverFormValues(formik.values);
        const suffix = PAY_SUFFIX[current.payType];
        const saveDisabled = !isDriverFormComplete(current);
        return (
          <ListBuilderInlineForm
            number={formNumber}
            title="Add a driver"
            onCancel={onCancel}
            onSave={() => onSave(toDriverFormValues(formik.values))}
            saveLabel="Save driver"
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
  const submitStatus = useSelector(selectLoading('submitStep'));

  const initialDrivers = useMemo<DriverEntry[]>(() => {
    if (!session) {
      return [];
    }
    const answers = (session.answers[step.id] ?? {}) as DriversAnswers;
    return Array.isArray(answers.entries) ? answers.entries : [];
  }, [session, step.id]);

  const [drivers, setDrivers] = useState<DriverEntry[]>(initialDrivers);
  const [formOpen, setFormOpen] = useState<boolean>(false);

  const handleAddSaved = (values: DriverFormValues): void => {
    const next: DriverEntry = {
      id: generateDriverId(),
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      email: values.email,
      payType: values.payType,
      payRate: values.payRate,
    };
    setDrivers((prev) => [...prev, next]);
    setFormOpen(false);
  };

  const handleAddSavedAndAddAnother = (values: DriverFormValues): void => {
    const next: DriverEntry = {
      id: generateDriverId(),
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      email: values.email,
      payType: values.payType,
      payRate: values.payRate,
    };
    setDrivers((prev) => [...prev, next]);
    setFormOpen(true);
  };

  const handleRemove = (id: string): void => {
    setDrivers((prev) => prev.filter((d) => d.id !== id));
  };

  const handleContinue = useCallback((): void => {
    if (drivers.length === 0) {
      return;
    }
    dispatch(
      carrierPortalV2Actions.submitStep({
        stepId: step.id,
        answers: { entries: drivers },
      }),
    );
  }, [dispatch, drivers, step.id]);

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
        {drivers.length === 0 && !formOpen ? (
          <ListBuilderEmptyState
            icon={<PeopleAltOutlined />}
            title="No drivers added"
            subtitle="Start with yourself if you drive, then add anyone else who runs your trucks."
            ctaLabel="Add your first driver"
            onCtaClick={() => setFormOpen(true)}
          />
        ) : null}

        {drivers.length > 0 ? (
          <ListBuilderHeader
            count={drivers.length === 1 ? '1 driver' : `${drivers.length} drivers`}
          />
        ) : null}

        {drivers.map((d) => (
          <ListBuilderItem
            key={d.id}
            thumbnail={<DriverAvatar initials={driverInitialsOf(d)} />}
            name={driverNameOf(d)}
            meta={driverMetaOf(d)}
            onRemove={() => handleRemove(d.id)}
          />
        ))}

        {formOpen ? (
          <DriverForm
            formNumber={drivers.length + 1}
            initialValues={EMPTY_DRIVER_FORM}
            onCancel={() => setFormOpen(false)}
            onSave={handleAddSaved}
            onSaveAndAddAnother={handleAddSavedAndAddAnother}
          />
        ) : null}

        {!formOpen && drivers.length > 0 ? (
          <ListBuilderAddMoreButton
            label="Add another driver"
            onClick={() => setFormOpen(true)}
          />
        ) : null}
      </Box>
    </OnboardingCard>
  );
};

export default DriversListStep;
