import { useMemo, useCallback } from 'react';
import { Button, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Formik, FieldArray } from 'formik';
import type { FormikProps } from 'formik';
import { EditDrawer, DrawerSection } from 'components/EditDrawer';
import { useDispatch } from 'store';
import { updateLoadRequest } from '../../store/reducers';
import type { LoadDetail, Stop, StopType, StopInput } from '../../types';
import type { StopsFormShape } from '../../validators/loadSchema';
import { StopFormCard } from '../StopFormCard';

// ---------------------------------------------------------------------------
// Form values type — matches the shape StopFormCard expects
// ---------------------------------------------------------------------------

type StopFormValue = StopsFormShape['stops'][number];

type RouteFormValues = StopsFormShape;

// ---------------------------------------------------------------------------
// Empty stop template
// ---------------------------------------------------------------------------

const createEmptyStop = (type: StopType, sequence: number): StopFormValue => ({
  type,
  sequence,
  facilityName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  lat: null,
  lng: null,
  appointmentDate: '',
  appointmentTime: '',
  appointmentNumber: '',
  contactName: '',
  contactPhone: '',
  commodity: '',
  weight: '',
  pieceCount: '',
  isHazmat: false,
  isTarp: false,
  isTempControlled: false,
  notes: '',
  schedulingType: 'APPOINTMENT',
  facilityOpenTime: '',
  facilityCloseTime: '',
  callByTime: '',
  trailerNumber: '',
  yardLocation: '',
  facilityHoursData: null,
});

// ---------------------------------------------------------------------------
// Map API Stop entity to form stop value
// ---------------------------------------------------------------------------

const splitAppointmentStart = (
  isoStr: string | null,
): { date: string; time: string } => {
  if (!isoStr) return { date: '', time: '' };
  const dateOnly = isoStr.includes('T') ? isoStr.split('T')[0] : isoStr;
  const timePart = isoStr.includes('T') ? isoStr.split('T')[1]?.split('.')[0] ?? '' : '';
  return { date: dateOnly, time: timePart };
};

const mapStopToFormValue = (stop: Stop, index: number): StopFormValue => {
  const { date, time } = splitAppointmentStart(stop.appointmentStart);
  return {
    type: stop.type,
    sequence: index,
    contactId: stop.contactId ?? undefined,
    placeId: stop.placeId ?? undefined,
    facilityName: stop.facilityName ?? '',
    address: stop.address ?? '',
    city: stop.city ?? '',
    state: stop.state ?? '',
    zip: stop.zip ?? '',
    lat: null,
    lng: null,
    appointmentDate: date,
    appointmentTime: time,
    appointmentNumber: stop.appointmentNumber ?? '',
    contactName: stop.contactName ?? '',
    contactPhone: stop.contactPhone ?? '',
    commodity: stop.commodity ?? '',
    weight: stop.weight !== null ? String(stop.weight) : '',
    pieceCount: stop.pieceCount !== null ? String(stop.pieceCount) : '',
    isHazmat: stop.isHazmat ?? false,
    isTarp: stop.isTarp ?? false,
    isTempControlled: stop.isTempControlled ?? false,
    notes: stop.notes ?? '',
    schedulingType: stop.schedulingType ?? 'APPOINTMENT',
    facilityOpenTime: stop.facilityOpenTime ?? '',
    facilityCloseTime: stop.facilityCloseTime ?? '',
    callByTime: stop.callByTime ?? '',
    trailerNumber: stop.trailerNumber ?? '',
    yardLocation: stop.yardLocation ?? '',
    facilityHoursData: null,
  };
};

// ---------------------------------------------------------------------------
// Map form stop value back to API StopInput
// ---------------------------------------------------------------------------

const combineAppointmentStart = (
  date: string | undefined,
  time: string | undefined,
): string | undefined => {
  if (!date) return undefined;
  if (date && time) return `${date}T${time}`;
  return date;
};

const mapFormValueToStopInput = (stop: StopFormValue, index: number): StopInput => {
  const type = stop.schedulingType ?? 'APPOINTMENT';
  const includeTime = type === 'APPOINTMENT' || type === 'NOTIFICATION';
  return {
    type: stop.type,
    sequence: index,
    contactId: stop.contactId ?? undefined,
    placeId: stop.placeId ?? undefined,
    facilityName: stop.facilityName || undefined,
    address: stop.address || undefined,
    city: stop.city || undefined,
    state: stop.state || undefined,
    zip: stop.zip || undefined,
    schedulingType: type,
    appointmentStart: includeTime
      ? combineAppointmentStart(stop.appointmentDate, stop.appointmentTime)
      : (stop.appointmentDate || undefined),
    appointmentNumber: type === 'APPOINTMENT' ? (stop.appointmentNumber || undefined) : undefined,
    contactName: stop.contactName || undefined,
    contactPhone: stop.contactPhone || undefined,
    commodity: stop.commodity || undefined,
    weight: stop.weight ? Number(stop.weight) : undefined,
    pieceCount: stop.pieceCount ? Number(stop.pieceCount) : undefined,
    isHazmat: stop.isHazmat ?? false,
    isTarp: stop.isTarp ?? false,
    isTempControlled: stop.isTempControlled ?? false,
    notes: stop.notes || undefined,
    facilityOpenTime: (type === 'FCFS' || type === 'OPEN') ? (stop.facilityOpenTime || undefined) : undefined,
    facilityCloseTime: (type === 'FCFS' || type === 'OPEN') ? (stop.facilityCloseTime || undefined) : undefined,
    callByTime: type === 'NOTIFICATION' ? (stop.callByTime || undefined) : undefined,
    trailerNumber: type === 'DROP_HOOK' ? (stop.trailerNumber || undefined) : undefined,
    yardLocation: type === 'DROP_HOOK' ? (stop.yardLocation || undefined) : undefined,
  };
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LoadRouteDrawerProps {
  load: LoadDetail;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const LoadRouteDrawer: React.FC<LoadRouteDrawerProps> = ({ load, onClose }) => {
  const dispatch = useDispatch();

  const sortedStops = useMemo(
    () => [...(load.route.stops ?? [])].sort((a, b) => a.sequence - b.sequence),
    [load.route.stops],
  );

  const initialValues: RouteFormValues = useMemo(
    () => ({
      stops: sortedStops.map((stop, idx) => mapStopToFormValue(stop, idx)),
    }),
    [sortedStops],
  );

  const handleSubmit = useCallback(
    (values: RouteFormValues) => {
      const stops = values.stops.map((stop, idx) => mapFormValueToStopInput(stop, idx));
      dispatch(updateLoadRequest({ id: load.id, data: { stops } }));
      onClose();
    },
    [dispatch, load.id, onClose],
  );

  return (
    <Formik<RouteFormValues>
      initialValues={initialValues}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {(formik: FormikProps<RouteFormValues>) => (
        <RouteDrawerContent formik={formik} load={load} onClose={onClose} />
      )}
    </Formik>
  );
};

// ---------------------------------------------------------------------------
// Inner content (needs access to Formik context)
// ---------------------------------------------------------------------------

interface RouteDrawerContentProps {
  formik: FormikProps<RouteFormValues>;
  load: LoadDetail;
  onClose: () => void;
}

const RouteDrawerContent: React.FC<RouteDrawerContentProps> = ({ formik, load, onClose }) => {
  const { values, dirty, isSubmitting } = formik;
  const stops = values.stops;

  const handleAddStop = useCallback(
    (type: StopType, push: (val: StopFormValue) => void) => {
      push(createEmptyStop(type, stops.length));
    },
    [stops.length],
  );

  const footer = (
    <Stack direction="row" spacing={1.5} justifyContent="flex-end">
      <Button variant="outlined" onClick={onClose}>
        Cancel
      </Button>
      <Button
        variant="contained"
        onClick={() => formik.handleSubmit()}
        disabled={!dirty || isSubmitting}
      >
        Save Changes
      </Button>
    </Stack>
  );

  return (
    <EditDrawer
      open
      title="Edit Route"
      subtitle={load.loadNumber}
      onClose={onClose}
      isDirty={dirty}
      footer={footer}
    >
      <Stack spacing={2.5} sx={{ p: 3 }}>
        <FieldArray name="stops">
          {(arrayHelpers) => (
            <DrawerSection label={`Stops (${stops.length})`}>
              <Stack spacing={1.5}>
                {stops.map((_stop, index) => (
                  <StopFormCard
                    key={index}
                    index={index}
                    prefix={`stops[${index}]`}
                    formik={formik}
                    canRemove={stops.length > 1}
                    onRemove={() => arrayHelpers.remove(index)}
                    defaultExpanded={false}
                    canReorder
                    onMoveUp={() => arrayHelpers.swap(index, index - 1)}
                    onMoveDown={() => arrayHelpers.swap(index, index + 1)}
                    isFirst={index === 0}
                    isLast={index === stops.length - 1}
                  />
                ))}
              </Stack>

              {/* Add stop buttons */}
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddStop('PICKUP', arrayHelpers.push)}
                >
                  Add Pickup
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="success"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddStop('DELIVERY', arrayHelpers.push)}
                >
                  Add Delivery
                </Button>
              </Stack>
            </DrawerSection>
          )}
        </FieldArray>
      </Stack>
    </EditDrawer>
  );
};
