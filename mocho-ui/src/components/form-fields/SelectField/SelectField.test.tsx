import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectField } from './index';
import type { FormikFieldProps, SelectOption } from '../types';

const mockOptions: SelectOption[] = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
];

const createMockFormik = (overrides: Partial<FormikFieldProps> = {}): FormikFieldProps => ({
  values: { country: '' },
  errors: {},
  touched: {},
  handleChange: jest.fn(),
  handleBlur: jest.fn(),
  setFieldValue: jest.fn(),
  ...overrides,
});

describe('SelectField', () => {
  it('renders with label', () => {
    const formik = createMockFormik();
    render(
      <SelectField name="country" label="Country" data={mockOptions} formik={formik} />
    );

    expect(screen.getByText('Country')).toBeInTheDocument();
  });

  it('renders all options when opened', async () => {
    const user = userEvent.setup();
    const formik = createMockFormik();
    render(
      <SelectField name="country" label="Country" data={mockOptions} formik={formik} />
    );

    // Open the select dropdown - MUI Select uses a button role
    const select = screen.getByRole('combobox');
    await user.click(select);

    // Check all options are rendered in the listbox
    const listbox = within(screen.getByRole('listbox'));
    expect(listbox.getByText('United States')).toBeInTheDocument();
    expect(listbox.getByText('United Kingdom')).toBeInTheDocument();
    expect(listbox.getByText('Canada')).toBeInTheDocument();
  });

  it('displays selected value from formik', () => {
    const formik = createMockFormik({
      values: { country: 'us' },
    });
    render(
      <SelectField name="country" label="Country" data={mockOptions} formik={formik} />
    );

    // MUI Select displays the selected value's label
    expect(screen.getByText('United States')).toBeInTheDocument();
  });

  it('calls setFieldValue when selection changes', async () => {
    const user = userEvent.setup();
    const setFieldValue = jest.fn();
    const formik = createMockFormik({ setFieldValue });

    render(
      <SelectField name="country" label="Country" data={mockOptions} formik={formik} />
    );

    // Open the dropdown
    const select = screen.getByRole('combobox');
    await user.click(select);

    // Select an option
    const listbox = within(screen.getByRole('listbox'));
    await user.click(listbox.getByText('Canada'));

    expect(setFieldValue).toHaveBeenCalledWith('country', 'ca');
  });

  it('displays error message when touched and has error', () => {
    const formik = createMockFormik({
      errors: { country: 'Country is required' },
      touched: { country: true },
    });
    render(
      <SelectField name="country" label="Country" data={mockOptions} formik={formik} />
    );

    expect(screen.getByText('Country is required')).toBeInTheDocument();
  });

  it('does not display error when not touched', () => {
    const formik = createMockFormik({
      errors: { country: 'Country is required' },
      touched: {},
    });
    render(
      <SelectField name="country" label="Country" data={mockOptions} formik={formik} />
    );

    expect(screen.queryByText('Country is required')).not.toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    const formik = createMockFormik();
    render(
      <SelectField
        name="country"
        label="Country"
        data={mockOptions}
        formik={formik}
        required
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
