import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CharCounterField } from './index';
import type { FormikFieldProps } from '../types';

const createMockFormik = (overrides: Partial<FormikFieldProps> = {}): FormikFieldProps => ({
  values: { bio: '' },
  errors: {},
  touched: {},
  handleChange: jest.fn(),
  handleBlur: jest.fn(),
  setFieldValue: jest.fn(),
  ...overrides,
});

describe('CharCounterField', () => {
  it('renders with label', () => {
    const formik = createMockFormik();
    render(<CharCounterField name="bio" label="Bio" maxLength={500} formik={formik} />);

    expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
  });

  it('renders as multiline textarea', () => {
    const formik = createMockFormik();
    render(<CharCounterField name="bio" label="Bio" maxLength={500} formik={formik} />);

    const textarea = screen.getByRole('textbox', { name: /bio/i });
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('displays character counter showing 0 when empty', () => {
    const formik = createMockFormik();
    render(<CharCounterField name="bio" label="Bio" maxLength={500} formik={formik} />);

    expect(screen.getByText('0/500 characters')).toBeInTheDocument();
  });

  it('displays current character count based on value', () => {
    const formik = createMockFormik({
      values: { bio: 'Hello World' },
    });
    render(<CharCounterField name="bio" label="Bio" maxLength={500} formik={formik} />);

    expect(screen.getByText('11/500 characters')).toBeInTheDocument();
  });

  it('displays current value from formik', () => {
    const formik = createMockFormik({
      values: { bio: 'Test content' },
    });
    render(<CharCounterField name="bio" label="Bio" maxLength={500} formik={formik} />);

    const textarea = screen.getByRole('textbox', { name: /bio/i });
    expect(textarea).toHaveValue('Test content');
  });

  it('renders with placeholder when provided', () => {
    const formik = createMockFormik();
    render(
      <CharCounterField
        name="bio"
        label="Bio"
        maxLength={500}
        placeholder="Enter your bio"
        formik={formik}
      />
    );

    expect(screen.getByPlaceholderText('Enter your bio')).toBeInTheDocument();
  });

  it('calls handleChange when typing', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    const formik = createMockFormik({ handleChange });

    render(<CharCounterField name="bio" label="Bio" maxLength={500} formik={formik} />);

    const textarea = screen.getByRole('textbox', { name: /bio/i });
    await user.type(textarea, 'Test');

    expect(handleChange).toHaveBeenCalled();
  });

  it('calls handleBlur when focus leaves', async () => {
    const user = userEvent.setup();
    const handleBlur = jest.fn();
    const formik = createMockFormik({ handleBlur });

    render(<CharCounterField name="bio" label="Bio" maxLength={500} formik={formik} />);

    const textarea = screen.getByRole('textbox', { name: /bio/i });
    await user.click(textarea);
    await user.tab();

    expect(handleBlur).toHaveBeenCalled();
  });

  it('displays error message when touched and has error', () => {
    const formik = createMockFormik({
      errors: { bio: 'Bio is required' },
      touched: { bio: true },
    });
    render(<CharCounterField name="bio" label="Bio" maxLength={500} formik={formik} />);

    expect(screen.getByText('Bio is required')).toBeInTheDocument();
  });

  it('does not display error when not touched', () => {
    const formik = createMockFormik({
      errors: { bio: 'Bio is required' },
      touched: {},
    });
    render(<CharCounterField name="bio" label="Bio" maxLength={500} formik={formik} />);

    expect(screen.queryByText('Bio is required')).not.toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    const formik = createMockFormik();
    render(<CharCounterField name="bio" label="Bio" maxLength={500} formik={formik} required />);

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('respects custom rows prop', () => {
    const formik = createMockFormik();
    render(<CharCounterField name="bio" label="Bio" maxLength={500} rows={6} formik={formik} />);

    const textarea = screen.getByRole('textbox', { name: /bio/i });
    expect(textarea).toHaveAttribute('rows', '6');
  });

  it('uses default of 4 rows when not specified', () => {
    const formik = createMockFormik();
    render(<CharCounterField name="bio" label="Bio" maxLength={500} formik={formik} />);

    const textarea = screen.getByRole('textbox', { name: /bio/i });
    expect(textarea).toHaveAttribute('rows', '4');
  });

  it('is disabled when disabled prop is true', () => {
    const formik = createMockFormik();
    render(<CharCounterField name="bio" label="Bio" maxLength={500} formik={formik} disabled />);

    const textarea = screen.getByRole('textbox', { name: /bio/i });
    expect(textarea).toBeDisabled();
  });
});
