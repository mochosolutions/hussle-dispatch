import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordField } from './index';
import type { FormikFieldProps } from '../types';

const createMockFormik = (overrides: Partial<FormikFieldProps> = {}): FormikFieldProps => ({
  values: { password: '' },
  errors: {},
  touched: {},
  handleChange: jest.fn(),
  handleBlur: jest.fn(),
  setFieldValue: jest.fn(),
  ...overrides,
});

describe('PasswordField', () => {
  it('renders with label', () => {
    const formik = createMockFormik();
    render(<PasswordField name="password" label="Password" formik={formik} />);

    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  it('renders with password input type by default', () => {
    const formik = createMockFormik();
    render(<PasswordField name="password" label="Password" formik={formik} />);

    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('renders with placeholder when provided', () => {
    const formik = createMockFormik();
    render(
      <PasswordField
        name="password"
        label="Password"
        placeholder="Enter your password"
        formik={formik}
      />
    );

    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('uses default placeholder when not provided', () => {
    const formik = createMockFormik();
    render(<PasswordField name="password" label="Password" formik={formik} />);

    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
  });

  it('toggles password visibility when eye button is clicked', async () => {
    const user = userEvent.setup();
    const formik = createMockFormik();

    render(<PasswordField name="password" label="Password" formik={formik} />);

    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveAttribute('type', 'password');

    // Click the toggle button to show password
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });
    await user.click(toggleButton);

    expect(input).toHaveAttribute('type', 'text');

    // Click again to hide password
    await user.click(toggleButton);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('does not show toggle button when enableToggle is false', () => {
    const formik = createMockFormik();
    render(
      <PasswordField
        name="password"
        label="Password"
        formik={formik}
        enableToggle={false}
      />
    );

    expect(screen.queryByRole('button', { name: /toggle password visibility/i })).not.toBeInTheDocument();
  });

  it('displays current value from formik', () => {
    const formik = createMockFormik({
      values: { password: 'secretpassword' },
    });
    render(<PasswordField name="password" label="Password" formik={formik} />);

    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveValue('secretpassword');
  });

  it('calls handleChange when typing', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    const formik = createMockFormik({ handleChange });

    render(<PasswordField name="password" label="Password" formik={formik} />);

    const input = screen.getByPlaceholderText('Enter password');
    await user.type(input, 'test');

    expect(handleChange).toHaveBeenCalled();
  });

  it('calls handleBlur when focus leaves', async () => {
    const user = userEvent.setup();
    const handleBlur = jest.fn();
    const formik = createMockFormik({ handleBlur });

    render(<PasswordField name="password" label="Password" formik={formik} />);

    const input = screen.getByPlaceholderText('Enter password');
    await user.click(input);
    await user.tab();

    expect(handleBlur).toHaveBeenCalled();
  });

  it('displays error message when touched and has error', () => {
    const formik = createMockFormik({
      errors: { password: 'Password is required' },
      touched: { password: true },
    });
    render(<PasswordField name="password" label="Password" formik={formik} />);

    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('does not display error when not touched', () => {
    const formik = createMockFormik({
      errors: { password: 'Password is required' },
      touched: {},
    });
    render(<PasswordField name="password" label="Password" formik={formik} />);

    expect(screen.queryByText('Password is required')).not.toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    const formik = createMockFormik();
    render(<PasswordField name="password" label="Password" formik={formik} required />);

    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
