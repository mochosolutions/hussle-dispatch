import { forwardRef, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useFormik, FormikProvider } from 'formik';
import type { FormikProps } from 'formik';
import {
  Box,
  Card,
  Chip,
  Grid,
  IconButton,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ScaleOutlinedIcon from '@mui/icons-material/ScaleOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import type { FormikFieldProps } from '@mocho/ui/forms';
import { TextField } from '@mocho/ui/components';
import { useSelector } from 'store';
import SectionCard from 'components/SectionCard';
import type { DocumentType } from 'features/documents/types';
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
  AccessorialChargeInput,
} from '../../types';
import { DOC_TYPE_CONFIG } from 'features/documents/constants';
import { CREATE_LOAD_DOC_CARD_CONFIG, LOAD_TYPE_STOP_CONFIG } from '../../constants';
import { stripUiOnlyFields } from '../../utils/stripUiOnlyFields';
import { LoadDetailsSection } from '../LoadDetailsSection';
import { StopsSection } from '../StopsSection';
import { DriverSection } from '../DriverSection';
import { AccessorialsSection } from '../AccessorialsSection';
import { DriverEconomicsSection } from '../DriverEconomicsSection';

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

const buildInitialStops = (
  loadType: string,
  intelPrefill?: IntelPrefill,
) => {
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Documents inline section
// ---------------------------------------------------------------------------

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${String(Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const DOC_TYPE_ICONS: Record<string, React.ReactNode> = {
  BROKER_RATE_CON: <DescriptionOutlinedIcon sx={{ fontSize: 24, color: 'primary.main' }} />,
  BOL_UNSIGNED: <InsertDriveFileOutlinedIcon sx={{ fontSize: 24, color: 'primary.main' }} />,
  HAZMAT: <WarningAmberOutlinedIcon sx={{ fontSize: 24, color: 'warning.main' }} />,
  LOA: <DescriptionOutlinedIcon sx={{ fontSize: 24, color: 'primary.main' }} />,
  LUMPER_RECEIPT: <ReceiptLongOutlinedIcon sx={{ fontSize: 24, color: 'primary.main' }} />,
  SCALE_TICKET: <ScaleOutlinedIcon sx={{ fontSize: 24, color: 'primary.main' }} />,
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const DocumentsSection: React.FC<{ formik: FormikProps<LoadFormValues> }> = ({ formik }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const queuedDocuments = useMemo(
    () => (formik.values.queuedDocuments ?? []) as QueuedDocument[],
    [formik.values.queuedDocuments],
  );

  const docCount = queuedDocuments.length;

  const handleAddFile = useCallback(
    (file: File) => {
      if (!selectedType) return;
      if (file.size > MAX_FILE_SIZE) return;

      const config = DOC_TYPE_CONFIG[selectedType];
      let updated: QueuedDocument[];

      if (config.onePer) {
        // Replace existing doc of this type
        updated = queuedDocuments.filter((d) => d.documentType !== selectedType);
      } else {
        updated = [...queuedDocuments];
      }

      const newDoc: QueuedDocument = {
        clientId: crypto.randomUUID(),
        file,
        documentType: selectedType,
      };
      updated = [...updated, newDoc];

      void formik.setFieldValue('queuedDocuments', updated);
      setIsPickerOpen(false);
      setSelectedType(null);
      setIsDragOver(false);
    },
    [formik, queuedDocuments, selectedType],
  );

  const handleRemove = useCallback(
    (clientId: string) => {
      void formik.setFieldValue(
        'queuedDocuments',
        queuedDocuments.filter((d) => d.clientId !== clientId),
      );
    },
    [formik, queuedDocuments],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files[0];
      if (file) {
        handleAddFile(file);
      }
    },
    [handleAddFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleAddFile(file);
      }
      e.target.value = '';
    },
    [handleAddFile],
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleClosePicker = useCallback(() => {
    setIsPickerOpen(false);
    setSelectedType(null);
    setIsDragOver(false);
  }, []);

  const handleSelectType = useCallback((type: DocumentType) => {
    setSelectedType((prev) => (prev === type ? null : type));
  }, []);

  const selectedConfig = selectedType
    ? CREATE_LOAD_DOC_CARD_CONFIG.find((c) => c.type === selectedType)
    : null;

  return (
    <SectionCard
      title="Load Documents"
      subtitle="Attach rate confirmation, BOL, or other documents"
      actions={
        <Typography variant="body2" color="text.secondary">
          {docCount} document{docCount !== 1 ? 's' : ''}
        </Typography>
      }
    >
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Attach documents at load creation. BOL, weight tickets and POD can be added once the load
          is in progress.
        </Typography>

        {/* Queued document rows */}
        {queuedDocuments.map((doc) => {
          const cardConfig = CREATE_LOAD_DOC_CARD_CONFIG.find((c) => c.type === doc.documentType);
          return (
            <Stack
              key={doc.clientId}
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{
                px: 1.5,
                py: 1,
                borderRadius: 1,
                backgroundColor: 'action.hover',
              }}
            >
              <InsertDriveFileOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Chip
                label={cardConfig?.shortLabel ?? doc.documentType}
                size="small"
                variant="outlined"
                color="primary"
              />
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {doc.file.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                {formatFileSize(doc.file.size)}
              </Typography>
              <IconButton
                size="small"
                aria-label={`Remove ${doc.file.name}`}
                onClick={() => handleRemove(doc.clientId)}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
          );
        })}

        {/* Type picker panel */}
        {isPickerOpen && (
          <Box
            sx={{
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
              borderRadius: 2,
              border: 1,
              borderColor: (theme) => alpha(theme.palette.primary.main, 0.12),
              p: 2.5,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                Step 1 — Select document type
              </Typography>
              <IconButton size="small" onClick={handleClosePicker} aria-label="Close document picker">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>

            <Grid container spacing={1.5}>
              {CREATE_LOAD_DOC_CARD_CONFIG.map((config) => {
                const isSelected = selectedType === config.type;
                const docTypeInfo = DOC_TYPE_CONFIG[config.type];
                const hasExisting = queuedDocuments.some((d) => d.documentType === config.type);

                return (
                  <Grid item xs={6} key={config.type}>
                    <Card
                      variant="outlined"
                      onClick={() => handleSelectType(config.type)}
                      sx={{
                        cursor: 'pointer',
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        borderWidth: isSelected ? 2 : 1,
                        backgroundColor: isSelected ? 'primary.50' : 'background.paper',
                        transition: 'all 0.15s',
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                    >
                      <Box sx={{ px: 2, py: 1.5 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                          {DOC_TYPE_ICONS[config.type] ?? (
                            <DescriptionOutlinedIcon sx={{ fontSize: 24, color: 'primary.main' }} />
                          )}
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {config.shortLabel}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {config.description}
                        </Typography>
                        <Stack direction="row" spacing={0.75} sx={{ mt: 0.75 }}>
                          {!docTypeInfo.onePer && (
                            <Chip label="Multi" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.675rem' }} />
                          )}
                          {docTypeInfo.onePer && hasExisting && (
                            <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 500 }}>
                              Replace
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* Drop zone (when type selected) */}
            {selectedType && selectedConfig && (
              <Box
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBrowseClick}
                role="button"
                tabIndex={0}
                aria-label={`Upload ${selectedConfig.shortLabel} document`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleBrowseClick();
                  }
                }}
                sx={{
                  mt: 2,
                  border: '2px dashed',
                  borderColor: isDragOver ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: isDragOver
                    ? (theme) => alpha(theme.palette.primary.main, 0.06)
                    : 'background.paper',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: 'primary.light',
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.02),
                  },
                }}
              >
                <FolderOpenIcon sx={{ fontSize: 36, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Drop {selectedConfig.shortLabel} here or browse files
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  PDF or JPG / PNG · Max 20MB
                </Typography>
              </Box>
            )}

            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".pdf,image/jpeg,image/png"
              onChange={handleInputChange}
            />
          </Box>
        )}

        {/* "Add document" trigger */}
        {!isPickerOpen && (
          <Box
            onClick={() => setIsPickerOpen(true)}
            role="button"
            tabIndex={0}
            aria-label="Add document"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsPickerOpen(true);
              }
            }}
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              p: 2.5,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'primary.light',
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.02),
              },
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
              <AddIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                Add document
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              PDF or image · Select type then upload
            </Typography>
          </Box>
        )}
      </Stack>
    </SectionCard>
  );
};

const EQUIPMENT_MAP: Record<string, string> = {
  DV: 'DRY_VAN',
  RF: 'REEFER',
  FB: 'FLATBED',
  SD: 'STEP_DECK',
};

const DEFAULT_CARRIER_PERCENT = 80;

const CreateLoadForm = forwardRef<FormHandle, CreateLoadFormProps>(
  ({ onSubmit, onStateChange, onFinancialsChange, initialLoadType, template, intelPrefill }, ref) => {
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
    const selectedCarrier = useSelector(
      carrierId ? selectCarrierById(carrierId) : () => undefined,
    );

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

    const formikProps: FormikFieldProps<Record<string, unknown>> = {
      values: formik.values as unknown as Record<string, unknown>,
      errors: formik.errors as unknown as FormikFieldProps<Record<string, unknown>>['errors'],
      touched: formik.touched as unknown as FormikFieldProps<Record<string, unknown>>['touched'],
      handleChange: formik.handleChange,
      handleBlur: formik.handleBlur,
      setFieldValue: formik.setFieldValue,
    };

    // Section completion states for checkmarks
    const sectionCompletion = useMemo(() => {
      const { customerRate, equipmentType, stops, carrierId, driverId } = formik.values;

      const loadDetailsComplete =
        Number(customerRate) > 0 && Boolean(equipmentType);

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
            <AccessorialsSection formik={formik} carrierId={formik.values.carrierId as string | undefined} />
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
            <SectionCard title="Notes" subtitle="Internal dispatcher notes and instructions for the driver">
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="dispatcherNotes"
                    label="Dispatcher Notes"
                    formik={formikProps}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="driverInstructions"
                    label="Driver Instructions"
                    formik={formikProps}
                  />
                </Grid>
              </Grid>
            </SectionCard>
          </Box>
        </form>
      </FormikProvider>
    );
  },
);

CreateLoadForm.displayName = 'CreateLoadForm';

export { CreateLoadForm };
