import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Formik, Form } from 'formik';
import { CheckboxField } from './index';
import { Stack, Typography, Button } from '@mui/material';
import * as Yup from 'yup';

/**
 * CheckboxField is a checkbox input with label.
 * Features FormControlLabel wrapper and configurable colors (primary/secondary).
 */
const meta: Meta<typeof CheckboxField> = {
  title: 'Components/Form Fields/CheckboxField',
  component: CheckboxField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'Field name for Formik',
    },
    label: {
      control: 'text',
      description: 'Checkbox label text',
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary'],
      description: 'Checkbox color',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CheckboxField>;

/**
 * Default checkbox (unchecked)
 */
export const Default: Story = {
  render: () => (
    <Formik
      initialValues={{ agree: false }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <CheckboxField
            name="agree"
            label="I agree to the terms and conditions"
            formik={formik}
          />
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Pre-checked
 */
export const Checked: Story = {
  render: () => (
    <Formik
      initialValues={{ subscribe: true }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <CheckboxField
            name="subscribe"
            label="Subscribe to newsletter"
            formik={formik}
          />
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Primary color (default)
 */
export const PrimaryColor: Story = {
  render: () => (
    <Formik
      initialValues={{ option: true }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <CheckboxField
            name="option"
            label="Primary color checkbox"
            color="primary"
            formik={formik}
          />
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Secondary color
 */
export const SecondaryColor: Story = {
  render: () => (
    <Formik
      initialValues={{ option: true }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <CheckboxField
            name="option"
            label="Secondary color checkbox"
            color="secondary"
            formik={formik}
          />
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Multiple checkboxes
 */
export const MultipleCheckboxes: Story = {
  render: () => (
    <Formik
      initialValues={{
        email: true,
        sms: false,
        push: true,
      }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={1}>
            <Typography variant="subtitle2">Notification Preferences</Typography>
            <CheckboxField
              name="email"
              label="Email notifications"
              formik={formik}
            />
            <CheckboxField
              name="sms"
              label="SMS notifications"
              formik={formik}
            />
            <CheckboxField
              name="push"
              label="Push notifications"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Terms acceptance form
 */
export const TermsAcceptanceForm: Story = {
  render: () => {
    const validationSchema = Yup.object({
      terms: Yup.boolean()
        .oneOf([true], 'You must accept the terms and conditions')
        .required('Required'),
      privacy: Yup.boolean()
        .oneOf([true], 'You must accept the privacy policy')
        .required('Required'),
    });

    return (
      <Formik
        initialValues={{ terms: false, privacy: false }}
        validationSchema={validationSchema}
        onSubmit={(values) => alert('Form submitted')}
      >
        {(formik) => (
          <Form>
            <Stack spacing={2} sx={{ width: 350 }}>
              <Typography variant="h6">Create Account</Typography>

              <Typography variant="caption" color="text.secondary">
                [Form fields would go here]
              </Typography>

              <Stack spacing={1}>
                <CheckboxField
                  name="terms"
                  label="I agree to the Terms of Service"
                  formik={formik}
                />
                {formik.touched.terms && formik.errors.terms && (
                  <Typography color="error" variant="caption">
                    {formik.errors.terms}
                  </Typography>
                )}

                <CheckboxField
                  name="privacy"
                  label="I accept the Privacy Policy"
                  formik={formik}
                />
                {formik.touched.privacy && formik.errors.privacy && (
                  <Typography color="error" variant="caption">
                    {formik.errors.privacy}
                  </Typography>
                )}
              </Stack>

              <Button type="submit" variant="contained" fullWidth>
                Create Account
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    );
  },
};

/**
 * Settings form example
 */
export const SettingsFormExample: Story = {
  render: () => (
    <Formik
      initialValues={{
        darkMode: false,
        notifications: true,
        autoSave: true,
        analytics: false,
      }}
      onSubmit={(values) => alert(JSON.stringify(values, null, 2))}
    >
      {(formik) => (
        <Form>
          <Stack spacing={3} sx={{ width: 350 }}>
            <Typography variant="h6">App Settings</Typography>

            <Stack spacing={1}>
              <Typography variant="subtitle2">Appearance</Typography>
              <CheckboxField
                name="darkMode"
                label="Enable dark mode"
                formik={formik}
              />
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2">Features</Typography>
              <CheckboxField
                name="notifications"
                label="Enable notifications"
                formik={formik}
              />
              <CheckboxField
                name="autoSave"
                label="Auto-save changes"
                formik={formik}
              />
              <CheckboxField
                name="analytics"
                label="Share usage analytics"
                formik={formik}
              />
            </Stack>

            <Button type="submit" variant="contained">
              Save Settings
            </Button>
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};
