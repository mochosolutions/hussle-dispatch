import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import NewDataGrid from './index';

/**
 * NewDataGrid - AG Grid wrapper component with built-in loading, error, and no-data states.
 *
 * Use this component when you need a data table with automatic handling of common states
 * like loading, error, and empty data. It integrates with MUI theming.
 */
const meta: Meta<typeof NewDataGrid> = {
  title: 'Components/Data Display/NewDataGrid',
  component: NewDataGrid,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    columnDefs: {
      control: 'object',
      description: 'AG Grid column definitions',
    },
    rowData: {
      control: 'object',
      description: 'Array of row data to display',
    },
    defaultColDef: {
      control: 'object',
      description: 'Default column definition applied to all columns',
    },
    gridOptions: {
      control: 'object',
      description: 'Additional AG Grid options',
    },
    loading: {
      control: 'boolean',
      description: 'Whether the grid is in loading state',
    },
    error: {
      control: 'boolean',
      description: 'Whether the grid is in error state',
    },
    noDataMessage: {
      control: 'text',
      description: 'Custom message for empty data state',
    },
  },
  decorators: [
    (Story) => (
      <Box sx={{ height: 400, width: '100%' }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NewDataGrid>;

// Sample column definitions
const columnDefs = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'title', headerName: 'Title', flex: 1, minWidth: 200 },
  { field: 'author', headerName: 'Author', width: 150 },
  { field: 'status', headerName: 'Status', width: 120 },
  { field: 'publishedAt', headerName: 'Published', width: 150 },
];

// Sample row data
const sampleRowData = [
  {
    id: 1,
    title: 'Introduction to React',
    author: 'John Doe',
    status: 'Published',
    publishedAt: '2024-01-15',
  },
  {
    id: 2,
    title: 'Advanced TypeScript Patterns',
    author: 'Jane Smith',
    status: 'Draft',
    publishedAt: '-',
  },
  {
    id: 3,
    title: 'Building APIs with Express',
    author: 'Bob Johnson',
    status: 'Published',
    publishedAt: '2024-01-10',
  },
  {
    id: 4,
    title: 'State Management with Redux',
    author: 'Alice Brown',
    status: 'Published',
    publishedAt: '2024-01-08',
  },
  {
    id: 5,
    title: 'Testing React Components',
    author: 'Charlie Wilson',
    status: 'Draft',
    publishedAt: '-',
  },
];

const defaultColDef = {
  sortable: true,
  filter: true,
  resizable: true,
};

/**
 * Default grid with data
 */
export const Default: Story = {
  args: {
    columnDefs,
    rowData: sampleRowData,
    defaultColDef,
    loading: false,
    error: false,
  },
};

/**
 * Loading state with spinner
 */
export const Loading: Story = {
  args: {
    columnDefs,
    rowData: [],
    defaultColDef,
    loading: true,
    error: false,
  },
};

/**
 * Error state
 */
export const Error: Story = {
  args: {
    columnDefs,
    rowData: [],
    defaultColDef,
    loading: false,
    error: true,
  },
};

/**
 * Empty data state with default message
 */
export const NoData: Story = {
  args: {
    columnDefs,
    rowData: [],
    defaultColDef,
    loading: false,
    error: false,
  },
};

/**
 * Empty data state with custom message
 */
export const CustomNoDataMessage: Story = {
  args: {
    columnDefs,
    rowData: [],
    defaultColDef,
    loading: false,
    error: false,
    noDataMessage: 'No blog posts found. Create your first post to get started!',
  },
};

/**
 * With custom loading component
 */
export const CustomLoadingComponent: Story = {
  args: {
    columnDefs,
    rowData: [],
    defaultColDef,
    loading: true,
    error: false,
    loadingComponent: (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100%"
        gap={2}
      >
        <CircularProgress size={48} color="primary" />
        <Typography variant="body2" color="text.secondary">
          Loading blog posts...
        </Typography>
      </Box>
    ),
  },
};

/**
 * With custom error component
 */
export const CustomErrorComponent: Story = {
  args: {
    columnDefs,
    rowData: [],
    defaultColDef,
    loading: false,
    error: true,
    errorComponent: (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100%"
        gap={2}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          <Typography variant="subtitle2">Failed to load data</Typography>
          <Typography variant="body2">
            We encountered an error while fetching the blog posts. Please try again later.
          </Typography>
        </Alert>
      </Box>
    ),
  },
};

/**
 * With custom no data component
 */
export const CustomNoDataComponent: Story = {
  args: {
    columnDefs,
    rowData: [],
    defaultColDef,
    loading: false,
    error: false,
    noDataComponent: (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100%"
        gap={2}
      >
        <Typography variant="h6" color="text.secondary">
          📝
        </Typography>
        <Typography variant="body1" color="text.secondary">
          No posts yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start writing your first blog post!
        </Typography>
      </Box>
    ),
  },
};

// More complex column definitions for author grid
const authorColumnDefs = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
  { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
  { field: 'postsCount', headerName: 'Posts', width: 100 },
  { field: 'createdAt', headerName: 'Joined', width: 150 },
];

const authorRowData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', postsCount: 12, createdAt: '2023-06-15' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', postsCount: 8, createdAt: '2023-08-20' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', postsCount: 15, createdAt: '2023-04-10' },
];

/**
 * Author grid example
 */
export const AuthorGrid: Story = {
  args: {
    columnDefs: authorColumnDefs,
    rowData: authorRowData,
    defaultColDef,
    loading: false,
    error: false,
  },
};

// Category grid
const categoryColumnDefs = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'name', headerName: 'Category Name', flex: 1, minWidth: 200 },
  { field: 'slug', headerName: 'Slug', width: 150 },
  { field: 'postsCount', headerName: 'Posts', width: 100 },
];

const categoryRowData = [
  { id: 1, name: 'Technology', slug: 'technology', postsCount: 25 },
  { id: 2, name: 'Programming', slug: 'programming', postsCount: 18 },
  { id: 3, name: 'DevOps', slug: 'devops', postsCount: 12 },
  { id: 4, name: 'Cloud Computing', slug: 'cloud-computing', postsCount: 8 },
];

/**
 * Category grid example
 */
export const CategoryGrid: Story = {
  args: {
    columnDefs: categoryColumnDefs,
    rowData: categoryRowData,
    defaultColDef,
    loading: false,
    error: false,
  },
};

/**
 * Grid with many rows
 */
export const ManyRows: Story = {
  args: {
    columnDefs,
    rowData: Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      title: `Blog Post ${i + 1}`,
      author: ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown'][i % 4],
      status: i % 3 === 0 ? 'Draft' : 'Published',
      publishedAt: i % 3 === 0 ? '-' : `2024-01-${String(15 - (i % 15)).padStart(2, '0')}`,
    })),
    defaultColDef,
    loading: false,
    error: false,
  },
  decorators: [
    (Story) => (
      <Box sx={{ height: 600, width: '100%' }}>
        <Story />
      </Box>
    ),
  ],
};

/**
 * Grid with pagination options
 */
export const WithPagination: Story = {
  args: {
    columnDefs,
    rowData: Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      title: `Blog Post ${i + 1}`,
      author: ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown'][i % 4],
      status: i % 3 === 0 ? 'Draft' : 'Published',
      publishedAt: i % 3 === 0 ? '-' : `2024-01-${String(15 - (i % 15)).padStart(2, '0')}`,
    })),
    defaultColDef,
    loading: false,
    error: false,
    gridOptions: {
      pagination: true,
      paginationPageSize: 10,
      paginationPageSizeSelector: [10, 25, 50, 100],
    },
  },
  decorators: [
    (Story) => (
      <Box sx={{ height: 500, width: '100%' }}>
        <Story />
      </Box>
    ),
  ],
};
