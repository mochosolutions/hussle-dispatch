import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, Paper, Grid, Card, CardContent, Button, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import { LayoutStateProvider } from '../../../contexts/LayoutStateContext';
import MainLayout from './index';
import LayoutShell from './LayoutShell';
import MainContent from './MainContent';
import Header from './Header';
import Drawer from './Drawer';
import Footer from './Footer';
import Profile from './Header/HeaderContent/Profile';
import type { NavItemType } from '../../../types/menu';

// Sample menu items for the layout
const sampleMenuItems: NavItemType[] = [
  {
    id: 'nav',
    title: 'Navigation',
    type: 'group',
    children: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        type: 'item',
        url: '/',
      },
      {
        id: 'users',
        title: 'Users',
        type: 'item',
        url: '/users',
      },
      {
        id: 'settings',
        title: 'Settings',
        type: 'item',
        url: '/settings',
      },
    ],
  },
];

const sampleUser = { name: 'John Doe', organizationName: 'Acme Corp' };

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
 * - LayoutStateContext for drawer state
 * - ConfigContext for theme configuration
 * - React Router for navigation
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
    <MemoryRouter>
      <Routes>
        <Route
          path="*"
          element={
            <MainLayout
              menuItems={sampleMenuItems}
              user={sampleUser}
              onLogout={() => {}}
            />
          }
        >
          <Route index element={<DashboardContent />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};

export const WithDataTable: Story = {
  name: 'With Data Table',
  render: () => (
    <MemoryRouter>
      <Routes>
        <Route
          path="*"
          element={
            <MainLayout
              menuItems={sampleMenuItems}
              user={{ name: 'Jane Smith', organizationName: 'Acme Corp' }}
            />
          }
        >
          <Route index element={<DataTableContent />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};

export const MiniDrawerMode: Story = {
  name: 'Mini Drawer (Collapsed)',
  render: () => (
    <MemoryRouter>
      <Routes>
        <Route
          path="*"
          element={<MainLayout menuItems={sampleMenuItems} user={sampleUser} />}
        >
          <Route index element={<MiniDrawerContent />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};

// Composable layout using the individual building-block components
const CustomComposableLayout = () => (
  <LayoutStateProvider>
    <LayoutShell>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
          <Profile user={sampleUser} />
        </div>
      </Header>
      <Drawer menuItems={sampleMenuItems} />
      <MainContent drawerWidth={300} miniDrawerWidth={80}>
        <Outlet />
        <Footer />
      </MainContent>
    </LayoutShell>
  </LayoutStateProvider>
);

export const ComposableLayout: Story = {
  name: 'Custom Composable Layout',
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates composing a custom layout from individual building-block components. Each piece (Header, Drawer, MainContent, Footer) can be used independently with custom props.',
      },
      source: {
        type: 'code',
        code: `import { LayoutStateProvider, LayoutShell, LayoutHeader, LayoutDrawer, MainContent, LayoutFooter, Profile } from '@mocho/ui/components';
import { Outlet } from 'react-router-dom';

const CustomLayout = () => (
  <LayoutStateProvider>
    <LayoutShell>
      <LayoutHeader>
        <Profile user={user} onLogout={handleLogout} />
      </LayoutHeader>
      <LayoutDrawer menuItems={menuItems} />
      <MainContent drawerWidth={300} miniDrawerWidth={80}>
        <Outlet />
        <LayoutFooter />
      </MainContent>
    </LayoutShell>
  </LayoutStateProvider>
);`,
        language: 'tsx',
      },
    },
  },
  render: () => (
    <MemoryRouter>
      <Routes>
        <Route path="*" element={<CustomComposableLayout />}>
          <Route index element={<DashboardContent />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};
