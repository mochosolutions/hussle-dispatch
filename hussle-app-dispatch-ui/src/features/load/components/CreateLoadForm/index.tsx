import { forwardRef, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useFormik, FormikProvider } from 'formik';
import { Box, Grid } from '@mui/material';
import type { FormikFieldProps } from '@mocho/ui/forms';
import { TextField } from '@mocho/ui/components';
import { useSelector } from 'store';
import SectionCard from 'components/SectionCard';
import { selectCarrierById } from 'features/carrier/store/selectors/carrierSelectors';
import { useFormHandle } from '../../../../mocho/hooks/useFormHandle';
import type { FormHandle, FormStateChangeCallback } from '../../../../mocho/types/form';
import { loadSchema } from '../../validators/loadSchema';
import type { LoadFormValues } from '../../validators/loadSchema';
import type {
  CreateLoadInput,
  FinancialSummary,
  IntelPrefill,
  LoadTemplate,
  QueuedDocument,
  SelectedDriverInfo,
  StopType,
} from '../../types';
import { LOAD_TYPE_STOP_CONFIG } from '../../constants';
import { stripUiOnlyFields } from '../../utils/stripUiOnlyFields';
import { LoadDetailsSection } from './sections/LoadDetailsSection';
import { StopsSection } from './sections/StopsSection';
import { DriverSection } from './sections/DriverSection';
import { AccessorialsSection } from './sections/AccessorialsSection';
import { DriverEconomicsSection } from './sections/DriverEconomicsSection';
import { DocumentsSection } from './sections/DocumentsSection';
import { NotesSection } from './sections/NotesSection';

interface CreateLoadSubmitPayload {
  data: CreateLoadInput;
  queuedDocuments: QueuedDocument[];
}

interface CreateLoadFormProps {
  onSubmit: (payload: CreateLoadSubmitPayload) => void;
  onStateChange?: FormStateChangeCallback;
  onFinancialsChange?: (financials: FinancialSummary) => void;
  initialLoadType: string;
  template?: LoadTemplate;
  intelPrefill?: IntelPrefill;
}

// ---------------------------------------------------------------------------
// Stop factory
// ---------------------------------------------------------------------------

const EMPTY_STOP = {
  sequence: 0,
  facilityName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  appointmentDate: '',
  appointmentTime: '',
  appointmentNumber: '',
  contactName: '',
  contactPhone: '',
  notes: '',
  commodity: '',
  weight: '',
  pieceCount: '',
  subtype: undefined,
  appointmentType: undefined,
  refNumber: '',
  bolNumber: '',
  gateInstructions: '',
  appointmentRequired: false,
  lumperRequired: false,
  ppeRequired: false,
  commodities: [],
  receivingCommodityIds: [],
};

const buildInitialStops = (loadType: string, intelPrefill?: IntelPrefill) => {
  const config = LOAD_TYPE_STOP_CONFIG[loadType] ?? LOAD_TYPE_STOP_CONFIG.std;
  let pickupIdx = 0;
  let deliveryIdx = 0;

  return config.map((stopConfig, idx) => {
    const isPickup = stopConfig.type === 'PICKUP';
    let city = '';
    let state = '';
    let appointmentDate = '';

    // Apply intel prefill to first pickup/delivery
    if (intelPrefill) {
      if (isPickup && pickupIdx === 0) {
        city = intelPrefill.originCity ?? '';
        state = intelPrefill.originState ?? '';
        appointmentDate = intelPrefill.pickupDate ?? '';
      }
      if (!isPickup && deliveryIdx === 0) {
        city = intelPrefill.destinationCity ?? '';
        state = intelPrefill.destinationState ?? '';
      }
    }

    if (isPickup) {
      pickupIdx += 1;
    } else {
      deliveryIdx += 1;
    }

    return {
      ...EMPTY_STOP,
      type: stopConfig.type as StopType,
      sequence: idx,
      appointmentType: stopConfig.appointmentType,
      city,
      state,
      appointmentDate,
    };
  });
};

const EQUIPMENT_MAP: Record<string, string> = {
  DV: 'DRY_VAN',
  RF: 'REEFER',
  FB: 'FLATBED',
  SD: 'STEP_DECK',
};

const DEFAULT_CARRIER_PERCENT = 80;

const CreateLoadForm = forwardRef<FormHandle, CreateLoadFormProps>(
  (
    { onSubmit, onStateChange, onFinancialsChange, initialLoadType, template, intelPrefill },
    ref,
  ) => {
    const [selectedDriver, setSelectedDriver] = useState<SelectedDriverInfo | null>(null);

    const initialValues: LoadFormValues = useMemo(() => {
      let mappedEquipment: string | undefined;
      if (intelPrefill?.equipmentType) {
        mappedEquipment = EQUIPMENT_MAP[intelPrefill.equipmentType] ?? intelPrefill.equipmentType;
      } else if (initialLoadType === 'po') {
        mappedEquipment = 'POWER_ONLY';
      }

      const stops = buildInitialStops(initialLoadType, intelPrefill);

      const customerRateInit = template?.rate ?? intelPrefill?.rate ?? undefined;
      // Carrier rate is auto-calculated from the carrier's dispatchFeePercent.
      // Pre-compute with default 80% carrier share so formik.dirty is false on mount.
      const carrierRateInit =
        customerRateInit !== undefined && customerRateInit > 0
          ? Math.round(customerRateInit * 0.8)
          : undefined;

      return {
        carrierId: undefined,
        driverId: undefined,
        vehicleId: undefined,
        customerId: undefined,
        contactId: undefined,
        externalRefNumber: template?.brokerRef ?? undefined,
        equipmentType: mappedEquipment,
        isHazmat: false,
        isTarp: false,
        isTeamDriver: false,
        commodity: undefined,
        weight: undefined,
        pieceCount: undefined,
        loadedMiles: intelPrefill?.miles ?? undefined,
        deadheadMiles: undefined,
        totalMiles: intelPrefill?.miles ?? undefined,
        customerRate: customerRateInit,
        carrierRate: carrierRateInit,
        dispatchFee: undefined,
        partnerSplit: undefined,
        ratePerMile: undefined,
        dispatcherNotes: undefined,
        driverInstructions: undefined,
        stops,
        loadType: initialLoadType,
        reeferTempMin: undefined,
        reeferTempMax: undefined,
        reeferPrecool: undefined,
        reeferMode: undefined,
        flatbedLength: undefined,
        flatbedTarpType: undefined,
        flatbedStraps: undefined,
        carrierPercent: 80,
        paymentTerms: undefined,
        queuedDocuments: [],
        accessorials: [],
        // Schema-defaulted fields — must match Yup .default() values so Formik
        // doesn't see a diff on mount and report dirty without user interaction.
        calculatedTotalMiles: null,
        isMilesEstimated: false,
        hazmatDocFile: null,
      };
    }, [initialLoadType, template, intelPrefill]);

    const formik = useFormik<LoadFormValues>({
      initialValues,
      validationSchema: loadSchema,
      validateOnBlur: true,
      validateOnChange: false,
      onSubmit: (values, { setSubmitting }) => {
        onSubmit({
          data: stripUiOnlyFields(values),
          queuedDocuments: (values.queuedDocuments ?? []) as QueuedDocument[],
        });
        setSubmitting(false);
      },
    });

    // Track whether the user has actually changed a meaningful field.
    // Formik reports dirty on mount due to nested stop array defaults,
    // which would block navigation before any real user input.
    // We check specific user-editable fields against their initial values.
    const initialValuesRef = useRef(initialValues);

    useFormHandle({
      ref,
      formik,
      onStateChange,
      getDirty: () => {
        const iv = initialValuesRef.current;
        const cv = formik.values;
        return (
          // Assignment fields
          cv.customerId !== iv.customerId ||
          cv.contactId !== iv.contactId ||
          cv.carrierId !== iv.carrierId ||
          cv.driverId !== iv.driverId ||
          cv.vehicleId !== iv.vehicleId ||
          // Load details
          cv.customerRate !== iv.customerRate ||
          cv.equipmentType !== iv.equipmentType ||
          cv.commodity !== iv.commodity ||
          cv.weight !== iv.weight ||
          cv.pieceCount !== iv.pieceCount ||
          cv.totalMiles !== iv.totalMiles ||
          cv.loadedMiles !== iv.loadedMiles ||
          cv.deadheadMiles !== iv.deadheadMiles ||
          cv.paymentTerms !== iv.paymentTerms ||
          cv.externalRefNumber !== iv.externalRefNumber ||
          // Flags
          cv.isHazmat !== iv.isHazmat ||
          cv.isTarp !== iv.isTarp ||
          cv.isTeamDriver !== iv.isTeamDriver ||
          // Reefer fields
          cv.reeferTempMin !== iv.reeferTempMin ||
          cv.reeferTempMax !== iv.reeferTempMax ||
          cv.reeferPrecool !== iv.reeferPrecool ||
          cv.reeferMode !== iv.reeferMode ||
          // Flatbed fields
          cv.flatbedLength !== iv.flatbedLength ||
          cv.flatbedTarpType !== iv.flatbedTarpType ||
          cv.flatbedStraps !== iv.flatbedStraps ||
          // Notes
          cv.dispatcherNotes !== iv.dispatcherNotes ||
          cv.driverInstructions !== iv.driverInstructions ||
          // Arrays (compare by length — any add/remove counts as dirty)
          (cv.accessorials ?? []).length !== (iv.accessorials ?? []).length ||
          (cv.queuedDocuments ?? []).length !== (iv.queuedDocuments ?? []).length ||
          // Stops (compare count — adding/removing a stop counts as dirty)
          (cv.stops ?? []).length !== (iv.stops ?? []).length ||
          // Files
          cv.hazmatDocFile !== iv.hazmatDocFile
        );
      },
    });

    // Emit financial KPI values to parent for the summary bar
    const carrierId = formik.values.carrierId as string | undefined;
    const selectedCarrier = useSelector(carrierId ? selectCarrierById(carrierId) : () => undefined);

    useEffect(() => {
      if (!onFinancialsChange) {
        return;
      }
      const { values } = formik;
      const custRate = Number(values.customerRate) || 0;
      const dispatchFeePercent = selectedCarrier?.dispatchFeePercent;
      const carrierPct =
        dispatchFeePercent !== undefined && dispatchFeePercent !== null
          ? 100 - dispatchFeePercent
          : DEFAULT_CARRIER_PERCENT;
      const carrierAmt = custRate > 0 ? Math.round((custRate * carrierPct) / 100) : 0;
      const accTotal = (values.accessorials ?? []).reduce(
        (sum, a) => sum + (Number(a.amount) || 0),
        0,
      );
      const apiMiles = values.calculatedTotalMiles ?? 0;
      const miles = values.totalMiles ?? apiMiles;
      const margin = custRate + accTotal - carrierAmt;
      const mPct = custRate > 0 ? (margin / custRate) * 100 : 0;
      const rpm = miles > 0 && custRate > 0 ? custRate / miles : 0;

      onFinancialsChange({
        customerRate: custRate,
        grossMargin: margin,
        marginPct: mPct,
        ratePerMile: rpm,
        totalMiles: miles,
        minBookRate: intelPrefill?.minBookRate ?? null,
        avgCostPerMile: selectedDriver?.cpm ?? null,
        carrierPay: carrierAmt,
      });
    }, [
      formik.values.customerRate,
      formik.values.carrierRate,
      formik.values.totalMiles,
      formik.values.calculatedTotalMiles,
      formik.values.accessorials,
      formik.values.carrierId,
      selectedCarrier?.dispatchFeePercent,
      selectedDriver?.cpm,
      intelPrefill?.minBookRate,
      onFinancialsChange,
    ]);

    // Section completion states for checkmarks
    const sectionCompletion = useMemo(() => {
      const { customerRate, equipmentType, stops, carrierId, driverId } = formik.values;

      const loadDetailsComplete = Number(customerRate) > 0 && Boolean(equipmentType);

      const hasPickupWithFacility = stops.some(
        (s) => s.type === 'PICKUP' && Boolean(s.facilityName),
      );
      const hasDeliveryWithFacility = stops.some(
        (s) => s.type === 'DELIVERY' && Boolean(s.facilityName),
      );
      const stopsComplete = hasPickupWithFacility && hasDeliveryWithFacility;

      const driverComplete = Boolean(carrierId) && Boolean(driverId);

      return { loadDetailsComplete, stopsComplete, driverComplete };
    }, [formik.values]);

    const handleDriverSelected = useCallback((driver: SelectedDriverInfo | null) => {
      setSelectedDriver(driver);
    }, []);

    return (
      <FormikProvider value={formik}>
        <form onSubmit={formik.handleSubmit}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              mx: 'auto',
              px: 4,
              py: 3,
            }}
          >
            <LoadDetailsSection formik={formik} complete={sectionCompletion.loadDetailsComplete} />
            <StopsSection formik={formik} complete={sectionCompletion.stopsComplete} />
            <AccessorialsSection
              formik={formik}
              carrierId={formik.values.carrierId as string | undefined}
            />
            <DriverSection
              formik={formik}
              onDriverSelected={handleDriverSelected}
              selectedDriver={selectedDriver}
              complete={sectionCompletion.driverComplete}
            />
            {selectedDriver && (
              <DriverEconomicsSection formik={formik} selectedDriver={selectedDriver} />
            )}
            {/* Documents */}
            <DocumentsSection formik={formik} />
            {/* Notes */}
            <NotesSection formik={formik} />
            {/* <SectionCard
              title="Notes"
              subtitle="Internal dispatcher notes and instructions for the driver"
            >
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <TextField name="dispatcherNotes" label="Dispatcher Notes" formik={formikProps} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="driverInstructions"
                    label="Driver Instructions"
                    formik={formikProps}
                  />
                </Grid>
              </Grid>
            </SectionCard> */}
          </Box>
        </form>
      </FormikProvider>
    );
  },
);

CreateLoadForm.displayName = 'CreateLoadForm';

export { CreateLoadForm };
