import { useCallback, useState } from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import BookmarkBorderOutlined from '@mui/icons-material/BookmarkBorderOutlined';
import type { FormikProps } from 'formik';
import { enqueueSnackbar } from 'notistack';
import { createPlace } from 'utils/api/places/placeApi';
import type { AddressSearchResult } from 'features/place/types';
import { AddressTypeahead } from 'components/AddressTypeahead';
import type { StopsFormShape } from '../../validators/loadSchema';

interface AddressSearchFieldProps<T extends StopsFormShape = StopsFormShape> {
  prefix: string;
  formik: FormikProps<T>;
  disabled?: boolean;
}

const formatDisplayValue = (stop: StopsFormShape['stops'][number]): string => {
  const parts = [stop.address, stop.city, stop.state].filter(Boolean);
  if (stop.zip) {
    parts.push(stop.zip);
  }
  return parts.join(', ') || stop.facilityName || '';
};

export const AddressSearchField = <T extends StopsFormShape = StopsFormShape>({
  prefix,
  formik,
  disabled = false,
}: AddressSearchFieldProps<T>) => {
  const stopIndex = Number(prefix.replace(/^stops\[(\d+)\]$/, '$1'));
  const stop = formik.values.stops[stopIndex];
  const hasSelection = Boolean(stop?.facilityName || stop?.placeId);
  const isExternalSelection = hasSelection && !stop?.placeId;

  const [savingPlace, setSavingPlace] = useState(false);

  const handleSelect = useCallback(
    (selected: AddressSearchResult) => {
      if (selected.source === 'SAVED') {
        void formik.setFieldValue(`${prefix}.placeId`, selected.id);
        void formik.setFieldValue(`${prefix}.facilityName`, selected.name);
        void formik.setFieldValue(`${prefix}.address`, selected.address);
        void formik.setFieldValue(`${prefix}.city`, selected.city);
        void formik.setFieldValue(`${prefix}.state`, selected.state);
        void formik.setFieldValue(`${prefix}.zip`, selected.zip);
        void formik.setFieldValue(`${prefix}.lat`, selected.lat);
        void formik.setFieldValue(`${prefix}.lng`, selected.lng);
        void formik.setFieldValue(`${prefix}.contactName`, selected.contactName ?? '');
        void formik.setFieldValue(`${prefix}.contactPhone`, selected.contactPhone ?? '');
        if (selected.appointmentRequired) {
          void formik.setFieldValue(`${prefix}.appointmentRequired`, true);
          void formik.setFieldValue(`${prefix}.schedulingType`, 'APPOINTMENT');
        } else if (selected.is24Hours) {
          void formik.setFieldValue(`${prefix}.schedulingType`, 'OPEN');
        }
        if (selected.lumperRequired) {
          void formik.setFieldValue(`${prefix}.lumperRequired`, true);
        }
        if (selected.ppeRequired) {
          void formik.setFieldValue(`${prefix}.ppeRequired`, true);
        }

        // Facility hours are stored on the Place entity and displayed as read-only context
      } else {
        void formik.setFieldValue(`${prefix}.placeId`, '');
        void formik.setFieldValue(`${prefix}.facilityName`, selected.name);
        void formik.setFieldValue(`${prefix}.address`, selected.address);
        void formik.setFieldValue(`${prefix}.city`, selected.city);
        void formik.setFieldValue(`${prefix}.state`, selected.state);
        void formik.setFieldValue(`${prefix}.zip`, selected.zip);
        void formik.setFieldValue(`${prefix}.lat`, selected.lat);
        void formik.setFieldValue(`${prefix}.lng`, selected.lng);
      }
    },
    [formik, prefix],
  );

  const handleClear = useCallback(() => {
    void formik.setFieldValue(`${prefix}.placeId`, '');
    void formik.setFieldValue(`${prefix}.facilityName`, '');
    void formik.setFieldValue(`${prefix}.address`, '');
    void formik.setFieldValue(`${prefix}.city`, '');
    void formik.setFieldValue(`${prefix}.state`, '');
    void formik.setFieldValue(`${prefix}.zip`, '');
    void formik.setFieldValue(`${prefix}.lat`, null);
    void formik.setFieldValue(`${prefix}.lng`, null);
    void formik.setFieldValue(`${prefix}.contactName`, '');
    void formik.setFieldValue(`${prefix}.contactPhone`, '');
  }, [formik, prefix]);

  const handleSaveAsPlace = useCallback(async () => {
    if (!stop) {
      return;
    }
    setSavingPlace(true);
    try {
      const place = await createPlace({
        name: stop.facilityName || [stop.address, stop.city, stop.state].filter(Boolean).join(', '),
        address: stop.address || undefined,
        city: stop.city || '',
        state: stop.state || '',
        zip: stop.zip || undefined,
        latitude: stop.lat,
        longitude: stop.lng,
      });
      void formik.setFieldValue(`${prefix}.placeId`, place.id);
      enqueueSnackbar('Place saved successfully', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to save place', { variant: 'error' });
    } finally {
      setSavingPlace(false);
    }
  }, [stop, formik, prefix]);

  const displayValue = stop ? formatDisplayValue(stop) : '';

  const cityStateZip = stop
    ? [stop.city, stop.state].filter(Boolean).join(', ') + (stop.zip ? ` ${stop.zip}` : '')
    : '';

  return (
    <Box>
      <AddressTypeahead
        value={displayValue}
        onSelect={handleSelect}
        onClear={handleClear}
        hasSelection={hasSelection}
        disabled={disabled}
      />

      {hasSelection && stop ? (
        <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
          <Grid item xs={12} md={5}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 0.25 }}
            >
              Address
            </Typography>
            <Typography variant="body2">{stop.address || '\u2014'}</Typography>
          </Grid>
          <Grid item xs={12} md={5}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 0.25 }}
            >
              City / State / Zip
            </Typography>
            <Typography variant="body2">{cityStateZip || '\u2014'}</Typography>
          </Grid>
          {isExternalSelection ? (
            <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                size="small"
                variant="text"
                startIcon={<BookmarkBorderOutlined sx={{ fontSize: 16 }} />}
                disabled={savingPlace}
                onClick={() => void handleSaveAsPlace()}
                onMouseDown={(e) => e.preventDefault()}
                sx={{ textTransform: 'none', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
              >
                {savingPlace ? 'Saving...' : 'Save Place'}
              </Button>
            </Grid>
          ) : null}
        </Grid>
      ) : null}
    </Box>
  );
};

export default AddressSearchField;
