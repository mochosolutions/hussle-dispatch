import { useCallback } from 'react';
import { Box, Grid } from '@mui/material';

import { FieldLabel, Meta } from 'components/Typography';
import type { FormikProps } from 'formik';
import { AddressField } from '../../../../mocho/components';
import type { AddressSearchResult } from 'features/place/types';
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

  const getSelectionState = useCallback(
    (values: T) => {
      const current = values.stops[stopIndex];
      return {
        display: current ? formatDisplayValue(current) : '',
        hasSelection: Boolean(current?.facilityName || current?.placeId),
      };
    },
    [stopIndex],
  );

  const onResolve = useCallback(
    (selected: AddressSearchResult, f: FormikProps<T>) => {
      if (selected.source === 'SAVED') {
        void f.setFieldValue(`${prefix}.placeId`, selected.id);
        void f.setFieldValue(`${prefix}.facilityName`, selected.name);
        void f.setFieldValue(`${prefix}.address`, selected.address);
        void f.setFieldValue(`${prefix}.city`, selected.city);
        void f.setFieldValue(`${prefix}.state`, selected.state);
        void f.setFieldValue(`${prefix}.zip`, selected.zip);
        void f.setFieldValue(`${prefix}.lat`, selected.lat);
        void f.setFieldValue(`${prefix}.lng`, selected.lng);
        void f.setFieldValue(`${prefix}.contactName`, selected.contactName ?? '');
        void f.setFieldValue(`${prefix}.contactPhone`, selected.contactPhone ?? '');
        if (selected.appointmentRequired) {
          void f.setFieldValue(`${prefix}.appointmentRequired`, true);
          void f.setFieldValue(`${prefix}.schedulingType`, 'APPOINTMENT');
        } else if (selected.is24Hours) {
          void f.setFieldValue(`${prefix}.schedulingType`, 'OPEN');
        }
        if (selected.lumperRequired) {
          void f.setFieldValue(`${prefix}.lumperRequired`, true);
        }
        if (selected.ppeRequired) {
          void f.setFieldValue(`${prefix}.ppeRequired`, true);
        }

        // Facility hours are stored on the Place entity and displayed as read-only context
      } else {
        void f.setFieldValue(`${prefix}.placeId`, '');
        void f.setFieldValue(`${prefix}.facilityName`, selected.name);
        void f.setFieldValue(`${prefix}.address`, selected.address);
        void f.setFieldValue(`${prefix}.city`, selected.city);
        void f.setFieldValue(`${prefix}.state`, selected.state);
        void f.setFieldValue(`${prefix}.zip`, selected.zip);
        void f.setFieldValue(`${prefix}.lat`, selected.lat);
        void f.setFieldValue(`${prefix}.lng`, selected.lng);
      }
    },
    [prefix],
  );

  const onClear = useCallback(
    (f: FormikProps<T>) => {
      void f.setFieldValue(`${prefix}.placeId`, '');
      void f.setFieldValue(`${prefix}.facilityName`, '');
      void f.setFieldValue(`${prefix}.address`, '');
      void f.setFieldValue(`${prefix}.city`, '');
      void f.setFieldValue(`${prefix}.state`, '');
      void f.setFieldValue(`${prefix}.zip`, '');
      void f.setFieldValue(`${prefix}.lat`, null);
      void f.setFieldValue(`${prefix}.lng`, null);
      void f.setFieldValue(`${prefix}.contactName`, '');
      void f.setFieldValue(`${prefix}.contactPhone`, '');
    },
    [prefix],
  );

  const hasSelection = Boolean(stop?.facilityName || stop?.placeId);

  const cityStateZip = stop
    ? [stop.city, stop.state].filter(Boolean).join(', ') + (stop.zip ? ` ${stop.zip}` : '')
    : '';

  return (
    <Box>
      <AddressField<T>
        name={`${prefix}.address`}
        label="Facility / Address"
        mode="facility"
        formik={formik}
        disabled={disabled}
        getSelectionState={getSelectionState}
        onResolve={onResolve}
        onClear={onClear}
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
            <Meta sx={{ color: 'text.primary' }}>{stop.address || '—'}</Meta>
          </Grid>
          <Grid item xs={12} md={6}>
            <FieldLabel sx={{ display: 'block', mb: 0.25 }}>
              City / State / Zip
            </FieldLabel>
            <Meta sx={{ color: 'text.primary' }}>{cityStateZip || '—'}</Meta>
          </Grid>
        </Grid>
      ) : null}
    </Box>
  );
};

export default AddressSearchField;
