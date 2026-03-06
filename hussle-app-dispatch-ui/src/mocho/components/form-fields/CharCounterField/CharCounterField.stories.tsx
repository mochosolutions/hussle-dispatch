import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Formik, Form } from 'formik';
import { CharCounterField } from './index';
import { Stack, Typography, Button } from '@mui/material';
import * as Yup from 'yup';

/**
 * CharCounterField is a multiline textarea with character counter display.
 * Features real-time character count and uses BaseFieldWrapper for consistent layout.
 */
const meta: Meta<typeof CharCounterField> = {
  title: 'Components/Form Fields/CharCounterField',
  component: CharCounterField,
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
      description: 'Field label',
    },
    maxLength: {
      control: 'number',
      description: 'Maximum character length',
    },
    rows: {
      control: 'number',
      description: 'Number of visible rows',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the field',
    },
    required: {
      control: 'boolean',
      description: 'Mark as required',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CharCounterField>;

/**
 * Default character counter field
 */
export const Default: Story = {
  render: () => (
    <Formik
      initialValues={{ description: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <CharCounterField
              name="description"
              label="Description"
              maxLength={200}
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * With placeholder
 */
export const WithPlaceholder: Story = {
  render: () => (
    <Formik
      initialValues={{ bio: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <CharCounterField
              name="bio"
              label="Bio"
              maxLength={150}
              placeholder="Tell us about yourself..."
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Required field
 */
export const Required: Story = {
  render: () => (
    <Formik
      initialValues={{ summary: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <CharCounterField
              name="summary"
              label="Summary"
              maxLength={100}
              required
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Custom row count
 */
export const CustomRows: Story = {
  render: () => (
    <Formik
      initialValues={{ content: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <CharCounterField
              name="content"
              label="Content"
              maxLength={500}
              rows={8}
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * With pre-filled content
 */
export const PreFilled: Story = {
  render: () => (
    <Formik
      initialValues={{ message: 'This is an example message that has some pre-filled content to demonstrate the character counter in action.' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <CharCounterField
              name="message"
              label="Message"
              maxLength={200}
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  render: () => (
    <Formik
      initialValues={{ notes: 'These notes cannot be edited' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <CharCounterField
              name="notes"
              label="Notes"
              maxLength={150}
              disabled
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Short max length (Twitter-style)
 */
export const ShortMaxLength: Story = {
  render: () => (
    <Formik
      initialValues={{ tweet: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <CharCounterField
              name="tweet"
              label="Tweet"
              maxLength={280}
              rows={3}
              placeholder="What's happening?"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Long max length
 */
export const LongMaxLength: Story = {
  render: () => (
    <Formik
      initialValues={{ article: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <CharCounterField
              name="article"
              label="Article Content"
              maxLength={5000}
              rows={10}
              placeholder="Write your article..."
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Form example with validation
 */
export const FormExample: Story = {
  render: () => {
    const validationSchema = Yup.object({
      title: Yup.string()
        .max(50, 'Title must be 50 characters or less')
        .required('Title is required'),
      excerpt: Yup.string()
        .max(160, 'Excerpt must be 160 characters or less')
        .required('Excerpt is required'),
    });

    return (
      <Formik
        initialValues={{ title: '', excerpt: '' }}
        validationSchema={validationSchema}
        onSubmit={(values) => alert(JSON.stringify(values, null, 2))}
      >
        {(formik) => (
          <Form>
            <Stack spacing={3} sx={{ width: 400 }}>
              <Typography variant="h6">Create Post</Typography>

              <CharCounterField
                name="title"
                label="Title"
                maxLength={50}
                rows={1}
                required
                formik={formik}
              />

              <CharCounterField
                name="excerpt"
                label="Excerpt"
                maxLength={160}
                rows={3}
                placeholder="Brief summary of the post..."
                required
                formik={formik}
              />

              <Button type="submit" variant="contained" fullWidth>
                Create Post
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    );
  },
};
