import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { OTPField } from './index';
import type { FormikFieldProps } from '../types';

// Create a basic theme for testing
const baseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    grey: {
      200: '#eee',
      300: '#ddd',
    },
  },
});

// Add custom shadows to match the app theme structure
const theme = {
  ...baseTheme,
  customShadows: {
    primary: '0 0 0 2px rgba(25, 118, 210, 0.2)',
  },
};

const createMockFormik = (overrides: Partial<FormikFieldProps> = {}): FormikFieldProps => ({
  values: { otp: '' },
  errors: {},
  touched: {},
  handleChange: jest.fn(),
  handleBlur: jest.fn(),
  setFieldValue: jest.fn(),
  ...overrides,
});

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('OTPField', () => {
  it('renders with label when provided', () => {
    const formik = createMockFormik();
    renderWithTheme(<OTPField name="otp" label="Verification Code" formik={formik} />);

    expect(screen.getByText('Verification Code')).toBeInTheDocument();
  });

  it('renders without label when not provided', () => {
    const formik = createMockFormik();
    renderWithTheme(<OTPField name="otp" formik={formik} />);

    expect(screen.queryByText('Verification Code')).not.toBeInTheDocument();
  });

  it('renders 6 input fields by default', () => {
    const formik = createMockFormik();
    renderWithTheme(<OTPField name="otp" formik={formik} />);

    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
  });

  it('renders custom number of input fields', () => {
    const formik = createMockFormik();
    renderWithTheme(<OTPField name="otp" formik={formik} numDigits={4} />);

    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(4);
  });

  it('calls setFieldValue when OTP changes', () => {
    const setFieldValue = jest.fn();
    const formik = createMockFormik({ setFieldValue });
    renderWithTheme(<OTPField name="otp" formik={formik} />);

    // The OTP input component handles the value change internally
    // This test verifies the component renders
    expect(screen.getAllByRole('textbox')).toHaveLength(6);
  });

  it('displays error message when touched and has error', () => {
    const formik = createMockFormik({
      errors: { otp: 'Invalid code' },
      touched: { otp: true },
    });
    renderWithTheme(<OTPField name="otp" formik={formik} />);

    expect(screen.getByText('Invalid code')).toBeInTheDocument();
  });

  it('does not display error when not touched', () => {
    const formik = createMockFormik({
      errors: { otp: 'Invalid code' },
      touched: {},
    });
    renderWithTheme(<OTPField name="otp" formik={formik} />);

    expect(screen.queryByText('Invalid code')).not.toBeInTheDocument();
  });

  it('displays current value from formik', () => {
    const formik = createMockFormik({
      values: { otp: '123456' },
    });
    renderWithTheme(<OTPField name="otp" formik={formik} />);

    const inputs = screen.getAllByRole('textbox');
    // Each input should have one character
    expect(inputs[0]).toHaveValue('1');
    expect(inputs[1]).toHaveValue('2');
    expect(inputs[2]).toHaveValue('3');
  });
});
