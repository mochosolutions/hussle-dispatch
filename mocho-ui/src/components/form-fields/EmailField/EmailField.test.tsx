import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailField } from './index';
import type { FormikFieldProps } from '../types';

const createMockFormik = (overrides: Partial<FormikFieldProps> = {}): FormikFieldProps => ({
  values: { email: '' },
  errors: {},
  touched: {},
  handleChange: jest.fn(),
  handleBlur: jest.fn(),
  setFieldValue: jest.fn(),
  ...overrides,
});

describe('EmailField', () => {
  it('renders with label', () => {
    const formik = createMockFormik();
    render(<EmailField name="email" label="Email Address" formik={formik} />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it('renders with email input type', () => {
    const formik = createMockFormik();
    render(<EmailField name="email" label="Email Address" formik={formik} />);

    const input = screen.getByRole('textbox', { name: /email address/i });
    expect(input).toHaveAttribute('type', 'email');
  });

  it('renders with placeholder when provided', () => {
    const formik = createMockFormik();
    render(
      <EmailField
        name="email"
        label="Email Address"
        placeholder="Enter your email"
        formik={formik}
      />
    );

    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });

  it('uses default placeholder when not provided', () => {
    const formik = createMockFormik();
    render(<EmailField name="email" label="Email Address" formik={formik} />);

    expect(screen.getByPlaceholderText('Enter email address')).toBeInTheDocument();
  });

  it('displays current value from formik', () => {
    const formik = createMockFormik({
      values: { email: 'test@example.com' },
    });
    render(<EmailField name="email" label="Email Address" formik={formik} />);

    const input = screen.getByRole('textbox', { name: /email address/i });
    expect(input).toHaveValue('test@example.com');
  });

  it('calls handleChange when typing', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    const formik = createMockFormik({ handleChange });

    render(<EmailField name="email" label="Email Address" formik={formik} />);

    const input = screen.getByRole('textbox', { name: /email address/i });
    await user.type(input, 'test@example.com');

    expect(handleChange).toHaveBeenCalled();
  });

  it('calls handleBlur when focus leaves', async () => {
    const user = userEvent.setup();
    const handleBlur = jest.fn();
    const formik = createMockFormik({ handleBlur });

    render(<EmailField name="email" label="Email Address" formik={formik} />);

    const input = screen.getByRole('textbox', { name: /email address/i });
    await user.click(input);
    await user.tab();

    expect(handleBlur).toHaveBeenCalled();
  });

  it('displays error message when touched and has error', () => {
    const formik = createMockFormik({
      errors: { email: 'Email is required' },
      touched: { email: true },
    });
    render(<EmailField name="email" label="Email Address" formik={formik} />);

    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('does not display error when not touched', () => {
    const formik = createMockFormik({
      errors: { email: 'Email is required' },
      touched: {},
    });
    render(<EmailField name="email" label="Email Address" formik={formik} />);

    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    const formik = createMockFormik();
    render(<EmailField name="email" label="Email Address" formik={formik} disabled />);

    const input = screen.getByRole('textbox', { name: /email address/i });
    expect(input).toBeDisabled();
  });

  it('shows required indicator when required', () => {
    const formik = createMockFormik();
    render(<EmailField name="email" label="Email Address" formik={formik} required />);

    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
