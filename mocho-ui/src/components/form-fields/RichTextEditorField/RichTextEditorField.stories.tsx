import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Formik, Form } from 'formik';
import { RichTextEditorField } from './index';
import { Stack, Typography, Button } from '@mui/material';
import * as Yup from 'yup';

/**
 * RichTextEditorField is a TiptapEditor wrapped as a form-field with Formik integration.
 * Features full rich text editing capabilities including formatting, links, and images.
 */
const meta: Meta<typeof RichTextEditorField> = {
  title: 'Components/Form Fields/RichTextEditorField',
  component: RichTextEditorField,
  parameters: {
    layout: 'padded',
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
    required: {
      control: 'boolean',
      description: 'Mark as required',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    minHeight: {
      control: 'number',
      description: 'Minimum editor height in pixels',
    },
    maxHeight: {
      control: 'number',
      description: 'Maximum editor height in pixels',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RichTextEditorField>;

/**
 * Default rich text editor
 */
export const Default: Story = {
  render: () => (
    <Formik
      initialValues={{ content: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 600 }}>
            <RichTextEditorField
              name="content"
              label="Content"
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
      initialValues={{ body: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 600 }}>
            <RichTextEditorField
              name="body"
              label="Article Body"
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
 * With placeholder
 */
export const WithPlaceholder: Story = {
  render: () => (
    <Formik
      initialValues={{ description: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 600 }}>
            <RichTextEditorField
              name="description"
              label="Description"
              placeholder="Write your description here..."
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * With pre-filled HTML content
 */
export const PreFilled: Story = {
  render: () => (
    <Formik
      initialValues={{
        content: `
          <h2>Welcome to the Editor</h2>
          <p>This is a <strong>rich text editor</strong> with <em>formatting</em> support.</p>
          <ul>
            <li>Bold and italic text</li>
            <li>Ordered and unordered lists</li>
            <li>Code blocks and inline code</li>
            <li>Blockquotes</li>
          </ul>
          <blockquote>This is a blockquote example.</blockquote>
          <p>You can also add <code>inline code</code> like this.</p>
        `,
      }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 600 }}>
            <RichTextEditorField
              name="content"
              label="Content"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Custom height constraints
 */
export const CustomHeight: Story = {
  render: () => (
    <Formik
      initialValues={{ notes: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 600 }}>
            <RichTextEditorField
              name="notes"
              label="Notes"
              minHeight={200}
              maxHeight={300}
              placeholder="Short notes..."
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Tall editor for long content
 */
export const TallEditor: Story = {
  render: () => (
    <Formik
      initialValues={{ article: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 700 }}>
            <RichTextEditorField
              name="article"
              label="Article"
              minHeight={500}
              maxHeight={800}
              placeholder="Write your full article here..."
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * With validation error
 */
export const WithError: Story = {
  render: () => {
    const validationSchema = Yup.object({
      content: Yup.string()
        .min(50, 'Content must be at least 50 characters')
        .required('Content is required'),
    });

    return (
      <Formik
        initialValues={{ content: '<p>Short</p>' }}
        initialTouched={{ content: true }}
        validationSchema={validationSchema}
        onSubmit={() => {}}
      >
        {(formik) => (
          <Form>
            <Stack spacing={2} sx={{ width: 600 }}>
              <RichTextEditorField
                name="content"
                label="Content"
                required
                formik={formik}
              />
            </Stack>
          </Form>
        )}
      </Formik>
    );
  },
};

/**
 * Blog post form example
 */
export const BlogPostFormExample: Story = {
  render: () => {
    const validationSchema = Yup.object({
      content: Yup.string()
        .min(100, 'Blog post content must be at least 100 characters')
        .required('Content is required'),
    });

    return (
      <Formik
        initialValues={{ content: '' }}
        validationSchema={validationSchema}
        onSubmit={(values) => {
          console.log('Submitted HTML:', values.content);
          alert('Blog post saved!');
        }}
      >
        {(formik) => (
          <Form>
            <Stack spacing={3} sx={{ width: 700 }}>
              <Typography variant="h5">Create Blog Post</Typography>

              <Typography variant="caption" color="text.secondary">
                [Title and meta fields would go here]
              </Typography>

              <RichTextEditorField
                name="content"
                label="Post Content"
                required
                minHeight={400}
                maxHeight={600}
                placeholder="Write your blog post content here..."
                formik={formik}
              />

              <Button type="submit" variant="contained">
                Publish Post
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    );
  },
};

/**
 * Email template form example
 */
export const EmailTemplateExample: Story = {
  render: () => (
    <Formik
      initialValues={{
        emailBody: `
          <p>Dear Customer,</p>
          <p>Thank you for your recent purchase!</p>
          <p>Best regards,<br/>The Team</p>
        `,
      }}
      onSubmit={(values) => alert('Email template saved!')}
    >
      {(formik) => (
        <Form>
          <Stack spacing={3} sx={{ width: 600 }}>
            <Typography variant="h6">Email Template</Typography>

            <Typography variant="caption" color="text.secondary">
              [Subject line field would go here]
            </Typography>

            <RichTextEditorField
              name="emailBody"
              label="Email Body"
              minHeight={300}
              maxHeight={500}
              formik={formik}
            />

            <Button type="submit" variant="contained">
              Save Template
            </Button>
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};
