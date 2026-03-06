import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, Paper, Container, Button, Grid, Card, CardContent } from '@mui/material';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LandingPageLayout from './index';

// Default landing page content
const DefaultLandingContent = () => (
  <Box>
    {/* Hero Section */}
    <Box
      sx={{
        bgcolor: 'primary.main',
        color: 'white',
        py: 10,
        textAlign: 'center',
      }}
    >
      <Container>
        <Typography variant="h2" gutterBottom>
          Welcome to Our Platform
        </Typography>
        <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
          Build something amazing with our tools
        </Typography>
        <Button variant="contained" color="secondary" size="large">
          Get Started
        </Button>
      </Container>
    </Box>

    {/* Features Section */}
    <Container sx={{ py: 8 }}>
      <Typography variant="h4" textAlign="center" gutterBottom>
        Features
      </Typography>
      <Grid container spacing={4} sx={{ mt: 2 }}>
        {['Feature 1', 'Feature 2', 'Feature 3'].map((feature) => (
          <Grid item xs={12} md={4} key={feature}>
            <Card>
              <CardContent>
                <Typography variant="h6">{feature}</Typography>
                <Typography color="text.secondary">
                  Description of {feature.toLowerCase()} goes here.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  </Box>
);

// Minimal landing content
const MinimalLandingContent = () => (
  <Container sx={{ py: 10, textAlign: 'center' }}>
    <Typography variant="h3" gutterBottom>
      Simple Landing Page
    </Typography>
    <Typography color="text.secondary" sx={{ mb: 4 }}>
      A clean, minimal landing page layout.
    </Typography>
    <Button variant="contained" size="large">
      Learn More
    </Button>
  </Container>
);

// Product showcase content
const ProductShowcaseContent = () => (
  <Box>
    {/* Hero */}
    <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
      <Container>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h3" gutterBottom>
              Introducing Our Product
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              A revolutionary solution for your business needs.
            </Typography>
            <Button variant="contained" sx={{ mr: 2 }}>
              Try Free
            </Button>
            <Button variant="outlined">Learn More</Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.300',
              }}
            >
              <Typography color="text.secondary">
                Product Image
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>

    {/* Testimonials */}
    <Container sx={{ py: 8 }}>
      <Typography variant="h4" textAlign="center" gutterBottom>
        What Our Customers Say
      </Typography>
      <Grid container spacing={4} sx={{ mt: 2 }}>
        {[1, 2, 3].map((i) => (
          <Grid item xs={12} md={4} key={i}>
            <Paper sx={{ p: 3 }}>
              <Typography sx={{ fontStyle: 'italic', mb: 2 }}>
                "Great product! Highly recommended."
              </Typography>
              <Typography variant="subtitle2">
                - Customer {i}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  </Box>
);

/**
 * LandingPageLayout is designed for marketing and public-facing landing pages.
 * It uses a CSS Grid structure for a full-page layout with:
 * - Fixed-height header (80px)
 * - Flexible main content area
 * - Full footer section
 *
 * The layout uses styled-components for the grid structure and
 * lazy-loads the Header and FooterBlock components.
 */
const meta: Meta<typeof LandingPageLayout> = {
  title: 'Components/Layouts/LandingPageLayout',
  component: LandingPageLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A full-page layout optimized for landing and marketing pages.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LandingPageLayout>;

export const Default: Story = {
  name: 'Default Landing Page',
  render: () => (
    <MemoryRouter>
      <Routes>
        <Route path="*" element={<LandingPageLayout />}>
          <Route index element={<DefaultLandingContent />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};

export const MinimalContent: Story = {
  name: 'Minimal Content',
  render: () => (
    <MemoryRouter>
      <Routes>
        <Route path="*" element={<LandingPageLayout />}>
          <Route index element={<MinimalLandingContent />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};

export const ProductShowcase: Story = {
  name: 'Product Showcase',
  render: () => (
    <MemoryRouter>
      <Routes>
        <Route path="*" element={<LandingPageLayout />}>
          <Route index element={<ProductShowcaseContent />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};
