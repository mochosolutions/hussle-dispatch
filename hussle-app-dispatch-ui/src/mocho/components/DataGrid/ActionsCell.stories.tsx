import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { MemoryRouter } from 'react-router-dom';
import { Stack, Typography, Paper, Box } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArchiveIcon from '@mui/icons-material/Archive';
import PublishIcon from '@mui/icons-material/Publish';
import {
  ActionsCell,
  createActionsCell,
  createStandardCrudActionsConfig,
  ActionsCellConfig,
} from './ActionsCell';

// Sample data types for stories
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
}

interface Author {
  id: string;
  name: string;
  email: string;
}

/**
 * ActionsCell - A configurable action buttons component for AG Grid rows.
 *
 * Use this component to add View, Edit, Delete, or custom action buttons to AG Grid cells.
 * It supports navigation routing, custom callbacks, and conditional disabling.
 */
const meta: Meta<typeof ActionsCell> = {
  title: 'Components/Data Display/ActionsCell',
  component: ActionsCell,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ActionsCell>;

// Sample data
const samplePost: BlogPost = {
  id: 'post-123',
  title: 'Introduction to React',
  slug: 'introduction-to-react',
  status: 'published',
};

const sampleAuthor: Author = {
  id: 'author-456',
  name: 'John Doe',
  email: 'john@example.com',
};

/**
 * Default configuration with edit and delete actions
 */
export const Default: Story = {
  args: {
    data: samplePost,
    config: {
      showEdit: true,
      showDelete: true,
      getEditRoute: (data: BlogPost) => `/blog/edit/${data.id}`,
      onDelete: action('delete-clicked'),
    } as ActionsCellConfig<BlogPost>,
  },
};

/**
 * All standard actions - View, Edit, Delete
 */
export const AllActions: Story = {
  args: {
    data: samplePost,
    config: {
      showView: true,
      showEdit: true,
      showDelete: true,
      getViewRoute: (data: BlogPost) => `/blog/${data.slug}`,
      getEditRoute: (data: BlogPost) => `/blog/edit/${data.id}`,
      onDelete: action('delete-clicked'),
    } as ActionsCellConfig<BlogPost>,
  },
};

/**
 * View only action
 */
export const ViewOnly: Story = {
  args: {
    data: samplePost,
    config: {
      showView: true,
      showEdit: false,
      showDelete: false,
      getViewRoute: (data: BlogPost) => `/blog/${data.slug}`,
    } as ActionsCellConfig<BlogPost>,
  },
};

/**
 * Edit only action
 */
export const EditOnly: Story = {
  args: {
    data: sampleAuthor,
    config: {
      showView: false,
      showEdit: true,
      showDelete: false,
      getEditRoute: (data: Author) => `/authors/edit/${data.id}`,
    } as ActionsCellConfig<Author>,
  },
};

/**
 * Delete only action
 */
export const DeleteOnly: Story = {
  args: {
    data: samplePost,
    config: {
      showView: false,
      showEdit: false,
      showDelete: true,
      onDelete: action('delete-clicked'),
    } as ActionsCellConfig<BlogPost>,
  },
};

/**
 * External view link (opens in new tab)
 */
export const ExternalView: Story = {
  args: {
    data: samplePost,
    config: {
      showView: true,
      showEdit: true,
      showDelete: false,
      isExternalView: true,
      getViewRoute: (data: BlogPost) => `https://example.com/blog/${data.slug}`,
      getEditRoute: (data: BlogPost) => `/blog/edit/${data.id}`,
      viewTooltip: 'View on website',
    } as ActionsCellConfig<BlogPost>,
  },
};

/**
 * Custom tooltips
 */
export const CustomTooltips: Story = {
  args: {
    data: samplePost,
    config: {
      showView: true,
      showEdit: true,
      showDelete: true,
      getViewRoute: (data: BlogPost) => `/blog/${data.slug}`,
      getEditRoute: (data: BlogPost) => `/blog/edit/${data.id}`,
      onDelete: action('delete-clicked'),
      viewTooltip: 'Preview post',
      editTooltip: 'Edit post content',
      deleteTooltip: 'Remove post permanently',
    } as ActionsCellConfig<BlogPost>,
  },
};

/**
 * With custom action button
 */
export const WithCustomAction: Story = {
  args: {
    data: samplePost,
    config: {
      showEdit: true,
      showDelete: true,
      getEditRoute: (data: BlogPost) => `/blog/edit/${data.id}`,
      onDelete: action('delete-clicked'),
      onCustomAction: action('duplicate-clicked'),
      customActionIcon: <ContentCopyIcon fontSize="small" />,
      customActionTooltip: 'Duplicate post',
    } as ActionsCellConfig<BlogPost>,
  },
};

/**
 * With disabled actions based on row data
 */
export const ConditionalDisabling: Story = {
  render: () => {
    const publishedPost: BlogPost = { ...samplePost, status: 'published' };
    const draftPost: BlogPost = { ...samplePost, id: 'post-456', status: 'draft' };
    const archivedPost: BlogPost = { ...samplePost, id: 'post-789', status: 'archived' };

    const config: ActionsCellConfig<BlogPost> = {
      showEdit: true,
      showDelete: true,
      getEditRoute: (data: BlogPost) => `/blog/edit/${data.id}`,
      onDelete: action('delete-clicked'),
      isEditDisabled: (data: BlogPost) => data.status === 'archived',
      isDeleteDisabled: (data: BlogPost) => data.status === 'published',
    };

    return (
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Actions are conditionally disabled based on post status
        </Typography>
        <Paper sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ minWidth: 120 }}>
                Published Post:
              </Typography>
              <ActionsCell data={publishedPost} config={config} />
              <Typography variant="caption" color="text.secondary">
                (Delete disabled)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ minWidth: 120 }}>
                Draft Post:
              </Typography>
              <ActionsCell data={draftPost} config={config} />
              <Typography variant="caption" color="text.secondary">
                (All enabled)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ minWidth: 120 }}>
                Archived Post:
              </Typography>
              <ActionsCell data={archivedPost} config={config} />
              <Typography variant="caption" color="text.secondary">
                (Edit disabled)
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    );
  },
};

/**
 * Using createActionsCell factory function
 */
export const UsingFactory: Story = {
  render: () => {
    const AuthorActionsCell = createActionsCell<Author>({
      showEdit: true,
      showDelete: true,
      getEditRoute: (author) => `/authors/edit/${author.id}`,
      onDelete: (author) => action('delete-author')(author),
    });

    return (
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Created using createActionsCell factory
        </Typography>
        <AuthorActionsCell data={sampleAuthor} />
      </Stack>
    );
  },
};

/**
 * Using createStandardCrudActionsConfig helper
 */
export const UsingCrudHelper: Story = {
  render: () => {
    const config = createStandardCrudActionsConfig<BlogPost>({
      basePath: '/blog',
      viewOptions: {
        show: true,
        isExternal: true,
        getRoute: (post) => `https://example.com/blog/${post.slug}`,
      },
      editOptions: {
        show: true,
      },
      deleteOptions: {
        show: true,
        onDelete: action('crud-delete'),
      },
    });

    return (
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Created using createStandardCrudActionsConfig helper
        </Typography>
        <ActionsCell data={samplePost} config={config} />
      </Stack>
    );
  },
};

/**
 * Multiple custom actions
 */
export const MultipleCustomActions: Story = {
  render: () => {
    const config1: ActionsCellConfig<BlogPost> = {
      showEdit: true,
      showDelete: false,
      getEditRoute: (data) => `/blog/edit/${data.id}`,
      onCustomAction: action('archive-clicked'),
      customActionIcon: <ArchiveIcon fontSize="small" />,
      customActionTooltip: 'Archive post',
    };

    const config2: ActionsCellConfig<BlogPost> = {
      showEdit: true,
      showDelete: false,
      getEditRoute: (data) => `/blog/edit/${data.id}`,
      onCustomAction: action('publish-clicked'),
      customActionIcon: <PublishIcon fontSize="small" />,
      customActionTooltip: 'Publish post',
    };

    return (
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Different custom actions for different contexts
        </Typography>
        <Paper sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ minWidth: 150 }}>
                Published post actions:
              </Typography>
              <ActionsCell data={samplePost} config={config1} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ minWidth: 150 }}>
                Draft post actions:
              </Typography>
              <ActionsCell data={{ ...samplePost, status: 'draft' }} config={config2} />
            </Box>
          </Stack>
        </Paper>
      </Stack>
    );
  },
};
