// ---------------------------------------------------------------------------
// EquipmentListStep — dedicated list-builder for the equipment-entry step.
//
// Replaces the generic InputStep fallback. Composes the shipped list-builder
// primitives (Empty / Item / InlineForm / AddMore) + SelectionCardGrid for
// the vehicle category picker. Maintains a local `vehicles[]` collection and
// dispatches `submitStep({ stepId, answers: { vehicles } })` on Continue.
//
// Data shape: each entry carries `{ id, category, year, make, model, vin,
// licensePlate, gvwr, type }`. The `id` + `type` fields satisfy what
// CostAnalysisStep reads from `session.answers['equipment-entry'].vehicles`.
// ---------------------------------------------------------------------------

import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { Formik } from 'formik';
import type { FormikProps } from 'formik';
import { LocalShipping, RvHookup, DirectionsCar } from '@mui/icons-material';

import { useDispatch, useSelector } from 'store';
import { TextField } from 'mocho/components/form-fields';

import type { Step } from 'features/carrier-portal/engine';
import ListBuilderHeader from 'features/carrier-portal/components/ListBuilderHeader';
import ListBuilderEmptyState from 'features/carrier-portal/components/ListBuilderEmptyState';
import ListBuilderItem from 'features/carrier-portal/components/ListBuilderItem';
import ListBuilderAddMoreButton from 'features/carrier-portal/components/ListBuilderAddMoreButton';
import ListBuilderInlineForm from 'features/carrier-portal/components/ListBuilderInlineForm';
import FieldGroupLabel from 'features/carrier-portal/components/FieldGroupLabel';
import Callout from 'features/carrier-portal/components/Callout';
import OnboardingCard from 'features/carrier-portal/components/OnboardingCard';
import SelectionCardGrid from 'features/carrier-portal/components/SelectionCardGrid';
import type { SelectionCardOption } from 'features/carrier-portal/components/SelectionCardGrid';
import { useStepNavigation } from 'features/carrier-portal/components/StepNavContext';

import { carrierPortalV2Actions } from '../../../store/reducers/carrierPortalSlice';
import { selectLoading, selectSession } from '../../../store/selectors/carrierPortalSelectors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VehicleCategory = 'SEMI_TRUCK' | 'BOX_TRUCK' | 'CARGO_VAN' | 'PERSONAL_VEHICLE';
type LegacyVehicleCategory = 'semi' | 'box' | 'cargo_van' | 'personal';
type VehicleCategoryInput = VehicleCategory | LegacyVehicleCategory;

interface VehicleEntry {
  // Local-only key used for React list rendering and local list operations
  // (remove). NEVER sent in the submit payload — the server assigns the real
  // `id` after persistence (US-30).
  _tempKey: string;
  // Server-assigned UUID — present only after a successful submit round-trip.
  // Undefined for newly-added vehicles that haven't been persisted yet.
  id?: string;
  category: VehicleCategoryInput;
  year: string;
  make: string;
  model: string;
  vin: string;
  licensePlate: string;
  gvwr: string;
  // Mirror of `category` mapped to a string the CostAnalysisStep understands.
  // CostAnalysisStep tags trailers based on a TRAILER_TYPES set; here every
  // category is a truck so we emit `'truck'`.
  type: 'truck';
}

interface VehicleFormValues {
  category: VehicleCategoryInput;
  year: string;
  make: string;
  model: string;
  vin: string;
  licensePlate: string;
  gvwr: string;
}

interface EquipmentListStepProps {
  step: Step;
}

// Shape stored in session.answers — server doesn't persist the local _tempKey.
// We re-hydrate _tempKey on read in initialVehicles.
interface PersistedVehicleEntry extends Omit<VehicleEntry, '_tempKey' | 'category'> {
  _tempKey?: string;
  category: VehicleCategoryInput;
}

interface EquipmentAnswers {
  vehicles?: PersistedVehicleEntry[];
}

interface VehicleDraftState {
  sourceFingerprint: string;
  items: VehicleEntry[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_OPTIONS: SelectionCardOption<VehicleCategory>[] = [
  { id: 'SEMI_TRUCK', icon: <LocalShipping />, title: 'Semi-truck' },
  { id: 'BOX_TRUCK', icon: <LocalShipping />, title: 'Box truck' },
  { id: 'CARGO_VAN', icon: <RvHookup />, title: 'Cargo van' },
  { id: 'PERSONAL_VEHICLE', icon: <DirectionsCar />, title: 'Personal' },
];

const CATEGORY_LABEL: Record<VehicleCategory, string> = {
  SEMI_TRUCK: 'Semi-truck',
  BOX_TRUCK: 'Box truck',
  CARGO_VAN: 'Cargo van',
  PERSONAL_VEHICLE: 'Personal',
};

const EMPTY_VEHICLE_FORM: VehicleFormValues = {
  category: 'SEMI_TRUCK',
  year: '',
  make: '',
  model: '',
  vin: '',
  licensePlate: '',
  gvwr: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Local-only key for React list rendering. Never sent to the server.
const generateTempKey = (): string => crypto.randomUUID();

const gvwrNumberOf = (gvwr: string): number => Number(String(gvwr).replace(/[^\d]/g, '')) || 0;

const LEGACY_CATEGORY_MAP: Record<LegacyVehicleCategory, VehicleCategory> = {
  semi: 'SEMI_TRUCK',
  box: 'BOX_TRUCK',
  cargo_van: 'CARGO_VAN',
  personal: 'PERSONAL_VEHICLE',
};

const normalizeVehicleCategory = (category: VehicleCategoryInput): VehicleCategory =>
  category in LEGACY_CATEGORY_MAP
    ? LEGACY_CATEGORY_MAP[category as LegacyVehicleCategory]
    : category;

const optionalNumber = (value: string): number | undefined => {
  if (value.trim().length === 0) {
    return undefined;
  }
  return Number(value);
};

const vehicleNameOf = (v: VehicleEntry): string => {
  const parts = [v.year, v.make, v.model].filter((p) => p && p.length > 0);
  if (parts.length === 0) {
    return CATEGORY_LABEL[normalizeVehicleCategory(v.category)];
  }
  return parts.join(' ');
};

const vehicleMetaOf = (v: VehicleEntry): string[] => {
  const meta: string[] = [];
  if (v.vin) {
    meta.push(`VIN ${v.vin}`);
  }
  if (v.licensePlate) {
    meta.push(v.licensePlate);
  }
  if (v.gvwr) {
    meta.push(`${v.gvwr} lbs GVWR`);
  }
  return meta;
};

const isVehicleFormComplete = (v: VehicleFormValues): boolean =>
  v.year.trim().length > 0 &&
  v.make.trim().length > 0 &&
  v.model.trim().length > 0 &&
  v.vin.trim().length > 0 &&
  v.licensePlate.trim().length > 0 &&
  v.gvwr.trim().length > 0;

// ---------------------------------------------------------------------------
// VehicleThumb
// ---------------------------------------------------------------------------

const ICON_BY_CATEGORY: Record<VehicleCategory, ReactNode> = {
  SEMI_TRUCK: <LocalShipping />,
  BOX_TRUCK: <LocalShipping />,
  CARGO_VAN: <RvHookup />,
  PERSONAL_VEHICLE: <DirectionsCar />,
};

const VehicleThumb: React.FC<{ category: VehicleCategoryInput }> = ({ category }) => {
  const icon = ICON_BY_CATEGORY[normalizeVehicleCategory(category)];
  return (
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: 1,
        bgcolor: 'rgba(238, 242, 255, 1)',
        color: 'rgba(55, 48, 163, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '& svg': { fontSize: 22 },
      }}
    >
      {icon}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// VehicleForm — inline form for adding or editing a vehicle
// ---------------------------------------------------------------------------

interface VehicleFormProps {
  formNumber: number;
  initialValues: VehicleFormValues;
  onCancel: () => void;
  onSave: (values: VehicleFormValues) => void;
  onSaveAndAddAnother?: (values: VehicleFormValues) => void;
}

const toVehicleFormValues = (record: Record<string, unknown>): VehicleFormValues => ({
  category: (record.category as VehicleCategory | undefined) ?? 'semi',
  year: String(record.year ?? ''),
  make: String(record.make ?? ''),
  model: String(record.model ?? ''),
  vin: String(record.vin ?? ''),
  licensePlate: String(record.licensePlate ?? ''),
  gvwr: String(record.gvwr ?? ''),
});

const VehicleForm: React.FC<VehicleFormProps> = ({
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
      onSubmit={(values) => onSave(toVehicleFormValues(values))}
      enableReinitialize
    >
      {(formik: FormikProps<Record<string, unknown>>) => {
        const current = toVehicleFormValues(formik.values);
        const showDotCallout = gvwrNumberOf(current.gvwr) > 26000;
        const saveDisabled = !isVehicleFormComplete(current);
        return (
          <ListBuilderInlineForm
            number={formNumber}
            title="Add a vehicle"
            onCancel={onCancel}
            onSave={() => onSave(toVehicleFormValues(formik.values))}
            saveLabel="Save vehicle"
            onSaveAndAddAnother={
              onSaveAndAddAnother
                ? () => onSaveAndAddAnother(toVehicleFormValues(formik.values))
                : undefined
            }
            saveAndAddAnotherLabel="Save vehicle & add another"
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
                <FieldGroupLabel>Vehicle category</FieldGroupLabel>
              </Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <SelectionCardGrid<VehicleCategory>
                  options={CATEGORY_OPTIONS}
                  value={current.category}
                  onChange={(id) => void formik.setFieldValue('category', id)}
                  columns={4}
                  size="sm"
                  showRadio={false}
                />
              </Box>

              <Box sx={{ gridColumn: '1 / -1' }}>
                <FieldGroupLabel>Vehicle details</FieldGroupLabel>
              </Box>

              <TextField name="year" label="Year" placeholder="2019" required formik={formik} />
              <TextField name="make" label="Make" placeholder="Kenworth" required formik={formik} />
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField name="model" label="Model" placeholder="T680" required formik={formik} />
              </Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  name="vin"
                  label="VIN"
                  placeholder="1XKAD49X8KJ100973"
                  required
                  formik={formik}
                />
              </Box>
              <TextField
                name="licensePlate"
                label="License plate"
                placeholder="NC-TR4892"
                required
                formik={formik}
              />
              <TextField
                name="gvwr"
                label="GVWR"
                placeholder="80,000"
                endAdornment="lbs"
                required
                formik={formik}
              />
              {showDotCallout ? (
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Callout variant="red">
                    <strong>DOT number required.</strong> Vehicles over 26,001 lbs GVWR must operate
                    under a USDOT number. If you crossed state lines, you also need MC authority.
                  </Callout>
                </Box>
              ) : null}
            </Box>
          </ListBuilderInlineForm>
        );
      }}
    </Formik>
  );
};

// ---------------------------------------------------------------------------
// EquipmentListStep
// ---------------------------------------------------------------------------

const EquipmentListStep: React.FC<EquipmentListStepProps> = ({ step }) => {
  const dispatch = useDispatch();
  const session = useSelector(selectSession);
  const submitStatus = useSelector(selectLoading('submitStep'));

  const persistedFingerprint = useMemo(() => {
    if (!session) {
      return '';
    }
    const answers = (session.answers[step.id] ?? {}) as EquipmentAnswers;
    return JSON.stringify(answers.vehicles ?? []);
  }, [session, step.id]);

  // Read server-persisted vehicles from the session. Each entry has a real
  // `id` (server-assigned UUID). We re-hydrate a local `_tempKey` on top so
  // React can key the list independently of the persisted UUID.
  const initialVehicles = useMemo<VehicleEntry[]>(() => {
    if (!session) {
      return [];
    }
    const answers = (session.answers[step.id] ?? {}) as EquipmentAnswers;
    const sourceVehicles = Array.isArray(answers.vehicles) ? answers.vehicles : [];
    return sourceVehicles.map((v) => ({
      ...v,
      category: normalizeVehicleCategory(v.category),
      _tempKey: v._tempKey ?? generateTempKey(),
    }));
  }, [session, step.id]);

  const [vehicleDraft, setVehicleDraft] = useState<VehicleDraftState>(() => ({
    sourceFingerprint: persistedFingerprint,
    items: initialVehicles,
  }));
  const [formOpen, setFormOpen] = useState<boolean>(false);

  // After a successful submit, session.answers[stepId] is replaced with the
  // server response containing Prisma UUIDs. When that fingerprint changes,
  // read from session until the carrier makes a new local edit.
  const vehicles =
    vehicleDraft.sourceFingerprint === persistedFingerprint ? vehicleDraft.items : initialVehicles;

  const handleAddSaved = (values: VehicleFormValues): void => {
    const next: VehicleEntry = {
      _tempKey: generateTempKey(),
      // `id` deliberately omitted — the server assigns it after submit.
      category: values.category,
      year: values.year,
      make: values.make,
      model: values.model,
      vin: values.vin,
      licensePlate: values.licensePlate,
      gvwr: values.gvwr,
      type: 'truck',
    };
    setVehicleDraft((prev) => {
      const baseItems =
        prev.sourceFingerprint === persistedFingerprint ? prev.items : initialVehicles;
      return { sourceFingerprint: persistedFingerprint, items: [...baseItems, next] };
    });
    setFormOpen(false);
  };

  const handleAddSavedAndAddAnother = (values: VehicleFormValues): void => {
    const next: VehicleEntry = {
      _tempKey: generateTempKey(),
      // `id` deliberately omitted — the server assigns it after submit.
      category: values.category,
      year: values.year,
      make: values.make,
      model: values.model,
      vin: values.vin,
      licensePlate: values.licensePlate,
      gvwr: values.gvwr,
      type: 'truck',
    };
    setVehicleDraft((prev) => {
      const baseItems =
        prev.sourceFingerprint === persistedFingerprint ? prev.items : initialVehicles;
      return { sourceFingerprint: persistedFingerprint, items: [...baseItems, next] };
    });
    setFormOpen(true);
  };

  const handleRemove = (tempKey: string): void => {
    setVehicleDraft((prev) => {
      const baseItems =
        prev.sourceFingerprint === persistedFingerprint ? prev.items : initialVehicles;
      return {
        sourceFingerprint: persistedFingerprint,
        items: baseItems.filter((v) => v._tempKey !== tempKey),
      };
    });
  };

  const handleContinue = useCallback((): void => {
    if (vehicles.length === 0) {
      return;
    }
    // Strip the local-only `_tempKey` from the payload. `id` is sent when the
    // server has already assigned one (edits), undefined for new rows.
    const payloadVehicles = vehicles.map(({ _tempKey: _omit, ...rest }) => ({
      ...rest,
      category: normalizeVehicleCategory(rest.category),
      year: optionalNumber(rest.year),
      gvwr: optionalNumber(rest.gvwr),
    }));
    dispatch(
      carrierPortalV2Actions.submitStep({
        stepId: step.id,
        answers: { vehicles: payloadVehicles },
      }),
    );
  }, [dispatch, vehicles, step.id]);

  const isPending = submitStatus === 'pending';

  useStepNavigation({
    canContinue: vehicles.length > 0 && !isPending,
    onContinue: handleContinue,
    isPending,
  });

  if (!session) {
    return null;
  }

  return (
    <OnboardingCard
      phase="Equipment"
      title={step.title ?? 'Tell us about your vehicles.'}
      subtitle={
        step.subtitle ??
        'Add each truck or trailer you operate — we use this to verify compliance and calculate rates. You can add more later.'
      }
      width="lg"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {vehicles.length === 0 && !formOpen ? (
          <ListBuilderEmptyState
            icon={<LocalShipping />}
            title="No vehicles yet"
            subtitle="Start with the truck you drive most. Add trailers and other vehicles after."
            ctaLabel="Add your first vehicle"
            onCtaClick={() => setFormOpen(true)}
          />
        ) : null}

        {vehicles.length > 0 ? (
          <ListBuilderHeader
            count={vehicles.length === 1 ? '1 vehicle' : `${vehicles.length} vehicles`}
          />
        ) : null}

        {vehicles.map((v) => (
          <ListBuilderItem
            key={v._tempKey}
            thumbnail={<VehicleThumb category={v.category} />}
            name={vehicleNameOf(v)}
            tags={[{ label: CATEGORY_LABEL[normalizeVehicleCategory(v.category)] }]}
            meta={vehicleMetaOf(v)}
            onRemove={() => handleRemove(v._tempKey)}
          />
        ))}

        {formOpen ? (
          <VehicleForm
            formNumber={vehicles.length + 1}
            initialValues={EMPTY_VEHICLE_FORM}
            onCancel={() => setFormOpen(false)}
            onSave={handleAddSaved}
            onSaveAndAddAnother={handleAddSavedAndAddAnother}
          />
        ) : null}

        {!formOpen && vehicles.length > 0 ? (
          <ListBuilderAddMoreButton label="Add another vehicle" onClick={() => setFormOpen(true)} />
        ) : null}
      </Box>
    </OnboardingCard>
  );
};

export default EquipmentListStep;
