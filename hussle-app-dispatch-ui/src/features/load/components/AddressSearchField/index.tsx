import { useCallback } from 'react';
import { Box, Grid } from '@mui/material';

import { FieldLabel, Meta } from 'components/Typography';
import type { FormikProps } from 'formik';
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
          {stop.facilityName ? (
            <Grid item xs={12}>
              <FieldLabel sx={{ display: 'block', mb: 0.25 }}>
                Facility
              </FieldLabel>
              <Meta sx={{ color: 'text.primary' }}>{stop.facilityName}</Meta>
            </Grid>
          ) : null}
          <Grid item xs={12} md={6}>
            <FieldLabel sx={{ display: 'block', mb: 0.25 }}>
              Address
            </FieldLabel>
            <Meta sx={{ color: 'text.primary' }}>{stop.address || '\u2014'}</Meta>
          </Grid>
          <Grid item xs={12} md={6}>
            <FieldLabel sx={{ display: 'block', mb: 0.25 }}>
              City / State / Zip
            </FieldLabel>
            <Meta sx={{ color: 'text.primary' }}>{cityStateZip || '\u2014'}</Meta>
          </Grid>
        </Grid>
      ) : null}
    </Box>
  );
};

export default AddressSearchField;
