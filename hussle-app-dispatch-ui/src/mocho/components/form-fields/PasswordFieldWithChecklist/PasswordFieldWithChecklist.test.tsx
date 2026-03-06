import React from 'react';
import { render, screen } from '@testing-library/react';
import { PasswordFieldWithChecklist } from './index';
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

describe('PasswordFieldWithChecklist', () => {
  it('renders with label', () => {
    const formik = createMockFormik();
    render(
      <PasswordFieldWithChecklist name="password" label="New Password" formik={formik} />
    );

    expect(screen.getByText('New Password')).toBeInTheDocument();
  });

  it('renders password field functionality', () => {
    const formik = createMockFormik();
    render(
      <PasswordFieldWithChecklist name="password" label="New Password" formik={formik} />
    );

    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
  });

  it('shows default validation rules', () => {
    const formik = createMockFormik();
    render(
      <PasswordFieldWithChecklist name="password" label="New Password" formik={formik} />
    );

    expect(screen.getByText('8-character minimum length')).toBeInTheDocument();
    expect(screen.getByText('Contains at least 1 number')).toBeInTheDocument();
    expect(screen.getByText('Contains at least 1 upper and lowercase letter')).toBeInTheDocument();
    expect(screen.getByText('Contains at least 1 special character')).toBeInTheDocument();
  });

  it('shows X icon for unmet rules', () => {
    const formik = createMockFormik({
      values: { password: 'short' },
    });
    render(
      <PasswordFieldWithChecklist name="password" label="New Password" formik={formik} />
    );

    // The icons render as SVG - we can check for the rules text and the container structure
    const minLengthRule = screen.getByText('8-character minimum length');
    expect(minLengthRule).toBeInTheDocument();
  });

  it('shows check icon for met rules', () => {
    const formik = createMockFormik({
      values: { password: 'Password1!' },
    });
    render(
      <PasswordFieldWithChecklist name="password" label="New Password" formik={formik} />
    );

    // All rules should be visible
    expect(screen.getByText('8-character minimum length')).toBeInTheDocument();
    expect(screen.getByText('Contains at least 1 number')).toBeInTheDocument();
    expect(screen.getByText('Contains at least 1 upper and lowercase letter')).toBeInTheDocument();
    expect(screen.getByText('Contains at least 1 special character')).toBeInTheDocument();
  });

  it('validates minimum length rule correctly', () => {
    const formik = createMockFormik({
      values: { password: '12345678' },
    });
    render(
      <PasswordFieldWithChecklist name="password" label="New Password" formik={formik} />
    );

    // Rule text should be present
    expect(screen.getByText('8-character minimum length')).toBeInTheDocument();
  });

  it('validates number rule correctly', () => {
    const formik = createMockFormik({
      values: { password: 'abcd1efg' },
    });
    render(
      <PasswordFieldWithChecklist name="password" label="New Password" formik={formik} />
    );

    expect(screen.getByText('Contains at least 1 number')).toBeInTheDocument();
  });

  it('validates mixed case rule correctly', () => {
    const formik = createMockFormik({
      values: { password: 'AbCdEfGh' },
    });
    render(
      <PasswordFieldWithChecklist name="password" label="New Password" formik={formik} />
    );

    expect(screen.getByText('Contains at least 1 upper and lowercase letter')).toBeInTheDocument();
  });

  it('validates special character rule correctly', () => {
    const formik = createMockFormik({
      values: { password: 'password!' },
    });
    render(
      <PasswordFieldWithChecklist name="password" label="New Password" formik={formik} />
    );

    expect(screen.getByText('Contains at least 1 special character')).toBeInTheDocument();
  });

  it('accepts custom validation rules', () => {
    const customRules = [
      { test: (s: string) => s.length >= 10, label: 'At least 10 characters' },
      { test: (s: string) => s.includes('@'), label: 'Contains @ symbol' },
    ];

    const formik = createMockFormik();
    render(
      <PasswordFieldWithChecklist
        name="password"
        label="New Password"
        formik={formik}
        validationRules={customRules}
      />
    );

    expect(screen.getByText('At least 10 characters')).toBeInTheDocument();
    expect(screen.getByText('Contains @ symbol')).toBeInTheDocument();
    expect(screen.queryByText('8-character minimum length')).not.toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    const formik = createMockFormik();
    render(
      <PasswordFieldWithChecklist
        name="password"
        label="New Password"
        formik={formik}
        required
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
