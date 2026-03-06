import React from 'react';
import { Formik, Form } from 'formik';
import { Stack } from '@mui/material';

/**
 * FormikDecorator wraps form field stories with a Formik context.
 * Provides form state management for demonstrating form fields in Storybook.
 */
export interface FormikDecoratorProps {
  initialValues?: Record<string, unknown>;
  children: React.ReactNode;
}

export const FormikDecorator: React.FC<FormikDecoratorProps> = ({
  initialValues = {},
  children,
}) => {
  return (
    <Formik
      initialValues={initialValues}
      onSubmit={(values) => {
        console.log('Form submitted:', values);
      }}
      validateOnChange
      validateOnBlur
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ minWidth: 300, maxWidth: 400 }}>
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, {
                  formik,
                });
              }
              return child;
            })}
          </Stack>
        </Form>
      )}
    </Formik>
  );
};

/**
 * Creates a mock formik object for testing or simple demos
 */
export const createMockFormik = (values: Record<string, unknown> = {}) => ({
  values,
  errors: {},
  touched: {},
  handleChange: () => {},
  handleBlur: () => {},
  setFieldValue: () => {},
});
