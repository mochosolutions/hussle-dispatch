import { render, screen } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { FormikFieldProps } from 'mocho/components/form-fields';
import { DriverCommunicationsSettings } from '../index';

const buildFormikProps = (overrides: Partial<FormikFieldProps> = {}): FormikFieldProps => ({
  values: {
    smsPrePickupLeadMinutes: 60,
    smsTransitIntervalMinutes: 180,
    smsPostPickupEscalationMinutes: 30,
    smsCooldownMinutes: 15,
  },
  errors: {},
  touched: {},
  handleChange: jest.fn(),
  handleBlur: jest.fn(),
  setFieldValue: jest.fn(),
  ...overrides,
});

const renderComponent = (formikProps: FormikFieldProps) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <DriverCommunicationsSettings formikProps={formikProps} />
    </ThemeProvider>,
  );

describe('DriverCommunicationsSettings', () => {
  it('renders all four labeled SMS cadence inputs', () => {
    renderComponent(buildFormikProps());

    expect(screen.getByLabelText(/pre-pickup lead time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/transit check-in interval/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/post-pickup escalation/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cooldown between prompts/i)).toBeInTheDocument();
  });

  it('reflects formik values on render', () => {
    renderComponent(
      buildFormikProps({
        values: {
          smsPrePickupLeadMinutes: 90,
          smsTransitIntervalMinutes: 240,
          smsPostPickupEscalationMinutes: 45,
          smsCooldownMinutes: 20,
        },
      }),
    );

    expect(screen.getByLabelText(/pre-pickup lead time/i)).toHaveValue(90);
    expect(screen.getByLabelText(/transit check-in interval/i)).toHaveValue(240);
    expect(screen.getByLabelText(/post-pickup escalation/i)).toHaveValue(45);
    expect(screen.getByLabelText(/cooldown between prompts/i)).toHaveValue(20);
  });

  it('displays validation error messages when fields are touched and have errors', () => {
    renderComponent(
      buildFormikProps({
        errors: {
          smsPrePickupLeadMinutes: 'Must be at least 1 minute',
          smsCooldownMinutes: 'Cooldown is required',
        },
        touched: {
          smsPrePickupLeadMinutes: true,
          smsCooldownMinutes: true,
        },
      }),
    );

    expect(screen.getByText('Must be at least 1 minute')).toBeInTheDocument();
    expect(screen.getByText('Cooldown is required')).toBeInTheDocument();
  });
});
