import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextField } from './index';
import type { FormikFieldProps } from '../types';

const createMockFormik = (overrides: Partial<FormikFieldProps> = {}): FormikFieldProps => ({
  values: { name: '' },
  errors: {},
  touched: {},
  handleChange: jest.fn(),
  handleBlur: jest.fn(),
  setFieldValue: jest.fn(),
  ...overrides,
});

describe('TextField', () => {
  it('renders with label', () => {
    const formik = createMockFormik();
    render(<TextField name="name" label="First Name" formik={formik} />);

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
  });

  it('renders with text input type by default', () => {
    const formik = createMockFormik();
    render(<TextField name="name" label="First Name" formik={formik} />);

    const input = screen.getByRole('textbox', { name: /first name/i });
    expect(input).toHaveAttribute('type', 'text');
  });

  it('renders with number input type when specified', () => {
    const formik = createMockFormik({ values: { age: '' } });
    render(<TextField name="age" label="Age" type="number" formik={formik} />);

    const input = screen.getByRole('spinbutton', { name: /age/i });
    expect(input).toHaveAttribute('type', 'number');
  });

  it('renders with placeholder when provided', () => {
    const formik = createMockFormik();
    render(
      <TextField
        name="name"
        label="First Name"
        placeholder="Enter your first name"
        formik={formik}
      />
    );

    expect(screen.getByPlaceholderText('Enter your first name')).toBeInTheDocument();
  });

  it('displays current value from formik', () => {
    const formik = createMockFormik({
      values: { name: 'John' },
    });
    render(<TextField name="name" label="First Name" formik={formik} />);

    const input = screen.getByRole('textbox', { name: /first name/i });
    expect(input).toHaveValue('John');
  });

  it('calls handleChange when typing', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    const formik = createMockFormik({ handleChange });

    render(<TextField name="name" label="First Name" formik={formik} />);

    const input = screen.getByRole('textbox', { name: /first name/i });
    await user.type(input, 'John');

    expect(handleChange).toHaveBeenCalled();
  });

  it('calls handleBlur when focus leaves', async () => {
    const user = userEvent.setup();
    const handleBlur = jest.fn();
    const formik = createMockFormik({ handleBlur });

    render(<TextField name="name" label="First Name" formik={formik} />);

    const input = screen.getByRole('textbox', { name: /first name/i });
    await user.click(input);
    await user.tab();

    expect(handleBlur).toHaveBeenCalled();
  });

  it('displays error message when touched and has error', () => {
    const formik = createMockFormik({
      errors: { name: 'Name is required' },
      touched: { name: true },
    });
    render(<TextField name="name" label="First Name" formik={formik} />);

    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('does not display error when not touched', () => {
    const formik = createMockFormik({
      errors: { name: 'Name is required' },
      touched: {},
    });
    render(<TextField name="name" label="First Name" formik={formik} />);

    expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    const formik = createMockFormik();
    render(<TextField name="name" label="First Name" formik={formik} disabled />);

    const input = screen.getByRole('textbox', { name: /first name/i });
    expect(input).toBeDisabled();
  });

  it('shows required indicator when required', () => {
    const formik = createMockFormik();
    render(<TextField name="name" label="First Name" formik={formik} required />);

    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
