import { useCallback } from 'react';
import { Stack } from '@mui/material';
import { DateField, TimeField, SelectField, TextField as MochoTextField } from '@mocho/ui/components';
import * as Yup from 'yup';
import { FormDrawer } from 'mocho/components/FormDrawer';
import { useDispatch } from 'store';
import type { CreateScheduleOverrideInput, ScheduleOverrideType } from '../../types';
import { createOverrideRequest } from '../../store/reducers';

interface DriverScheduleOverrideDrawerProps {
  driverId: string;
  onClose: () => void;
}

const TIME_REGEX = /^\d{2}:\d{2}$/;

const overrideSchema = Yup.object({
  date: Yup.string().required('Date is required'),
  type: Yup.mixed<ScheduleOverrideType>()
    .oneOf(['OFF', 'MODIFIED', 'ADDED'])
    .required('Type is required'),
  startTime: Yup.string()
    .defined()
    .default('')
    .when('type', {
      is: (type: string) => type === 'MODIFIED' || type === 'ADDED',
      then: (schema) => schema.matches(TIME_REGEX, 'Required').required('Start time is required'),
      otherwise: (schema) => schema,
    }),
  endTime: Yup.string()
    .defined()
    .default('')
    .when('type', {
      is: (type: string) => type === 'MODIFIED' || type === 'ADDED',
      then: (schema) => schema.matches(TIME_REGEX, 'Required').required('End time is required'),
      otherwise: (schema) => schema,
    }),
  reason: Yup.string().defined().default(''),
}).required();

type OverrideFormValues = Yup.InferType<typeof overrideSchema>;

const OVERRIDE_TYPE_OPTIONS: { value: ScheduleOverrideType; label: string }[] = [
  { value: 'OFF', label: 'Day Off' },
  { value: 'MODIFIED', label: 'Modified Hours' },
  { value: 'ADDED', label: 'Extra Day' },
];

const initialValues: OverrideFormValues = {
  date: '',
  type: 'OFF',
  startTime: '08:00',
  endTime: '18:00',
  reason: '',
};

export const DriverScheduleOverrideDrawer: React.FC<DriverScheduleOverrideDrawerProps> = ({
  driverId,
  onClose,
}) => {
  const dispatch = useDispatch();

  const handleSubmit = useCallback(
    (values: OverrideFormValues) => {
      const input: CreateScheduleOverrideInput = {
        date: values.date,
        type: values.type,
        ...(values.type !== 'OFF' && {
          startTime: values.startTime,
          endTime: values.endTime,
        }),
        ...(values.reason && { reason: values.reason }),
      };
      dispatch(createOverrideRequest({ driverId, data: input }));
      onClose();
    },
    [dispatch, driverId, onClose],
  );

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Add Schedule Override"
      initialValues={initialValues}
      validationSchema={overrideSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {(formik) => {
        const showTimeFields = formik.values.type === 'MODIFIED' || formik.values.type === 'ADDED';

        return (
          <Stack spacing={2.5} sx={{ p: 3 }}>
            <DateField name="date" label="Date" required formik={formik} />

            <SelectField
              name="type"
              label="Override Type"
              data={OVERRIDE_TYPE_OPTIONS}
              required
              formik={formik}
            />

            {showTimeFields && (
              <>
                <TimeField name="startTime" label="Start Time" required formik={formik} />
                <TimeField name="endTime" label="End Time" required formik={formik} />
              </>
            )}

            <MochoTextField name="reason" label="Reason" formik={formik} multiline minRows={2} />
          </Stack>
        );
      }}
    </FormDrawer>
  );
};
