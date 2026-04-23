import { useCallback, useMemo, useRef } from 'react';
import { Box, Button, Chip, CircularProgress, Stack, Typography, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { FieldArray } from 'formik';
import type { FormikProps } from 'formik';
import SectionCard from 'components/SectionCard';
import { MainCard } from '@mocho/ui/components';
import type { LoadFormValues } from '../../../../../validators/loadSchema';
import type { StopType } from '../../../../../types';
import { StopFormCard } from 'features/load/components/StopFormCard';
import { MapView } from '../../../MapView';
import { useRouteDistance } from './useRouteDistance';

interface StopsSectionProps {
  formik: FormikProps<LoadFormValues>;
  complete?: boolean;
}

// ---------------------------------------------------------------------------
// Leg connector between stops
// ---------------------------------------------------------------------------

interface LegConnectorProps {
  miles: number | null;
  isEstimated?: boolean;
}

const getLegChipColor = (
  miles: number | null,
  isEstimated: boolean,
): 'warning' | 'primary' | 'default' => {
  if (miles === null) {
    return 'default';
  }
  return isEstimated ? 'warning' : 'primary';
};

const getLegChipVariant = (miles: number | null, isEstimated: boolean): 'outlined' | 'filled' => {
  if (miles === null) {
    return 'outlined';
  }
  return isEstimated ? 'outlined' : 'filled';
};

const LegConnector: React.FC<LegConnectorProps> = ({ miles, isEstimated = false }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 0.5,
    }}
  >
    {/* <Box
      sx={{
        borderLeft: '2px dashed',
        borderColor: 'divider',
        height: 24,
        position: 'relative',
      }}
    /> */}
    <Chip
      size="small"
      label={miles !== null ? `${isEstimated ? '~' : ''}${miles.toLocaleString()} mi` : '\u2014 mi'}
      color={getLegChipColor(miles, isEstimated)}
      variant={getLegChipVariant(miles, isEstimated)}
      sx={{
        // position: 'absolute',
        fontSize: 11,
        pt: 1,
        pb: 1,
      }}
    />
  </Box>
);

// ---------------------------------------------------------------------------
// Empty stop factory
// ---------------------------------------------------------------------------

const EMPTY_STOP = {
  type: 'PICKUP' as StopType,
  sequence: 0,
  facilityName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  lat: null as number | null,
  lng: null as number | null,
  appointmentDate: '',
  appointmentTime: '',
  appointmentNumber: '',
  contactName: '',
  contactPhone: '',
  notes: '',
  commodity: '',
  weight: '',
  pieceCount: '',
  isHazmat: false,
  isTarp: false,
  isTempControlled: false,
  schedulingType: 'APPOINTMENT',
  callByTime: '',
  trailerNumber: '',
  yardLocation: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const StopsSection: React.FC<StopsSectionProps> = ({ formik, complete }) => {
  const stops = formik.values.stops;
  const {
    legMiles,
    totalMiles,
    isLoading: isRouteLoading,
    legIsEstimated,
    isEstimated,
  } = useRouteDistance(formik);
  const displayTotalMiles = formik.values.loadedMiles ?? totalMiles;
  const hazmatFileRef = useRef<HTMLInputElement>(null);

  // Track which indices are the first pickup and first delivery for auto-expand
  const firstPickupIdx = useMemo(() => stops.findIndex((s) => s.type === 'PICKUP'), [stops]);
  const firstDeliveryIdx = useMemo(() => stops.findIndex((s) => s.type === 'DELIVERY'), [stops]);

  // Check if any pickup stop has hazmat
  const hasHazmat = useMemo(
    () => stops.some((stop) => stop.type === 'PICKUP' && stop.isHazmat),
    [stops],
  );

  const handleAddStop = useCallback(
    (type: StopType, arrayHelpers: { push: (val: unknown) => void }) => {
      arrayHelpers.push({
        ...EMPTY_STOP,
        type,
        sequence: stops.length,
      });
    },
    [stops.length],
  );

  return (
    <Stack spacing={0}>
      <FieldArray name="stops">
        {(arrayHelpers) => (
          <SectionCard
            title="Stops"
            subheader="Add pickup and delivery locations with appointment times"
            actions={
              <Stack alignItems="center" direction="row" spacing={1}>
                {complete && <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />}
                <Chip label={stops.length} size="small" />
                {isRouteLoading && <CircularProgress size={14} />}
                {displayTotalMiles > 0 && !isRouteLoading && (
                  <>
                    <Typography color="text.secondary" variant="caption">
                      {`${displayTotalMiles.toLocaleString()} total miles`}
                    </Typography>
                    {isEstimated && formik.values.loadedMiles === null && (
                      <Chip
                        label="EST"
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{ fontSize: 10, height: 18 }}
                      />
                    )}
                  </>
                )}
              </Stack>
            }
          >
            <Stack spacing={0}>
              {/* Route map */}

              <Grid container spacing={2} sx={{ mb: 1 }}>
                <Grid item xs={6} sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Stack spacing={0}>
                    {stops.map((stop, idx) => (
                      <Box key={idx}>
                        {idx > 0 && (
                          <LegConnector miles={legMiles[idx]} isEstimated={legIsEstimated[idx]} />
                        )}
                        <StopFormCard
                          index={idx}
                          prefix={`stops[${idx}]`}
                          formik={formik}
                          canRemove={stops.length > 2}
                          onRemove={() => arrayHelpers.remove(idx)}
                          defaultExpanded={idx === firstPickupIdx || idx === firstDeliveryIdx}
                        />
                      </Box>
                    ))}
                  </Stack>

                  {/* Add stop buttons */}
                  <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1} sx={{ mt: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddStop('PICKUP', arrayHelpers)}
                    >
                      Add Pickup
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="success"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddStop('DELIVERY', arrayHelpers)}
                    >
                      Add Delivery
                    </Button>
                  </Stack>
                </Grid>

                <Grid item xs={6}>
                  <Box sx={{ position: 'sticky', top: 16 }}>
                    <MapView stops={formik.values.stops} height={500} />
                  </Box>
                </Grid>
              </Grid>

              {/* Stop cards with leg connectors */}
            </Stack>
          </SectionCard>
        )}
      </FieldArray>

      {hasHazmat && (
        <MainCard sx={{ mt: 2 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <WarningAmberIcon sx={{ color: 'warning.main', fontSize: 20 }} />
              <Chip
                label="Required \u2014 hazmat detected"
                size="small"
                color="warning"
                sx={{ fontWeight: 600 }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Hazmat Documentation
            </Typography>
            <Box
              onClick={() => hazmatFileRef.current?.click()}
              sx={{
                border: '2px dashed',
                borderColor: formik.values.hazmatDocFile ? 'success.main' : 'divider',
                borderRadius: 1,
                p: 2,
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: formik.values.hazmatDocFile ? 'success.50' : 'transparent',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <input
                ref={hazmatFileRef}
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void formik.setFieldValue('hazmatDocFile', file);
                  }
                }}
              />
              {formik.values.hazmatDocFile ? (
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                  <CheckCircleIcon sx={{ color: 'success.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formik.values.hazmatDocFile instanceof File
                      ? formik.values.hazmatDocFile.name
                      : 'Document'}
                  </Typography>
                  <Button
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      void formik.setFieldValue('hazmatDocFile', undefined);
                    }}
                  >
                    Remove
                  </Button>
                </Stack>
              ) : (
                <Stack alignItems="center" spacing={0.5}>
                  <UploadFileIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Attach hazmat documents
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    SDS, placard info, or shipping papers
                  </Typography>
                </Stack>
              )}
            </Box>
          </Stack>
        </MainCard>
      )}
    </Stack>
  );
};
