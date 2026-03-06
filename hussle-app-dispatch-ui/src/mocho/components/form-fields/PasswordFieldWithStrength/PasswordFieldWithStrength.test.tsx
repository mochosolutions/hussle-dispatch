import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordFieldWithStrength } from './index';
import type { FormikFieldProps } from '../types';

// Mock the password-strength utilities
jest.mock('../../../utils/password-strength', () => ({
  strengthIndicator: jest.fn((password: string) => {
    if (password.length === 0) return 0;
    if (password.length < 6) return 1;
    if (password.length < 8) return 2;
    if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) return 4;
    return 3;
  }),
  strengthColor: jest.fn((strength: number) => {
    if (strength < 2) return { label: 'Poor', color: 'error.main' };
    if (strength < 3) return { label: 'Weak', color: 'warning.main' };
    if (strength < 4) return { label: 'Normal', color: 'warning.dark' };
    if (strength < 5) return { label: 'Good', color: 'success.main' };
    return { label: 'Strong', color: 'success.dark' };
  }),
}));

const createMockFormik = (overrides: Partial<FormikFieldProps> = {}): FormikFieldProps => ({
  values: { password: '' },
  errors: {},
  touched: {},
  handleChange: jest.fn(),
  handleBlur: jest.fn(),
  setFieldValue: jest.fn(),
  ...overrides,
});

describe('PasswordFieldWithStrength', () => {
  it('renders with label', () => {
    const formik = createMockFormik();
    render(
      <PasswordFieldWithStrength name="password" label="Create Password" formik={formik} />
    );

    expect(screen.getByText('Create Password')).toBeInTheDocument();
  });

  it('renders password field functionality', () => {
    const formik = createMockFormik();
    render(
      <PasswordFieldWithStrength name="password" label="Create Password" formik={formik} />
    );

    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
  });

  it('shows strength meter when showStrengthMeter is true (default)', () => {
    const formik = createMockFormik({
      values: { password: 'test' },
    });
    render(
      <PasswordFieldWithStrength name="password" label="Create Password" formik={formik} />
    );

    // Strength indicator should be visible
    expect(screen.getByText('Poor')).toBeInTheDocument();
  });

  it('hides strength meter when showStrengthMeter is false', () => {
    const formik = createMockFormik({
      values: { password: 'test' },
    });
    render(
      <PasswordFieldWithStrength
        name="password"
        label="Create Password"
        formik={formik}
        showStrengthMeter={false}
      />
    );

    expect(screen.queryByText('Poor')).not.toBeInTheDocument();
    expect(screen.queryByText('Weak')).not.toBeInTheDocument();
    expect(screen.queryByText('Good')).not.toBeInTheDocument();
  });

  it('updates strength indicator based on password value', () => {
    const formik = createMockFormik({
      values: { password: 'Password1' },
    });
    render(
      <PasswordFieldWithStrength name="password" label="Create Password" formik={formik} />
    );

    // With our mock, this should return "Good"
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('inherits password toggle functionality', async () => {
    const user = userEvent.setup();
    const formik = createMockFormik();
    render(
      <PasswordFieldWithStrength name="password" label="Create Password" formik={formik} />
    );

    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });
    await user.click(toggleButton);

    expect(input).toHaveAttribute('type', 'text');
  });

  it('shows required indicator when required', () => {
    const formik = createMockFormik();
    render(
      <PasswordFieldWithStrength
        name="password"
        label="Create Password"
        formik={formik}
        required
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
