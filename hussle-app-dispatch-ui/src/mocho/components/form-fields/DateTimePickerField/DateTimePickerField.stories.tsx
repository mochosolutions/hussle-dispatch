import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Formik, Form } from 'formik';
import { DateTimePickerField } from './index';
import { Stack, Typography, Button } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import * as Yup from 'yup';
import { addDays, addMonths, subDays } from 'date-fns';

/**
 * DateTimePickerField is a MUI DateTimePicker wrapped as a form-field.
 * Features min/max date constraints, helper text, and full Formik integration.
 * Must be wrapped in LocalizationProvider by parent component.
 */
const meta: Meta<typeof DateTimePickerField> = {
  title: 'Components/Form Fields/DateTimePickerField',
  component: DateTimePickerField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Story />
      </LocalizationProvider>
    ),
  ],
  argTypes: {
    name: {
      control: 'text',
      description: 'Field name for Formik',
    },
    label: {
      control: 'text',
      description: 'Field label',
    },
    required: {
      control: 'boolean',
      description: 'Mark as required',
    },
    helperText: {
      control: 'text',
      description: 'Helper text below the field',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DateTimePickerField>;

/**
 * Default date time picker
 */
export const Default: Story = {
  render: () => (
    <Formik
      initialValues={{ dateTime: null }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <DateTimePickerField
              name="dateTime"
              label="Select Date & Time"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Required field
 */
export const Required: Story = {
  render: () => (
    <Formik
      initialValues={{ appointmentDate: null }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <DateTimePickerField
              name="appointmentDate"
              label="Appointment Date"
              required
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * With helper text
 */
export const WithHelperText: Story = {
  render: () => (
    <Formik
      initialValues={{ eventStart: null }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <DateTimePickerField
              name="eventStart"
              label="Event Start"
              helperText="Select the start date and time for your event"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Pre-filled value
 */
export const PreFilled: Story = {
  render: () => (
    <Formik
      initialValues={{ scheduledAt: new Date() }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <DateTimePickerField
              name="scheduledAt"
              label="Scheduled Time"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * With minimum date (future only)
 */
export const FutureOnly: Story = {
  render: () => (
    <Formik
      initialValues={{ futureDate: null }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <DateTimePickerField
              name="futureDate"
              label="Schedule For"
              minDate={new Date()}
              helperText="Select a future date"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * With maximum date (past only)
 */
export const PastOnly: Story = {
  render: () => (
    <Formik
      initialValues={{ birthDate: null }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <DateTimePickerField
              name="birthDate"
              label="Date of Birth"
              maxDate={new Date()}
              helperText="Select your date of birth"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * With date range constraint
 */
export const DateRange: Story = {
  render: () => {
    const today = new Date();
    const minDate = subDays(today, 7);
    const maxDate = addDays(today, 30);

    return (
      <Formik
        initialValues={{ meetingDate: null }}
        onSubmit={() => {}}
      >
        {(formik) => (
          <Form>
            <Stack spacing={2} sx={{ width: 350 }}>
              <DateTimePickerField
                name="meetingDate"
                label="Meeting Date"
                minDate={minDate}
                maxDate={maxDate}
                helperText="Select within the next 30 days or last 7 days"
                formik={formik}
              />
            </Stack>
          </Form>
        )}
      </Formik>
    );
  },
};

/**
 * With validation error
 */
export const WithError: Story = {
  render: () => {
    const validationSchema = Yup.object({
      deadline: Yup.date()
        .min(new Date(), 'Deadline must be in the future')
        .required('Deadline is required'),
    });

    return (
      <Formik
        initialValues={{ deadline: subDays(new Date(), 1) }}
        initialTouched={{ deadline: true }}
        validationSchema={validationSchema}
        onSubmit={() => {}}
      >
        {(formik) => (
          <Form>
            <Stack spacing={2} sx={{ width: 350 }}>
              <DateTimePickerField
                name="deadline"
                label="Deadline"
                required
                formik={formik}
              />
            </Stack>
          </Form>
        )}
      </Formik>
    );
  },
};

/**
 * Event scheduling form example
 */
export const EventSchedulingExample: Story = {
  render: () => {
    const validationSchema = Yup.object({
      eventStart: Yup.date()
        .min(new Date(), 'Start time must be in the future')
        .required('Start time is required'),
      eventEnd: Yup.date()
        .min(Yup.ref('eventStart'), 'End time must be after start time')
        .required('End time is required'),
    });

    return (
      <Formik
        initialValues={{ eventStart: null, eventEnd: null }}
        validationSchema={validationSchema}
        onSubmit={(values) => alert(JSON.stringify(values, null, 2))}
      >
        {(formik) => (
          <Form>
            <Stack spacing={3} sx={{ width: 350 }}>
              <Typography variant="h6">Schedule Event</Typography>

              <DateTimePickerField
                name="eventStart"
                label="Start Time"
                minDate={new Date()}
                required
                formik={formik}
              />

              <DateTimePickerField
                name="eventEnd"
                label="End Time"
                minDate={formik.values.eventStart || new Date()}
                required
                formik={formik}
              />

              <Button type="submit" variant="contained" fullWidth>
                Create Event
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    );
  },
};

/**
 * Blog post scheduling example
 */
export const BlogSchedulingExample: Story = {
  render: () => {
    const validationSchema = Yup.object({
      publishAt: Yup.date().nullable(),
    });

    return (
      <Formik
        initialValues={{ publishAt: null }}
        validationSchema={validationSchema}
        onSubmit={(values) => {
          if (values.publishAt) {
            alert(`Post scheduled for: ${values.publishAt.toLocaleString()}`);
          } else {
            alert('Post will be published immediately');
          }
        }}
      >
        {(formik) => (
          <Form>
            <Stack spacing={3} sx={{ width: 350 }}>
              <Typography variant="h6">Publish Settings</Typography>

              <Typography variant="caption" color="text.secondary">
                [Title and content fields would go here]
              </Typography>

              <DateTimePickerField
                name="publishAt"
                label="Schedule Publication"
                minDate={new Date()}
                maxDate={addMonths(new Date(), 6)}
                helperText="Leave empty to publish immediately"
                formik={formik}
              />

              <Button type="submit" variant="contained" fullWidth>
                {formik.values.publishAt ? 'Schedule Post' : 'Publish Now'}
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    );
  },
};
