import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { TinField, tinYupFragment, type TinType } from './index';

interface FormShape {
  tin: string;
  tinType: TinType;
}

interface RenderOptions {
  initialValues?: Partial<FormShape>;
  validationSchema?: Yup.AnySchema;
}

const renderField = (options: RenderOptions = {}) => {
  const onSubmit = jest.fn();
  const initial: FormShape = {
    tin: '',
    tinType: 'EIN',
    ...options.initialValues,
  };
  render(
    <Formik<FormShape>
      initialValues={initial}
      validationSchema={options.validationSchema}
      onSubmit={onSubmit}
    >
      {({ values, errors, touched }) => (
        <Form>
          <TinField name="tin" typeName="tinType" />
          <div data-testid="tin-value">{values.tin}</div>
          <div data-testid="tin-type">{values.tinType}</div>
          <div data-testid="tin-error">
            {touched.tin && typeof errors.tin === 'string' ? errors.tin : ''}
          </div>
          <button type="submit">submit</button>
        </Form>
      )}
    </Formik>,
  );
  return { onSubmit };
};

describe('TinField', () => {
  it('accepts EIN format 12-3456789 and stores it on the form', async () => {
    const user = userEvent.setup();
    renderField();

    const input = screen.getByPlaceholderText('XX-XXXXXXX');
    await user.type(input, '123456789');

    await waitFor(() => {
      expect(screen.getByTestId('tin-value')).toHaveTextContent('12-3456789');
    });
  });

  it('toggling "I\'m an individual" switches the mask to SSN', async () => {
    const user = userEvent.setup();
    renderField();

    // Default is EIN
    expect(screen.getByPlaceholderText('XX-XXXXXXX')).toBeInTheDocument();

    await user.click(screen.getByLabelText(/i'm an individual \(use ssn\)/i));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('XXX-XX-XXXX')).toBeInTheDocument();
    });
    expect(screen.queryByPlaceholderText('XX-XXXXXXX')).not.toBeInTheDocument();
  });

  it('accepts SSN format 123-45-6789 once individual toggle is on', async () => {
    const user = userEvent.setup();
    renderField({ initialValues: { tinType: 'SSN' } });

    const input = screen.getByPlaceholderText('XXX-XX-XXXX');
    await user.type(input, '123456789');

    await waitFor(() => {
      expect(screen.getByTestId('tin-value')).toHaveTextContent('123-45-6789');
    });
  });

  it('rejects invalid formats via tinYupFragment', async () => {
    const user = userEvent.setup();
    const schema = Yup.object({
      tin: tinYupFragment().required('TIN is required'),
      tinType: Yup.mixed<TinType>().oneOf(['EIN', 'SSN']).default('EIN'),
    });
    renderField({
      initialValues: { tin: '12345' },
      validationSchema: schema,
    });

    // Tabbing through marks the field as touched and triggers validation
    const input = screen.getByPlaceholderText('XX-XXXXXXX');
    await user.click(input);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByTestId('tin-error')).toHaveTextContent(/TIN must be EIN.*or SSN/i);
    });
  });

  it('updates the tinType companion field when the toggle flips', async () => {
    const user = userEvent.setup();
    renderField();

    expect(screen.getByTestId('tin-type')).toHaveTextContent('EIN');

    await user.click(screen.getByLabelText(/i'm an individual \(use ssn\)/i));
    await waitFor(() => {
      expect(screen.getByTestId('tin-type')).toHaveTextContent('SSN');
    });

    await user.click(screen.getByLabelText(/i'm an individual \(use ssn\)/i));
    await waitFor(() => {
      expect(screen.getByTestId('tin-type')).toHaveTextContent('EIN');
    });
  });

  it('accepts a valid EIN through Yup validation', () => {
    const schema = tinYupFragment().required();
    expect(schema.isValidSync('12-3456789')).toBe(true);
    expect(schema.isValidSync('123-45-6789')).toBe(true);
    expect(schema.isValidSync('12345')).toBe(false);
    expect(schema.isValidSync('abcdefghi')).toBe(false);
  });
});
