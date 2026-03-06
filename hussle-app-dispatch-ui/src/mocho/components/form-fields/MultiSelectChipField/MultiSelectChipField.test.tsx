import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiSelectChipField } from './index';
import type { FormikFieldProps } from '../types';

const mockOptions = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
];

const createMockFormik = (overrides: Partial<FormikFieldProps> = {}): FormikFieldProps => ({
  values: { authors: [] },
  errors: {},
  touched: {},
  handleChange: jest.fn(),
  handleBlur: jest.fn(),
  setFieldValue: jest.fn(),
  ...overrides,
});

describe('MultiSelectChipField', () => {
  it('renders with label', () => {
    const formik = createMockFormik();
    render(
      <MultiSelectChipField
        name="authors"
        label="Authors"
        options={mockOptions}
        formik={formik}
      />
    );

    expect(screen.getByText('Authors')).toBeInTheDocument();
  });

  it('renders as a combobox', () => {
    const formik = createMockFormik();
    render(
      <MultiSelectChipField
        name="authors"
        label="Authors"
        options={mockOptions}
        formik={formik}
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows options when clicked', async () => {
    const user = userEvent.setup();
    const formik = createMockFormik();
    render(
      <MultiSelectChipField
        name="authors"
        label="Authors"
        options={mockOptions}
        formik={formik}
      />
    );

    const select = screen.getByRole('combobox');
    await user.click(select);

    expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument();
  });

  it('calls setFieldValue when an option is selected', async () => {
    const user = userEvent.setup();
    const setFieldValue = jest.fn();
    const formik = createMockFormik({ setFieldValue });

    render(
      <MultiSelectChipField
        name="authors"
        label="Authors"
        options={mockOptions}
        formik={formik}
      />
    );

    const select = screen.getByRole('combobox');
    await user.click(select);
    await user.click(screen.getByRole('option', { name: 'Option 1' }));

    expect(setFieldValue).toHaveBeenCalledWith('authors', ['1']);
  });

  it('displays selected values as chips', () => {
    const formik = createMockFormik({
      values: { authors: ['1', '2'] },
    });

    render(
      <MultiSelectChipField
        name="authors"
        label="Authors"
        options={mockOptions}
        formik={formik}
      />
    );

    // Chips should show the labels for selected values
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('displays error message when touched and has error', () => {
    const formik = createMockFormik({
      errors: { authors: 'At least one author is required' },
      touched: { authors: true },
    });

    render(
      <MultiSelectChipField
        name="authors"
        label="Authors"
        options={mockOptions}
        formik={formik}
      />
    );

    expect(screen.getByText('At least one author is required')).toBeInTheDocument();
  });

  it('does not display error when not touched', () => {
    const formik = createMockFormik({
      errors: { authors: 'At least one author is required' },
      touched: {},
    });

    render(
      <MultiSelectChipField
        name="authors"
        label="Authors"
        options={mockOptions}
        formik={formik}
      />
    );

    expect(screen.queryByText('At least one author is required')).not.toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    const formik = createMockFormik();
    render(
      <MultiSelectChipField
        name="authors"
        label="Authors"
        options={mockOptions}
        formik={formik}
        required
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('handles unknown values gracefully by showing value as label', () => {
    const formik = createMockFormik({
      values: { authors: ['unknown-id'] },
    });

    render(
      <MultiSelectChipField
        name="authors"
        label="Authors"
        options={mockOptions}
        formik={formik}
      />
    );

    // Should show the value itself when label is not found
    expect(screen.getByText('unknown-id')).toBeInTheDocument();
  });

  it('allows deselecting by clicking selected option', async () => {
    const user = userEvent.setup();
    const setFieldValue = jest.fn();
    const formik = createMockFormik({
      values: { authors: ['1', '2'] },
      setFieldValue,
    });

    render(
      <MultiSelectChipField
        name="authors"
        label="Authors"
        options={mockOptions}
        formik={formik}
      />
    );

    const select = screen.getByRole('combobox');
    await user.click(select);

    // Click on Option 1 to deselect it
    await user.click(screen.getByRole('option', { name: 'Option 1' }));

    // Should call with only Option 2 remaining
    expect(setFieldValue).toHaveBeenCalledWith('authors', ['2']);
  });
});
