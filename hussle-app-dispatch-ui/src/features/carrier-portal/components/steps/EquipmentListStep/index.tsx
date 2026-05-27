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
import * as Yup from 'yup';
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
// Legacy lowercase values that may exist in old answers JSON. Normalised to
// VehicleCategory once at the read boundary (initialVehicles); all in-memory
// state and downstream consumers see only the canonical uppercase form.
type LegacyVehicleCategory = 'semi' | 'box' | 'cargo_van' | 'personal';

interface VehicleEntry {
  // Local-only key used for React list rendering and local list operations
  // (remove). NEVER sent in the submit payload — the server assigns the real
  // `id` after persistence (US-30).
  _tempKey: string;
  // Server-assigned UUID — present only after a successful submit round-trip.
  // Undefined for newly-added vehicles that haven't been persisted yet.
  id?: string;
  category: VehicleCategory;
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
  category: VehicleCategory;
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
// `category` is widened to `string` because legacy answers may still carry
// lowercase values; `initialVehicles` normalises on read.
interface PersistedVehicleEntry extends Omit<VehicleEntry, '_tempKey' | 'category'> {
  _tempKey?: string;
  category: string;
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

const isLegacyVehicleCategory = (c: string): c is LegacyVehicleCategory =>
  Object.prototype.hasOwnProperty.call(LEGACY_CATEGORY_MAP, c);

const isCanonicalVehicleCategory = (c: string): c is VehicleCategory =>
  c === 'SEMI_TRUCK' || c === 'BOX_TRUCK' || c === 'CARGO_VAN' || c === 'PERSONAL_VEHICLE';

// Read-boundary normaliser: accepts whatever string the server / legacy
// stored data hands us and returns a canonical `VehicleCategory`. Unknown
// values fall back to `SEMI_TRUCK`. Once values pass through this function,
// downstream code can treat `category` as strictly typed.
const normalizeVehicleCategory = (category: string | null | undefined): VehicleCategory => {
  if (typeof category !== 'string') return 'SEMI_TRUCK';
  if (isCanonicalVehicleCategory(category)) return category;
  if (isLegacyVehicleCategory(category)) return LEGACY_CATEGORY_MAP[category];
  return 'SEMI_TRUCK';
};

const optionalNumber = (value: string | number | null | undefined): number | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (value.trim().length === 0) {
    return undefined;
  }
  return Number(value);
};

const vehicleNameOf = (v: VehicleEntry): string => {
  const parts = [v.year, v.make, v.model].filter((p) => p && p.length > 0);
  if (parts.length === 0) {
    return CATEGORY_LABEL[v.category];
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

// Mirrors `equipmentValidator` on the API
// (`hussle-app-dispatch-api/src/carrier-portal/validators/equipmentValidator.ts`).
// 80,000 lbs is the federal highway weight cap; heavier units don't exist on
// public roads legally.
const vehicleFormValidationSchema = Yup.object({
  vin: Yup.string().max(17, 'VIN must be at most 17 characters'),
  licensePlate: Yup.string().max(20, 'License plate must be at most 20 characters'),
  gvwr: Yup.string().test(
    'gvwr-range',
    'GVWR must be between 0 and 80,000 lbs',
    (value) => {
      if (typeof value !== 'string' || value.trim().length === 0) return true;
      const parsed = gvwrNumberOf(value);
      return parsed >= 0 && parsed <= 80000;
    },
  ),
});

// ---------------------------------------------------------------------------
// VehicleThumb
// ---------------------------------------------------------------------------

const ICON_BY_CATEGORY: Record<VehicleCategory, ReactNode> = {
  SEMI_TRUCK: <LocalShipping />,
  BOX_TRUCK: <LocalShipping />,
  CARGO_VAN: <RvHookup />,
  PERSONAL_VEHICLE: <DirectionsCar />,
};

const VehicleThumb: React.FC<{ category: VehicleCategory }> = ({ category }) => {
  const icon = ICON_BY_CATEGORY[category];
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
  title?: string;
  saveLabel?: string;
  onCancel: () => void;
  onSave: (values: VehicleFormValues) => void;
  onSaveAndAddAnother?: (values: VehicleFormValues) => void;
}

const toVehicleFormValues = (record: Record<string, unknown>): VehicleFormValues => ({
  category: normalizeVehicleCategory(typeof record.category === 'string' ? record.category : null),
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
  title = 'Add a vehicle',
  saveLabel = 'Save vehicle',
  onCancel,
  onSave,
  onSaveAndAddAnother,
}) => {
  const formikInitial: Record<string, unknown> = { ...initialValues };
  return (
    <Formik<Record<string, unknown>>
      initialValues={formikInitial}
      onSubmit={(values) => onSave(toVehicleFormValues(values))}
      validationSchema={vehicleFormValidationSchema}
      enableReinitialize
    >
      {(formik: FormikProps<Record<string, unknown>>) => {
        const current = toVehicleFormValues(formik.values);
        const showDotCallout = gvwrNumberOf(current.gvwr) > 26000;
        const hasValidationErrors = Object.keys(formik.errors).length > 0;
        const saveDisabled = !isVehicleFormComplete(current) || hasValidationErrors;
        return (
          <ListBuilderInlineForm
            number={formNumber}
            title={title}
            onCancel={onCancel}
            onSave={() => onSave(toVehicleFormValues(formik.values))}
            saveLabel={saveLabel}
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
  //
  // Two sources, in priority order:
  //  1. `session.answers[step.id].vehicles` — last-submitted draft (carries
  //     mid-edit state and is the primary source within a session).
  //  2. `session.vehicles` — typed Vehicle table projection (durable across
  //     sessions; primary source on fresh page load when answers is empty).
  const initialVehicles = useMemo<VehicleEntry[]>(() => {
    if (!session) {
      return [];
    }
    const answers = (session.answers[step.id] ?? {}) as EquipmentAnswers;
    const sourceVehicles = Array.isArray(answers.vehicles) ? answers.vehicles : [];
    if (sourceVehicles.length > 0) {
      return sourceVehicles.map((v) => ({
        ...v,
        category: normalizeVehicleCategory(v.category),
        _tempKey: v._tempKey ?? generateTempKey(),
      }));
    }
    const projected = session.vehicles ?? [];
    return projected.map((v) => ({
      _tempKey: generateTempKey(),
      id: v.id,
      category: normalizeVehicleCategory(v.category),
      year: v.year === null ? '' : String(v.year),
      make: v.make ?? '',
      model: v.model ?? '',
      vin: v.vin ?? '',
      licensePlate: v.licensePlate ?? '',
      gvwr: v.gvwr === null ? '' : String(v.gvwr),
      type: 'truck',
    }));
  }, [session, step.id]);

  const [vehicleDraft, setVehicleDraft] = useState<VehicleDraftState>(() => ({
    sourceFingerprint: persistedFingerprint,
    items: initialVehicles,
  }));
  // `closed` — no form rendered. `add` — blank form for a new vehicle.
  // `edit:<_tempKey>` — form pre-filled with that vehicle's current values.
  type FormMode = { kind: 'closed' } | { kind: 'add' } | { kind: 'edit'; tempKey: string };
  const [formMode, setFormMode] = useState<FormMode>({ kind: 'closed' });

  // After a successful submit, session.answers[stepId] is replaced with the
  // server response containing Prisma UUIDs. When that fingerprint changes,
  // read from session until the carrier makes a new local edit.
  const vehicles =
    vehicleDraft.sourceFingerprint === persistedFingerprint ? vehicleDraft.items : initialVehicles;

  const buildNewVehicle = (values: VehicleFormValues): VehicleEntry => ({
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
  });

  const handleAddSaved = (values: VehicleFormValues): void => {
    const next = buildNewVehicle(values);
    setVehicleDraft((prev) => {
      const baseItems =
        prev.sourceFingerprint === persistedFingerprint ? prev.items : initialVehicles;
      return { sourceFingerprint: persistedFingerprint, items: [...baseItems, next] };
    });
    setFormMode({ kind: 'closed' });
  };

  const handleAddSavedAndAddAnother = (values: VehicleFormValues): void => {
    const next = buildNewVehicle(values);
    setVehicleDraft((prev) => {
      const baseItems =
        prev.sourceFingerprint === persistedFingerprint ? prev.items : initialVehicles;
      return { sourceFingerprint: persistedFingerprint, items: [...baseItems, next] };
    });
    setFormMode({ kind: 'add' });
  };

  // Replace an existing vehicle row in place. Preserves `_tempKey` and the
  // server-assigned `id` (when present) so the saga's upsert path can match
  // the edited row to an existing Vehicle record.
  const handleEditSaved = (tempKey: string, values: VehicleFormValues): void => {
    setVehicleDraft((prev) => {
      const baseItems =
        prev.sourceFingerprint === persistedFingerprint ? prev.items : initialVehicles;
      return {
        sourceFingerprint: persistedFingerprint,
        items: baseItems.map((v) =>
          v._tempKey === tempKey
            ? {
                ...v,
                category: values.category,
                year: values.year,
                make: values.make,
                model: values.model,
                vin: values.vin,
                licensePlate: values.licensePlate,
                gvwr: values.gvwr,
              }
            : v,
        ),
      };
    });
    setFormMode({ kind: 'closed' });
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
    // If the user was editing the row being removed, close the form.
    if (formMode.kind === 'edit' && formMode.tempKey === tempKey) {
      setFormMode({ kind: 'closed' });
    }
  };

  const editingVehicle =
    formMode.kind === 'edit'
      ? vehicles.find((v) => v._tempKey === formMode.tempKey) ?? null
      : null;

  const vehicleToFormValues = (v: VehicleEntry): VehicleFormValues => ({
    category: v.category,
    year: v.year,
    make: v.make,
    model: v.model,
    vin: v.vin,
    licensePlate: v.licensePlate,
    gvwr: v.gvwr,
  });

  const handleContinue = useCallback((): void => {
    if (vehicles.length === 0) {
      return;
    }
    // Strip the local-only `_tempKey` from the payload. `id` is sent when the
    // server has already assigned one (edits), undefined for new rows.
    // `category` is already canonical (`VehicleCategory`) by the time the
    // vehicle lands in state — `initialVehicles` and the inline form both
    // route through `normalizeVehicleCategory` on read.
    const payloadVehicles = vehicles.map(({ _tempKey: _omit, ...rest }) => ({
      ...rest,
      year: optionalNumber(rest.year),
      gvwr: optionalNumber(rest.gvwr),
    }));
    dispatch(
      carrierPortalV2Actions.saveEquipment({
        vehicles: payloadVehicles,
      }),
    );
  }, [dispatch, vehicles]);

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
        {vehicles.length === 0 && formMode.kind === 'closed' ? (
          <ListBuilderEmptyState
            icon={<LocalShipping />}
            title="No vehicles yet"
            subtitle="Start with the truck you drive most. Add trailers and other vehicles after."
            ctaLabel="Add your first vehicle"
            onCtaClick={() => setFormMode({ kind: 'add' })}
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
            tags={[{ label: CATEGORY_LABEL[v.category] }]}
            meta={vehicleMetaOf(v)}
            onEdit={() => setFormMode({ kind: 'edit', tempKey: v._tempKey })}
            onRemove={() => handleRemove(v._tempKey)}
          />
        ))}

        {formMode.kind === 'add' ? (
          <VehicleForm
            formNumber={vehicles.length + 1}
            initialValues={EMPTY_VEHICLE_FORM}
            onCancel={() => setFormMode({ kind: 'closed' })}
            onSave={handleAddSaved}
            onSaveAndAddAnother={handleAddSavedAndAddAnother}
          />
        ) : null}

        {formMode.kind === 'edit' && editingVehicle ? (
          <VehicleForm
            formNumber={vehicles.findIndex((v) => v._tempKey === editingVehicle._tempKey) + 1}
            initialValues={vehicleToFormValues(editingVehicle)}
            title="Edit vehicle"
            saveLabel="Save changes"
            onCancel={() => setFormMode({ kind: 'closed' })}
            onSave={(values) => handleEditSaved(editingVehicle._tempKey, values)}
          />
        ) : null}

        {formMode.kind === 'closed' && vehicles.length > 0 ? (
          <ListBuilderAddMoreButton
            label="Add another vehicle"
            onClick={() => setFormMode({ kind: 'add' })}
          />
        ) : null}
      </Box>
    </OnboardingCard>
  );
};

export default EquipmentListStep;
