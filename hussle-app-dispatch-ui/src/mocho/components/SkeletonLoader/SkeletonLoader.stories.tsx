import type { Meta, StoryObj } from '@storybook/react';
import { Box, Stack } from '@mui/material';
import { ListSkeleton, FormSkeleton } from './index';

/**
 * Skeleton loaders for list and form views.
 * Used to show loading states for data grids, tables, and forms.
 */
const meta: Meta = {
  title: 'Components/Data Display/SkeletonLoader',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

// ==================== ListSkeleton Stories ====================

type ListSkeletonStory = StoryObj<typeof ListSkeleton>;

export const ListDefault: ListSkeletonStory = {
  name: 'List Skeleton - Default',
  render: () => <ListSkeleton />,
};

export const ListWithManyRows: ListSkeletonStory = {
  name: 'List Skeleton - Many Rows',
  render: () => <ListSkeleton rows={10} />,
};

export const ListWithoutHeader: ListSkeletonStory = {
  name: 'List Skeleton - No Header',
  render: () => <ListSkeleton showHeader={false} />,
};

export const ListWithoutActions: ListSkeletonStory = {
  name: 'List Skeleton - No Actions',
  render: () => <ListSkeleton showActions={false} />,
};

export const ListMinimal: ListSkeletonStory = {
  name: 'List Skeleton - Minimal',
  render: () => <ListSkeleton showHeader={false} showActions={false} rows={3} />,
};

export const ListCustomRowHeight: ListSkeletonStory = {
  name: 'List Skeleton - Custom Row Height',
  render: () => <ListSkeleton rowHeight={80} rowSpacing={2} />,
};

// ==================== FormSkeleton Stories ====================

type FormSkeletonStory = StoryObj<typeof FormSkeleton>;

export const FormDefault: FormSkeletonStory = {
  name: 'Form Skeleton - Default',
  render: () => <FormSkeleton />,
};

export const FormManyFields: FormSkeletonStory = {
  name: 'Form Skeleton - Many Fields',
  render: () => <FormSkeleton fields={10} />,
};

export const FormWithRichEditor: FormSkeletonStory = {
  name: 'Form Skeleton - With Rich Editor',
  render: () => <FormSkeleton showRichEditor={true} />,
};

export const FormWithoutBackButton: FormSkeletonStory = {
  name: 'Form Skeleton - No Back Button',
  render: () => <FormSkeleton showBackButton={false} />,
};

export const FormWithoutTitle: FormSkeletonStory = {
  name: 'Form Skeleton - No Title',
  render: () => <FormSkeleton showTitle={false} />,
};

export const FormWithoutActions: FormSkeletonStory = {
  name: 'Form Skeleton - No Actions',
  render: () => <FormSkeleton showActions={false} />,
};

export const FormWithoutCard: FormSkeletonStory = {
  name: 'Form Skeleton - No Card Wrapper',
  render: () => (
    <Box sx={{ bgcolor: 'background.default', p: 3 }}>
      <FormSkeleton showCard={false} />
    </Box>
  ),
};

export const FormMinimal: FormSkeletonStory = {
  name: 'Form Skeleton - Minimal',
  render: () => (
    <FormSkeleton
      fields={3}
      showBackButton={false}
      showTitle={false}
      showActions={false}
    />
  ),
};

export const FormBlogPost: FormSkeletonStory = {
  name: 'Form Skeleton - Blog Post Form',
  render: () => (
    <FormSkeleton
      fields={6}
      showRichEditor={true}
      showBackButton={true}
      showTitle={true}
    />
  ),
};

// ==================== Combined Examples ====================

export const SideBySideComparison: StoryObj = {
  name: 'Side by Side Comparison',
  render: () => (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
      <Box flex={1}>
        <Box sx={{ typography: 'h6', mb: 2 }}>List Skeleton</Box>
        <ListSkeleton rows={3} />
      </Box>
      <Box flex={1}>
        <Box sx={{ typography: 'h6', mb: 2 }}>Form Skeleton</Box>
        <FormSkeleton fields={3} />
      </Box>
    </Stack>
  ),
};

export const FullPageList: StoryObj = {
  name: 'Full Page - List View',
  render: () => (
    <Box sx={{ height: '600px', bgcolor: 'background.default', p: 2 }}>
      <ListSkeleton rows={8} />
    </Box>
  ),
};

export const FullPageForm: StoryObj = {
  name: 'Full Page - Form View',
  render: () => (
    <Box sx={{ maxWidth: 800, mx: 'auto', bgcolor: 'background.default', p: 2 }}>
      <FormSkeleton fields={8} showRichEditor={true} />
    </Box>
  ),
};
