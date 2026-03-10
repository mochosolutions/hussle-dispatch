import React from 'react';
import {
  Box,
  Button,
  Stack,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Formik, Form, useFormikContext } from 'formik';
import { EditDrawer } from 'features/carrier/components/EditDrawer';
import { useDispatch } from 'store';
import { updateLoadRequest } from '../../store/reducers';
import type { LoadDetail, Stop } from '../../types';

const SECTION_LABEL_SX = {
  color: 'text.secondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.6875rem',
  letterSpacing: 0.5,
} as const;

interface LoadRouteDrawerProps {
  load: LoadDetail;
  onClose: () => void;
}

interface StopFormValues {
  type: string;
  facilityName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  appointmentDate: string;
  appointmentTime: string;
  contactName: string;
  contactPhone: string;
  notes: string;
}

interface RouteFormValues {
  stops: StopFormValues[];
}

const mapStopToForm = (stop: Stop): StopFormValues => ({
  type: stop.type,
  facilityName: stop.facilityName ?? '',
  address: stop.address ?? '',
  city: stop.city ?? '',
  state: stop.state ?? '',
  zip: stop.zip ?? '',
  appointmentDate: stop.appointmentDate ?? '',
  appointmentTime: stop.appointmentTime ?? '',
  contactName: stop.contactName ?? '',
  contactPhone: stop.contactPhone ?? '',
  notes: stop.notes ?? '',
});

export const LoadRouteDrawer: React.FC<LoadRouteDrawerProps> = ({ load, onClose }) => {
  const dispatch = useDispatch();

  const initialValues: RouteFormValues = {
    stops: load.stops.map(mapStopToForm),
  };

  const handleSubmit = (values: RouteFormValues) => {
    dispatch(
      updateLoadRequest({
        id: load.id,
        data: {
          stops: values.stops.map((stop, index) => ({
            ...stop,
            sequence: index,
            type: stop.type as 'PICKUP' | 'DELIVERY' | 'STOP_OFF' | 'DROP_HOOK' | 'LIVE_UNLOAD',
          })),
        },
      }),
    );
    onClose();
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit} enableReinitialize>
      <LoadRouteDrawerContent loadNumber={load.loadNumber} onClose={onClose} />
    </Formik>
  );
};

interface LoadRouteDrawerContentProps {
  loadNumber: string;
  onClose: () => void;
}

const LoadRouteDrawerContent: React.FC<LoadRouteDrawerContentProps> = ({ loadNumber, onClose }) => {
  const { values, isSubmitting, isValid, dirty } = useFormikContext<RouteFormValues>();

  const footer = (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
      <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        type="submit"
        form="load-route-form"
        variant="contained"
        disabled={!isValid || !dirty || isSubmitting}
        startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
      >
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </Button>
    </Box>
  );

  return (
    <EditDrawer
      open
      title="Edit Route"
      subtitle={loadNumber}
      onClose={onClose}
      isDirty={dirty}
      footer={footer}
    >
      <Form id="load-route-form">
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
            Stops ({values.stops.length})
          </Typography>
          {values.stops.map((_stop, index) => (
            <Box key={index} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                Stop {index + 1} - {_stop.type}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {_stop.facilityName && `${_stop.facilityName} - `}
                {[_stop.city, _stop.state].filter(Boolean).join(', ')}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Form>
    </EditDrawer>
  );
};
