import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckboxField } from './index';
import type { FormikFieldProps } from '../types';

const createMockFormik = (overrides: Partial<FormikFieldProps> = {}): FormikFieldProps => ({
  values: { rememberMe: false },
  errors: {},
  touched: {},
  handleChange: jest.fn(),
  handleBlur: jest.fn(),
  setFieldValue: jest.fn(),
  ...overrides,
});

describe('CheckboxField', () => {
  it('renders with label', () => {
    const formik = createMockFormik();
    render(<CheckboxField name="rememberMe" label="Remember Me" formik={formik} />);

    expect(screen.getByLabelText('Remember Me')).toBeInTheDocument();
  });

  it('renders as unchecked by default', () => {
    const formik = createMockFormik();
    render(<CheckboxField name="rememberMe" label="Remember Me" formik={formik} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Remember Me' });
    expect(checkbox).not.toBeChecked();
  });

  it('renders as checked when formik value is true', () => {
    const formik = createMockFormik({
      values: { rememberMe: true },
    });
    render(<CheckboxField name="rememberMe" label="Remember Me" formik={formik} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Remember Me' });
    expect(checkbox).toBeChecked();
  });

  it('calls setFieldValue when clicked', async () => {
    const user = userEvent.setup();
    const setFieldValue = jest.fn();
    const formik = createMockFormik({ setFieldValue });

    render(<CheckboxField name="rememberMe" label="Remember Me" formik={formik} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Remember Me' });
    await user.click(checkbox);

    expect(setFieldValue).toHaveBeenCalledWith('rememberMe', true);
  });

  it('toggles value when clicked multiple times', async () => {
    const user = userEvent.setup();
    const setFieldValue = jest.fn();
    const formik = createMockFormik({ setFieldValue });

    render(<CheckboxField name="rememberMe" label="Remember Me" formik={formik} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Remember Me' });

    // First click - check
    await user.click(checkbox);
    expect(setFieldValue).toHaveBeenCalledWith('rememberMe', true);
  });

  it('renders with primary color by default', () => {
    const formik = createMockFormik();
    render(<CheckboxField name="rememberMe" label="Remember Me" formik={formik} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Remember Me' });
    expect(checkbox).toBeInTheDocument();
  });

  it('renders with secondary color when specified', () => {
    const formik = createMockFormik();
    render(
      <CheckboxField
        name="rememberMe"
        label="Remember Me"
        color="secondary"
        formik={formik}
      />
    );

    const checkbox = screen.getByRole('checkbox', { name: 'Remember Me' });
    expect(checkbox).toBeInTheDocument();
  });
});
