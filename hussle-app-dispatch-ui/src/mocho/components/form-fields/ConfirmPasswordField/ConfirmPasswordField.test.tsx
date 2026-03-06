import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConfirmPasswordField } from './index';
import type { FormikFieldProps } from '../types';

const createMockFormik = (overrides: Partial<FormikFieldProps> = {}): FormikFieldProps => ({
  values: { confirmPassword: '' },
  errors: {},
  touched: {},
  handleChange: jest.fn(),
  handleBlur: jest.fn(),
  setFieldValue: jest.fn(),
  ...overrides,
});

describe('ConfirmPasswordField', () => {
  it('renders with default label', () => {
    const formik = createMockFormik();
    render(<ConfirmPasswordField name="confirmPassword" label="Confirm Password" formik={formik} />);

    expect(screen.getByText('Confirm Password')).toBeInTheDocument();
  });

  it('renders with default placeholder', () => {
    const formik = createMockFormik();
    render(<ConfirmPasswordField name="confirmPassword" label="Confirm Password" formik={formik} />);

    expect(screen.getByPlaceholderText('Enter confirm password')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    const formik = createMockFormik();
    render(
      <ConfirmPasswordField
        name="confirmPassword"
        label="Confirm Password"
        placeholder="Re-enter your password"
        formik={formik}
      />
    );

    expect(screen.getByPlaceholderText('Re-enter your password')).toBeInTheDocument();
  });

  it('inherits password visibility toggle by default', () => {
    const formik = createMockFormik();
    render(<ConfirmPasswordField name="confirmPassword" label="Confirm Password" formik={formik} />);

    expect(screen.getByRole('button', { name: /toggle password visibility/i })).toBeInTheDocument();
  });

  it('hides toggle when enableToggle is false', () => {
    const formik = createMockFormik();
    render(
      <ConfirmPasswordField
        name="confirmPassword"
        label="Confirm Password"
        formik={formik}
        enableToggle={false}
      />
    );

    expect(screen.queryByRole('button', { name: /toggle password visibility/i })).not.toBeInTheDocument();
  });

  it('displays error message when touched and has error', () => {
    const formik = createMockFormik({
      errors: { confirmPassword: 'Passwords must match' },
      touched: { confirmPassword: true },
    });
    render(<ConfirmPasswordField name="confirmPassword" label="Confirm Password" formik={formik} />);

    expect(screen.getByText('Passwords must match')).toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    const formik = createMockFormik();
    render(
      <ConfirmPasswordField
        name="confirmPassword"
        label="Confirm Password"
        formik={formik}
        required
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
