import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Formik, Form } from 'formik';
import { DocumentImageUploadField } from './index';
import { Stack, Typography, Button } from '@mui/material';

/**
 * DocumentImageUploadField is a file upload using presigned URLs with processing status.
 * Features real-time upload progress, processing status polling, and CDN preview.
 *
 * Note: This component requires the useDocumentUpload hook to be properly configured
 * with API endpoints for document upload.
 */
const meta: Meta<typeof DocumentImageUploadField> = {
  title: 'Components/Form Fields/DocumentImageUploadField',
  component: DocumentImageUploadField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'Field name for document ID',
    },
    urlFieldName: {
      control: 'text',
      description: 'Field name for preview URL',
    },
    label: {
      control: 'text',
      description: 'Field label',
    },
    category: {
      control: 'select',
      options: ['blog-hero', 'profile-avatar', 'profile-cover', 'general'],
      description: 'Document category for processing',
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
type Story = StoryObj<typeof DocumentImageUploadField>;

/**
 * Default document image upload
 * Note: Requires API connection for actual upload functionality
 */
export const Default: Story = {
  render: () => (
    <Formik
      initialValues={{ documentId: null }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <DocumentImageUploadField
              name="documentId"
              label="Upload Image"
              category="general"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Blog hero image category
 */
export const BlogHeroImage: Story = {
  render: () => (
    <Formik
      initialValues={{ heroDocumentId: null, heroUrl: null }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 450 }}>
            <DocumentImageUploadField
              name="heroDocumentId"
              urlFieldName="heroUrl"
              label="Hero Image"
              category="blog-hero"
              previewHeight={200}
              helperText="Will be processed and optimized for web delivery"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Profile avatar category
 */
export const ProfileAvatar: Story = {
  render: () => (
    <Formik
      initialValues={{ avatarDocId: null, avatarUrl: null }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <DocumentImageUploadField
              name="avatarDocId"
              urlFieldName="avatarUrl"
              label="Profile Picture"
              category="profile-avatar"
              previewHeight={150}
              maxSizeMB={2}
              helperText="Square image recommended (min 200x200)"
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
      initialValues={{ imageDoc: null }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <DocumentImageUploadField
              name="imageDoc"
              label="Document Image"
              category="general"
              helperText="Uploads to CDN with automatic image optimization"
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
      initialValues={{ thumbnailDoc: null }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <DocumentImageUploadField
              name="thumbnailDoc"
              label="Thumbnail"
              category="general"
              maxSizeMB={1}
              helperText="Max file size: 1MB"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Tall preview for banners
 */
export const TallPreview: Story = {
  render: () => (
    <Formik
      initialValues={{ bannerDocId: null, bannerUrl: null }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 500 }}>
            <DocumentImageUploadField
              name="bannerDocId"
              urlFieldName="bannerUrl"
              label="Banner Image"
              category="profile-cover"
              previewHeight={250}
              helperText="Recommended: 1500x500 pixels"
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
        documentId: 'existing-doc-123',
        previewUrl: 'https://via.placeholder.com/800x400/9b59b6/ffffff?text=Existing+Document+Image',
      }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 450 }}>
            <DocumentImageUploadField
              name="documentId"
              urlFieldName="previewUrl"
              label="Document Image"
              category="general"
              helperText="Click to replace the existing image"
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
        heroDocumentId: null,
        heroUrl: null,
      }}
      onSubmit={(values) => {
        if (values.heroDocumentId) {
          alert(`Post saved with document ID: ${values.heroDocumentId}`);
        } else {
          alert('Post saved without hero image.');
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

            <DocumentImageUploadField
              name="heroDocumentId"
              urlFieldName="heroUrl"
              label="Hero Image"
              category="blog-hero"
              previewHeight={200}
              maxSizeMB={5}
              helperText="Uploads immediately. Image will be processed and optimized."
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
 * Multi-image profile form example
 */
export const ProfileFormExample: Story = {
  render: () => (
    <Formik
      initialValues={{
        avatarDocId: null,
        avatarUrl: null,
        coverDocId: null,
        coverUrl: null,
      }}
      onSubmit={(values) => {
        const updates = [];
        if (values.avatarDocId) updates.push(`Avatar: ${values.avatarDocId}`);
        if (values.coverDocId) updates.push(`Cover: ${values.coverDocId}`);

        if (updates.length > 0) {
          alert(`Profile updated:\n${updates.join('\n')}`);
        } else {
          alert('No changes to save.');
        }
      }}
    >
      {(formik) => (
        <Form>
          <Stack spacing={3} sx={{ width: 450 }}>
            <Typography variant="h6">Profile Settings</Typography>

            <DocumentImageUploadField
              name="avatarDocId"
              urlFieldName="avatarUrl"
              label="Profile Picture"
              category="profile-avatar"
              previewHeight={150}
              maxSizeMB={2}
              helperText="Will be resized to 400x400 and 100x100"
              formik={formik}
            />

            <DocumentImageUploadField
              name="coverDocId"
              urlFieldName="coverUrl"
              label="Cover Photo"
              category="profile-cover"
              previewHeight={150}
              maxSizeMB={5}
              helperText="Will be resized for optimal display"
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
