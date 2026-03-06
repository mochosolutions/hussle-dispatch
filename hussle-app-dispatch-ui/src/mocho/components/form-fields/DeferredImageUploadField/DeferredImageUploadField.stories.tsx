import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Formik, Form } from 'formik';
import { DeferredImageUploadField } from './index';
import { Stack, Typography, Button } from '@mui/material';

/**
 * DeferredImageUploadField is a file upload with deferred upload pattern.
 * Shows blob URL preview immediately without network request, stores file in form state
 * for upload on form submit.
 */
const meta: Meta<typeof DeferredImageUploadField> = {
  title: 'Components/Form Fields/DeferredImageUploadField',
  component: DeferredImageUploadField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'Field name for storing HeroImageState',
    },
    existingUrlFieldName: {
      control: 'text',
      description: 'Field name for existing URL (edit mode)',
    },
    label: {
      control: 'text',
      description: 'Field label',
    },
    accept: {
      control: 'text',
      description: 'Accepted file types',
    },
    maxSizeMB: {
      control: 'number',
      description: 'Maximum file size in MB',
    },
    previewHeight: {
      control: 'number',
      description: 'Preview height in pixels',
    },
    helperText: {
      control: 'text',
      description: 'Helper text below the field',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DeferredImageUploadField>;

/**
 * Default deferred image upload
 */
export const Default: Story = {
  render: () => (
    <Formik
      initialValues={{ heroImage: null }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <DeferredImageUploadField
              name="heroImage"
              label="Hero Image"
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
      initialValues={{ thumbnail: null }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <DeferredImageUploadField
              name="thumbnail"
              label="Thumbnail"
              helperText="Image will be uploaded when you save the form"
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
      initialValues={{ image: null }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <DeferredImageUploadField
              name="image"
              label="Image (Max 2MB)"
              maxSizeMB={2}
              helperText="Maximum file size: 2MB"
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
          <Stack spacing={2} sx={{ width: 450 }}>
            <DeferredImageUploadField
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
 * Edit mode with existing URL
 */
export const EditMode: Story = {
  render: () => (
    <Formik
      initialValues={{
        heroImage: null,
        existingHeroUrl: 'https://via.placeholder.com/800x400/2ecc71/ffffff?text=Existing+Hero+Image',
      }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <DeferredImageUploadField
              name="heroImage"
              existingUrlFieldName="existingHeroUrl"
              label="Hero Image"
              helperText="Click 'Change Image' to replace the current image"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Accept only PNG files
 */
export const PngOnly: Story = {
  render: () => (
    <Formik
      initialValues={{ logo: null }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <DeferredImageUploadField
              name="logo"
              label="Logo (PNG Only)"
              accept="image/png"
              helperText="Only PNG files are accepted for logos"
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
        if (values.heroImage) {
          console.log('Hero image to upload:', values.heroImage);
          alert('Form submitted! Image will be uploaded to server.');
        } else {
          alert('Form submitted without image.');
        }
      }}
    >
      {(formik) => (
        <Form>
          <Stack spacing={3} sx={{ width: 500 }}>
            <Typography variant="h6">Create Blog Post</Typography>

            <Typography variant="caption" color="text.secondary">
              [Title and content fields would go here]
            </Typography>

            <DeferredImageUploadField
              name="heroImage"
              label="Hero Image"
              maxSizeMB={5}
              previewHeight={200}
              helperText="Recommended: 1200x630 pixels. Image will be uploaded when you save."
              formik={formik}
            />

            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" fullWidth>
                Save Post
              </Button>
              <Button type="button" variant="outlined" onClick={() => formik.resetForm()}>
                Reset
              </Button>
            </Stack>
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Profile form example
 */
export const ProfileFormExample: Story = {
  render: () => (
    <Formik
      initialValues={{
        avatar: null,
        coverPhoto: null,
      }}
      onSubmit={(values) => {
        const uploads = [];
        if (values.avatar) uploads.push('avatar');
        if (values.coverPhoto) uploads.push('cover photo');

        if (uploads.length > 0) {
          alert(`Uploading: ${uploads.join(', ')}`);
        } else {
          alert('No images to upload.');
        }
      }}
    >
      {(formik) => (
        <Form>
          <Stack spacing={3} sx={{ width: 450 }}>
            <Typography variant="h6">Profile Settings</Typography>

            <DeferredImageUploadField
              name="avatar"
              label="Profile Picture"
              previewHeight={150}
              maxSizeMB={2}
              helperText="Square image recommended (min 200x200)"
              formik={formik}
            />

            <DeferredImageUploadField
              name="coverPhoto"
              label="Cover Photo"
              previewHeight={150}
              maxSizeMB={5}
              helperText="Recommended: 1500x500 pixels"
              formik={formik}
            />

            <Button type="submit" variant="contained" fullWidth>
              Save Profile
            </Button>
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};
