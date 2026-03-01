import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, Paper, List, ListItem, ListItemText, TextField, Button, Stack } from '@mui/material';
import { TabComponent, TabPanel } from './index';

/**
 * Tabs - A tab navigation component with automatic panel management.
 *
 * Use this component when you need tabbed navigation with content panels.
 * Children must have a `label` prop that will be used as the tab label.
 */
const meta: Meta<typeof TabComponent> = {
  title: 'Components/Data Display/Tabs',
  component: TabComponent,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TabComponent>;

/**
 * Simple tab content component for examples
 */
const TabContent = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => <Box sx={{ py: 2 }}>{children}</Box>;

/**
 * Default tabs with simple text content
 */
export const Default: Story = {
  render: () => (
    <Paper sx={{ p: 2 }}>
      <TabComponent>
        <TabContent label="Overview">
          <Typography variant="body1">
            This is the overview tab content. It provides a general summary of the main features.
          </Typography>
        </TabContent>
        <TabContent label="Details">
          <Typography variant="body1">
            This is the details tab content. It contains more specific information about the item.
          </Typography>
        </TabContent>
        <TabContent label="Settings">
          <Typography variant="body1">
            This is the settings tab content. Configure your preferences here.
          </Typography>
        </TabContent>
      </TabComponent>
    </Paper>
  ),
};

/**
 * Two tabs only
 */
export const TwoTabs: Story = {
  render: () => (
    <Paper sx={{ p: 2 }}>
      <TabComponent>
        <TabContent label="Active">
          <Typography variant="body1">Active items are shown here.</Typography>
        </TabContent>
        <TabContent label="Archived">
          <Typography variant="body1">Archived items are stored here.</Typography>
        </TabContent>
      </TabComponent>
    </Paper>
  ),
};

/**
 * Multiple tabs with scrollable behavior
 */
export const ManyTabs: Story = {
  render: () => (
    <Paper sx={{ p: 2 }}>
      <TabComponent>
        <TabContent label="Dashboard">
          <Typography>Dashboard content</Typography>
        </TabContent>
        <TabContent label="Analytics">
          <Typography>Analytics content</Typography>
        </TabContent>
        <TabContent label="Reports">
          <Typography>Reports content</Typography>
        </TabContent>
        <TabContent label="Users">
          <Typography>Users content</Typography>
        </TabContent>
        <TabContent label="Settings">
          <Typography>Settings content</Typography>
        </TabContent>
        <TabContent label="Notifications">
          <Typography>Notifications content</Typography>
        </TabContent>
        <TabContent label="Help">
          <Typography>Help content</Typography>
        </TabContent>
      </TabComponent>
    </Paper>
  ),
};

/**
 * Tabs with rich content
 */
export const RichContent: Story = {
  render: () => (
    <Paper sx={{ p: 2 }}>
      <TabComponent>
        <TabContent label="Profile">
          <Stack spacing={2}>
            <Typography variant="h6">User Profile</Typography>
            <TextField label="Full Name" defaultValue="John Doe" fullWidth />
            <TextField label="Email" defaultValue="john@example.com" fullWidth />
            <TextField label="Bio" multiline rows={3} fullWidth />
            <Box>
              <Button variant="contained">Save Changes</Button>
            </Box>
          </Stack>
        </TabContent>
        <TabContent label="Activity">
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Created new blog post"
                secondary="2 hours ago"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Updated profile picture"
                secondary="Yesterday"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Commented on a post"
                secondary="3 days ago"
              />
            </ListItem>
          </List>
        </TabContent>
        <TabContent label="Security">
          <Stack spacing={2}>
            <Typography variant="h6">Security Settings</Typography>
            <TextField
              label="Current Password"
              type="password"
              fullWidth
            />
            <TextField
              label="New Password"
              type="password"
              fullWidth
            />
            <TextField
              label="Confirm Password"
              type="password"
              fullWidth
            />
            <Box>
              <Button variant="contained" color="primary">
                Update Password
              </Button>
            </Box>
          </Stack>
        </TabContent>
      </TabComponent>
    </Paper>
  ),
};

/**
 * Blog post detail tabs
 */
export const BlogPostDetail: Story = {
  render: () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Introduction to React Hooks
      </Typography>
      <TabComponent>
        <TabContent label="Content">
          <Box>
            <Typography variant="body1" paragraph>
              React Hooks are a powerful feature introduced in React 16.8 that
              allow you to use state and other React features without writing a
              class.
            </Typography>
            <Typography variant="body1" paragraph>
              The most commonly used hooks are useState and useEffect, which
              handle state management and side effects respectively.
            </Typography>
            <Typography variant="body1">
              Hooks provide a more direct API to the React concepts you already
              know: props, state, context, refs, and lifecycle.
            </Typography>
          </Box>
        </TabContent>
        <TabContent label="Meta">
          <List dense>
            <ListItem>
              <ListItemText primary="Author" secondary="John Doe" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Published" secondary="January 15, 2024" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Category" secondary="Programming" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Status" secondary="Published" />
            </ListItem>
          </List>
        </TabContent>
        <TabContent label="SEO">
          <Stack spacing={2}>
            <TextField
              label="Meta Title"
              defaultValue="Introduction to React Hooks - Learn Modern React"
              fullWidth
            />
            <TextField
              label="Meta Description"
              defaultValue="Learn how to use React Hooks to write cleaner, more reusable code. This comprehensive guide covers useState, useEffect, and custom hooks."
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Keywords"
              defaultValue="react, hooks, useState, useEffect, javascript"
              fullWidth
            />
          </Stack>
        </TabContent>
      </TabComponent>
    </Paper>
  ),
};

/**
 * Product detail tabs (e-commerce style)
 */
export const ProductDetail: Story = {
  render: () => (
    <Paper sx={{ p: 2 }}>
      <TabComponent>
        <TabContent label="Description">
          <Box>
            <Typography variant="h6" gutterBottom>
              Premium Wireless Headphones
            </Typography>
            <Typography variant="body1" paragraph>
              Experience superior sound quality with our premium wireless
              headphones. Featuring active noise cancellation, 30-hour battery
              life, and ultra-comfortable ear cushions.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Perfect for music lovers, remote workers, and frequent travelers.
            </Typography>
          </Box>
        </TabContent>
        <TabContent label="Specifications">
          <List dense>
            <ListItem>
              <ListItemText primary="Driver Size" secondary="40mm" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Frequency Response" secondary="20Hz - 20kHz" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Battery Life" secondary="30 hours" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Weight" secondary="250g" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Connectivity" secondary="Bluetooth 5.0" />
            </ListItem>
          </List>
        </TabContent>
        <TabContent label="Reviews">
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2">John D. - ⭐⭐⭐⭐⭐</Typography>
              <Typography variant="body2">
                Amazing sound quality and comfort. Best headphones I have ever owned!
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2">Sarah M. - ⭐⭐⭐⭐</Typography>
              <Typography variant="body2">
                Great noise cancellation. Battery lasts forever. Only wish they came in more colors.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2">Mike R. - ⭐⭐⭐⭐⭐</Typography>
              <Typography variant="body2">
                Perfect for working from home. The mic quality is excellent for calls.
              </Typography>
            </Box>
          </Stack>
        </TabContent>
      </TabComponent>
    </Paper>
  ),
};

/**
 * Standalone TabPanel component usage
 */
export const TabPanelUsage: Story = {
  render: () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        TabPanel Component (Standalone)
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        TabPanel can be used independently for custom tab implementations.
      </Typography>
      <Box sx={{ mt: 2 }}>
        <TabPanel value={0} index={0}>
          <Typography>This panel is visible (value=0, index=0)</Typography>
        </TabPanel>
        <TabPanel value={0} index={1}>
          <Typography>This panel is hidden (value=0, index=1)</Typography>
        </TabPanel>
      </Box>
    </Paper>
  ),
};

/**
 * Tabs in a dashboard layout
 */
export const DashboardTabs: Story = {
  render: () => (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h5" gutterBottom>
        Analytics Dashboard
      </Typography>
      <Paper sx={{ p: 2 }}>
        <TabComponent>
          <TabContent label="Overview">
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 2,
              }}
            >
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4">1,234</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Views
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4">567</Typography>
                <Typography variant="body2" color="text.secondary">
                  Unique Visitors
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4">89%</Typography>
                <Typography variant="body2" color="text.secondary">
                  Bounce Rate
                </Typography>
              </Paper>
            </Box>
          </TabContent>
          <TabContent label="Traffic">
            <Typography variant="body1">
              Traffic analytics and charts would go here.
            </Typography>
          </TabContent>
          <TabContent label="Conversions">
            <Typography variant="body1">
              Conversion tracking data would go here.
            </Typography>
          </TabContent>
        </TabComponent>
      </Paper>
    </Box>
  ),
};
