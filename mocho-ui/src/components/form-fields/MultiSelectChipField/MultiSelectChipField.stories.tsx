import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Formik, Form } from 'formik';
import { MultiSelectChipField } from './index';
import { Stack, Typography, Button } from '@mui/material';
import * as Yup from 'yup';

/**
 * MultiSelectChipField is a multi-select dropdown with chip rendering for selected items.
 * Uses MUI Select component with Chip display and BaseFieldWrapper for consistent layout.
 */
const meta: Meta<typeof MultiSelectChipField> = {
  title: 'Components/Form Fields/MultiSelectChipField',
  component: MultiSelectChipField,
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
    required: {
      control: 'boolean',
      description: 'Mark as required',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MultiSelectChipField>;

const categoryOptions = [
  { value: 'tech', label: 'Technology' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'finance', label: 'Finance' },
];

const skillOptions = [
  { value: 'js', label: 'JavaScript' },
  { value: 'ts', label: 'TypeScript' },
  { value: 'react', label: 'React' },
  { value: 'node', label: 'Node.js' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

const tagOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'trending', label: 'Trending' },
  { value: 'popular', label: 'Popular' },
  { value: 'new', label: 'New' },
];

/**
 * Default multi-select field
 */
export const Default: Story = {
  render: () => (
    <Formik
      initialValues={{ categories: [] }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <MultiSelectChipField
              name="categories"
              label="Categories"
              options={categoryOptions}
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * With pre-selected values
 */
export const PreSelected: Story = {
  render: () => (
    <Formik
      initialValues={{ skills: ['js', 'react', 'ts'] }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <MultiSelectChipField
              name="skills"
              label="Skills"
              options={skillOptions}
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
      initialValues={{ tags: [] }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <MultiSelectChipField
              name="tags"
              label="Tags"
              options={tagOptions}
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
 * Many options
 */
export const ManyOptions: Story = {
  render: () => {
    const manyOptions = Array.from({ length: 20 }, (_, i) => ({
      value: `option${i + 1}`,
      label: `Option ${i + 1}`,
    }));

    return (
      <Formik
        initialValues={{ items: [] }}
        onSubmit={() => {}}
      >
        {(formik) => (
          <Form>
            <Stack spacing={2} sx={{ width: 400 }}>
              <MultiSelectChipField
                name="items"
                label="Select Items"
                options={manyOptions}
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
 * All options selected
 */
export const AllSelected: Story = {
  render: () => (
    <Formik
      initialValues={{ tags: tagOptions.map(opt => opt.value) }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 400 }}>
            <MultiSelectChipField
              name="tags"
              label="Tags (All Selected)"
              options={tagOptions}
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
      categories: Yup.array()
        .min(1, 'Select at least one category')
        .required('Required'),
    });

    return (
      <Formik
        initialValues={{ categories: [] }}
        initialTouched={{ categories: true }}
        validationSchema={validationSchema}
        onSubmit={() => {}}
      >
        {(formik) => (
          <Form>
            <Stack spacing={2} sx={{ width: 400 }}>
              <MultiSelectChipField
                name="categories"
                label="Categories"
                options={categoryOptions}
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
    const authorOptions = [
      { value: 'author1', label: 'John Doe' },
      { value: 'author2', label: 'Jane Smith' },
      { value: 'author3', label: 'Bob Johnson' },
    ];

    const validationSchema = Yup.object({
      authors: Yup.array()
        .min(1, 'Select at least one author')
        .required('Required'),
      categories: Yup.array()
        .min(1, 'Select at least one category')
        .required('Required'),
    });

    return (
      <Formik
        initialValues={{ authors: [], categories: [] }}
        validationSchema={validationSchema}
        onSubmit={(values) => alert(JSON.stringify(values, null, 2))}
      >
        {(formik) => (
          <Form>
            <Stack spacing={3} sx={{ width: 400 }}>
              <Typography variant="h6">Create Blog Post</Typography>

              <Typography variant="caption" color="text.secondary">
                [Title and content fields would go here]
              </Typography>

              <MultiSelectChipField
                name="authors"
                label="Authors"
                options={authorOptions}
                required
                formik={formik}
              />

              <MultiSelectChipField
                name="categories"
                label="Categories"
                options={categoryOptions}
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

/**
 * Job skills form example
 */
export const JobSkillsFormExample: Story = {
  render: () => {
    const validationSchema = Yup.object({
      requiredSkills: Yup.array()
        .min(1, 'Select at least one required skill')
        .required('Required'),
      preferredSkills: Yup.array(),
    });

    return (
      <Formik
        initialValues={{ requiredSkills: [], preferredSkills: [] }}
        validationSchema={validationSchema}
        onSubmit={(values) => alert(JSON.stringify(values, null, 2))}
      >
        {(formik) => (
          <Form>
            <Stack spacing={3} sx={{ width: 400 }}>
              <Typography variant="h6">Job Requirements</Typography>

              <MultiSelectChipField
                name="requiredSkills"
                label="Required Skills"
                options={skillOptions}
                required
                formik={formik}
              />

              <MultiSelectChipField
                name="preferredSkills"
                label="Preferred Skills (Optional)"
                options={skillOptions}
                formik={formik}
              />

              <Button type="submit" variant="contained" fullWidth>
                Save Requirements
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    );
  },
};
