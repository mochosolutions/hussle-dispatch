import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Formik, Form } from 'formik';
import { ImageUploadField } from './index';
import { Stack, Typography, Button } from '@mui/material';

/**
 * ImageUploadField is a file upload with image preview, validation, and remove functionality.
 * Features client-side validation, blob URL preview, and edit mode support.
 */
const meta: Meta<typeof ImageUploadField> = {
  title: 'Components/Form Fields/ImageUploadField',
  component: ImageUploadField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'Field name for the File object',
    },
    urlFieldName: {
      control: 'text',
      description: 'Field name for existing URL (edit mode)',
    },
    label: {
      control: 'text',
      description: 'Field label',
    },
    accept: {
      control: 'text',
      description: 'Accept attribute for file input',
    },
    maxSizeMB: {
      control: 'number',
      description: 'Maximum file size in MB',
    },
    previewHeight: {
      control: 'number',
      description: 'Height of preview area in pixels',
    },
    helperText: {
      control: 'text',
      description: 'Helper text below the field',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImageUploadField>;

/**
 * Default image upload field
 */
export const Default: Story = {
  render: () => (
    <Formik
      initialValues={{ image: null }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <ImageUploadField
              name="image"
              label="Upload Image"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * With helper text
 */
export const WithHelperText: Story = {
  render: () => (
    <Formik
      initialValues={{ photo: null }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <ImageUploadField
              name="photo"
              label="Profile Photo"
              helperText="Recommended size: 400x400 pixels"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Custom max file size
 */
export const CustomMaxSize: Story = {
  render: () => (
    <Formik
      initialValues={{ thumbnail: null }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <ImageUploadField
              name="thumbnail"
              label="Thumbnail"
              maxSizeMB={2}
              helperText="Max file size: 2MB"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Custom preview height
 */
export const TallPreview: Story = {
  render: () => (
    <Formik
      initialValues={{ banner: null }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <ImageUploadField
              name="banner"
              label="Banner Image"
              previewHeight={300}
              helperText="Recommended: 1200x400 pixels"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Short preview height
 */
export const ShortPreview: Story = {
  render: () => (
    <Formik
      initialValues={{ icon: null }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <ImageUploadField
              name="icon"
              label="Icon"
              previewHeight={100}
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Accept only specific formats
 */
export const AcceptPngOnly: Story = {
  render: () => (
    <Formik
      initialValues={{ logo: null }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <ImageUploadField
              name="logo"
              label="Logo (PNG only)"
              accept="image/png"
              helperText="Only PNG files are accepted"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Edit mode with existing URL
 */
export const EditMode: Story = {
  render: () => (
    <Formik
      initialValues={{
        heroImage: null,
        heroImageUrl: 'https://via.placeholder.com/800x400/3498db/ffffff?text=Existing+Image',
      }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <ImageUploadField
              name="heroImage"
              urlFieldName="heroImageUrl"
              label="Hero Image"
              helperText="Click 'Select Image' to replace"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Blog post form example
 */
export const BlogPostFormExample: Story = {
  render: () => (
    <Formik
      initialValues={{
        title: '',
        heroImage: null,
      }}
      onSubmit={(values) => {
        console.log('Submitted:', values);
        alert('Blog post saved!');
      }}
    >
      {(formik) => (
        <Form>
          <Stack spacing={3} sx={{ width: 450 }}>
            <Typography variant="h6">Create Blog Post</Typography>

            <Typography variant="caption" color="text.secondary">
              [Title and content fields would go here]
            </Typography>

            <ImageUploadField
              name="heroImage"
              label="Hero Image"
              previewHeight={200}
              maxSizeMB={5}
              helperText="Recommended: 1200x630 pixels for social sharing"
              formik={formik}
            />

            <Button type="submit" variant="contained" fullWidth>
              Save Post
            </Button>
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Profile settings form example
 */
export const ProfileSettingsExample: Story = {
  render: () => (
    <Formik
      initialValues={{
        avatar: null,
        coverImage: null,
      }}
      onSubmit={(values) => alert('Profile updated!')}
    >
      {(formik) => (
        <Form>
          <Stack spacing={3} sx={{ width: 450 }}>
            <Typography variant="h6">Profile Settings</Typography>

            <ImageUploadField
              name="avatar"
              label="Profile Picture"
              previewHeight={150}
              maxSizeMB={2}
              helperText="Square image, min 200x200 pixels"
              formik={formik}
            />

            <ImageUploadField
              name="coverImage"
              label="Cover Photo"
              previewHeight={150}
              maxSizeMB={5}
              helperText="Recommended: 1500x500 pixels"
              formik={formik}
            />

            <Button type="submit" variant="contained" fullWidth>
              Save Changes
            </Button>
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};
