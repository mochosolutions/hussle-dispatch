import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, Paper, Grid, Card, CardContent, Button, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LayoutProvider } from '../LayoutContext';
import MainLayout from './index';

// Sample menu items for the layout
const sampleMenuItems = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    type: 'item' as const,
    url: '/',
    icon: undefined,
  },
  {
    id: 'users',
    title: 'Users',
    type: 'item' as const,
    url: '/users',
    icon: undefined,
  },
  {
    id: 'settings',
    title: 'Settings',
    type: 'item' as const,
    url: '/settings',
    icon: undefined,
  },
];

// Dashboard content
const DashboardContent = () => (
  <Box>
    <Typography variant="h4" gutterBottom>
      Dashboard
    </Typography>
    <Grid container spacing={3}>
      {['Total Users', 'Active Sessions', 'Revenue', 'Growth'].map((title, index) => (
        <Grid item xs={12} sm={6} md={3} key={title}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                {title}
              </Typography>
              <Typography variant="h4">
                {[1234, 567, '$89,123', '+15%'][index]}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Box>
);

// Data table content
const DataTableContent = () => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
      <Typography variant="h4">Users</Typography>
      <Button variant="contained">Add User</Button>
    </Box>
    <Paper>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[
            { name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'Active' },
            { name: 'Bob Smith', email: 'bob@example.com', role: 'User', status: 'Active' },
            { name: 'Carol White', email: 'carol@example.com', role: 'User', status: 'Inactive' },
          ].map((user) => (
            <TableRow key={user.email}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>{user.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  </Box>
);

// Mini drawer content
const MiniDrawerContent = () => (
  <Box>
    <Typography variant="h4" gutterBottom>
      Mini Drawer Mode
    </Typography>
    <Typography>
      The drawer is in mini mode, showing only icons.
      Hover or click to expand.
    </Typography>
  </Box>
);

/**
 * MainLayout is the primary admin layout component with:
 * - Collapsible sidebar drawer
 * - Top header with user menu
 * - Main content area with outlet
 * - Footer
 *
 * It integrates with:
 * - LayoutContext for menu state and configuration
 * - Redux (via LayoutContext hooks) for drawer state
 * - React Router for navigation
 *
 * **Note:** This layout requires LayoutProvider to be wrapped around it.
 */
const meta: Meta<typeof MainLayout> = {
  title: 'Components/Layouts/MainLayout',
  component: MainLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The main admin dashboard layout with sidebar, header, and footer.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MainLayout>;

export const Default: Story = {
  name: 'Default Dashboard',
  render: () => (
    <LayoutProvider
      menuItems={sampleMenuItems}
      user={{
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Admin',
      }}
      onLogout={() => console.log('Logout clicked')}
    >
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<MainLayout />}>
            <Route index element={<DashboardContent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </LayoutProvider>
  ),
};

export const WithDataTable: Story = {
  name: 'With Data Table',
  render: () => (
    <LayoutProvider
      menuItems={sampleMenuItems}
      user={{
        id: '1',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'Manager',
      }}
    >
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<MainLayout />}>
            <Route index element={<DataTableContent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </LayoutProvider>
  ),
};

export const LoadingState: Story = {
  name: 'Loading State',
  render: () => (
    <LayoutProvider
      menuItems={sampleMenuItems}
      user={{
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
      }}
      isLoading={true}
      loadingMessage="Switching organization..."
    >
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<MainLayout />}>
            <Route index element={<div>This content won't show</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </LayoutProvider>
  ),
};

export const MiniDrawerMode: Story = {
  name: 'Mini Drawer (Collapsed)',
  render: () => (
    <LayoutProvider
      menuItems={sampleMenuItems}
      user={{
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
      }}
      initialDrawerOpen={false}
    >
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<MainLayout />}>
            <Route index element={<MiniDrawerContent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </LayoutProvider>
  ),
};
