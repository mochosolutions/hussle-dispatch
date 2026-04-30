import { useCallback } from 'react';
import {
  Box,
  Checkbox,
  FormControlLabel,
  Stack,
} from '@mui/material';
import { Meta, MetaStrong, Timestamp } from 'components/Typography';
import * as Yup from 'yup';
import { TimeField } from '@mocho/ui/components/form-fields';
import { FormDrawer } from 'mocho/components/FormDrawer';
import { useDispatch, useSelector } from 'store';
import type { WeeklyScheduleEntry, DayOfWeek } from '../../types';
import { DAY_OF_WEEK_ORDER, DAY_OF_WEEK_LABELS } from '../../types';
import {
  selectWeeklySchedule,
  selectScheduleLoading,
} from '../../store/selectors/driverSelectors';
import { setWeeklyScheduleRequest } from '../../store/reducers';

interface DriverWeeklyScheduleDrawerProps {
  driverId: string;
  onClose: () => void;
}

interface DayFormValues {
  enabled: boolean;
  is24Hours: boolean;
  startTime: string;
  endTime: string;
}

interface WeeklyFormValues {
  MONDAY: DayFormValues;
  TUESDAY: DayFormValues;
  WEDNESDAY: DayFormValues;
  THURSDAY: DayFormValues;
  FRIDAY: DayFormValues;
  SATURDAY: DayFormValues;
  SUNDAY: DayFormValues;
}

const DEFAULT_DAY: DayFormValues = {
  enabled: false,
  is24Hours: false,
  startTime: '08:00',
  endTime: '18:00',
};

const buildInitialValues = (schedule: WeeklyScheduleEntry[]): WeeklyFormValues => {
  const byDay = new Map(schedule.map((e) => [e.dayOfWeek, e]));

  const values = {} as WeeklyFormValues;
  DAY_OF_WEEK_ORDER.forEach((day) => {
    const entry = byDay.get(day);
    if (entry) {
      values[day] = {
        enabled: true,
        is24Hours: entry.is24Hours,
        startTime: entry.startTime,
        endTime: entry.endTime,
      };
    } else {
      values[day] = { ...DEFAULT_DAY };
    }
  });
  return values;
};

const formValuesToEntries = (values: WeeklyFormValues): WeeklyScheduleEntry[] =>
  DAY_OF_WEEK_ORDER.filter((day) => values[day].enabled).map((day) => ({
    dayOfWeek: day,
    startTime: values[day].is24Hours ? '00:00' : values[day].startTime,
    endTime: values[day].is24Hours ? '23:59' : values[day].endTime,
    is24Hours: values[day].is24Hours,
  }));

const TIME_REGEX = /^\d{2}:\d{2}$/;

const daySchema = Yup.object({
  enabled: Yup.boolean().required(),
  is24Hours: Yup.boolean().required(),
  startTime: Yup.string()
    .when(['enabled', 'is24Hours'], {
      is: (enabled: boolean, is24Hours: boolean) => enabled && !is24Hours,
      then: (schema) => schema.matches(TIME_REGEX, 'Required').required('Required'),
      otherwise: (schema) => schema.optional(),
    }),
  endTime: Yup.string()
    .when(['enabled', 'is24Hours'], {
      is: (enabled: boolean, is24Hours: boolean) => enabled && !is24Hours,
      then: (schema) => schema.matches(TIME_REGEX, 'Required').required('Required'),
      otherwise: (schema) => schema.optional(),
    }),
});

const weeklyScheduleSchema = Yup.object(
  Object.fromEntries(DAY_OF_WEEK_ORDER.map((day) => [day, daySchema])),
) as Yup.ObjectSchema<WeeklyFormValues>;

export const DriverWeeklyScheduleDrawer: React.FC<DriverWeeklyScheduleDrawerProps> = ({
  driverId,
  onClose,
}) => {
  const dispatch = useDispatch();
  const weeklySchedule = useSelector(selectWeeklySchedule);
  const isLoading = useSelector(selectScheduleLoading);

  const handleSubmit = useCallback(
    (values: WeeklyFormValues) => {
      dispatch(
        setWeeklyScheduleRequest({ driverId, entries: formValuesToEntries(values) }),
      );
      onClose();
    },
    [dispatch, driverId, onClose],
  );

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Edit Weekly Schedule"
      initialValues={buildInitialValues(weeklySchedule)}
      validationSchema={weeklyScheduleSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {(formik) => (
        <Stack spacing={1} sx={{ p: 3, opacity: isLoading ? 0.5 : 1 }}>
          {DAY_OF_WEEK_ORDER.map((day) => {
            const prefix = day as DayOfWeek;
            const dayValues = formik.values[prefix];

            return (
              <Box
                key={day}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderRadius: 1,
                  bgcolor: dayValues.enabled ? 'action.hover' : 'transparent',
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Box sx={{ flex: 3.5 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={dayValues.enabled}
                          onChange={formik.handleChange}
                          name={`${prefix}.enabled`}
                          size="small"
                        />
                      }
                      label={<MetaStrong>{DAY_OF_WEEK_LABELS[day]}</MetaStrong>}
                    />
                  </Box>

                  {dayValues.enabled && (
                    <>
                      <Box sx={{ flex: 2.5 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={dayValues.is24Hours}
                              onChange={formik.handleChange}
                              name={`${prefix}.is24Hours`}
                              size="small"
                            />
                          }
                          label={<Meta>24 hrs</Meta>}
                        />
                      </Box>

                      {!dayValues.is24Hours && (
                        <>
                          <Box sx={{ flex: 3 }}>
                            <TimeField
                              name={`${prefix}.startTime`}
                              label="Start"
                              formik={formik}
                            />
                          </Box>
                          <Box sx={{ flex: 3 }}>
                            <TimeField
                              name={`${prefix}.endTime`}
                              label="End"
                              formik={formik}
                            />
                          </Box>
                        </>
                      )}
                    </>
                  )}

                  {!dayValues.enabled && (
                    <Box sx={{ flex: 8.5 }}>
                      <Timestamp>Off</Timestamp>
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}
    </FormDrawer>
  );
};
