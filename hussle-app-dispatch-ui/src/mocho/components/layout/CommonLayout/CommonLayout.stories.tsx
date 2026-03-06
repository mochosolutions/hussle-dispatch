import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, Paper, Container } from '@mui/material';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CommonLayout from './index';

// Sample content component for outlet
const SampleContent = () => (
  <Container sx={{ py: 4 }}>
    <Paper sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Page Content
      </Typography>
      <Typography>
        This is the main content area rendered via React Router's Outlet.
        The layout wraps this content with optional header and footer.
      </Typography>
    </Paper>
  </Container>
);

/**
 * CommonLayout is a versatile layout component that supports three modes:
 * - **blank**: Just renders the outlet with no header/footer (default)
 * - **simple**: Renders header and minimal footer
 * - **landing**: Full header and footer for landing pages
 *
 * This layout uses lazy loading for Header and FooterBlock components.
 */
const meta: Meta<typeof CommonLayout> = {
  title: 'Components/Layouts/CommonLayout',
  component: CommonLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A flexible layout component with blank, simple, and landing modes.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CommonLayout>;

export const BlankLayout: Story = {
  name: 'Blank Layout (Default)',
  render: () => (
    <MemoryRouter>
      <Routes>
        <Route path="*" element={<CommonLayout layout="blank" />}>
          <Route index element={<SampleContent />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The blank layout renders only the outlet content with no header or footer. This is the default mode.',
      },
    },
  },
};

export const SimpleLayout: Story = {
  name: 'Simple Layout',
  render: () => (
    <MemoryRouter>
      <Routes>
        <Route path="*" element={<CommonLayout layout="simple" />}>
          <Route index element={<SampleContent />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The simple layout includes a header and a minimal footer, suitable for internal pages.',
      },
    },
  },
};

export const LandingLayout: Story = {
  name: 'Landing Layout',
  render: () => (
    <MemoryRouter>
      <Routes>
        <Route path="*" element={<CommonLayout layout="landing" />}>
          <Route index element={<SampleContent />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The landing layout includes a full header and footer, suitable for marketing and landing pages.',
      },
    },
  },
};

export const LayoutComparison: Story = {
  name: 'Layout Modes Comparison',
  render: () => (
    <Box>
      <Typography variant="h5" sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        CommonLayout supports three modes:
      </Typography>
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6">1. Blank Layout (default)</Typography>
          <Typography color="text.secondary">
            - No header or footer
            - Just renders the outlet content
            - Use for modal pages, popups, or minimal interfaces
          </Typography>
        </Paper>
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6">2. Simple Layout</Typography>
          <Typography color="text.secondary">
            - Includes header with navigation
            - Minimal footer
            - Use for internal/authenticated pages
          </Typography>
        </Paper>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6">3. Landing Layout</Typography>
          <Typography color="text.secondary">
            - Full header with navigation
            - Complete footer with links and info
            - Use for marketing and public-facing pages
          </Typography>
        </Paper>
      </Box>
    </Box>
  ),
};
