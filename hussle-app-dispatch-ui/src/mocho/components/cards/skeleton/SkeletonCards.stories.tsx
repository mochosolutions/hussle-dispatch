import type { Meta, StoryObj } from '@storybook/react';
import { Box, Grid, Typography } from '@mui/material';
import ProductPlaceholder from './ProductPlaceholder';

/**
 * Skeleton card placeholders for loading states.
 * ProductPlaceholder is designed for product card loading states.
 */
const meta: Meta<typeof ProductPlaceholder> = {
  title: 'Components/Complex/Cards/Skeleton',
  component: ProductPlaceholder,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProductPlaceholder>;

export const Default: Story = {
  render: () => (
    <Box sx={{ maxWidth: 300 }}>
      <ProductPlaceholder />
    </Box>
  ),
};

export const GridOfPlaceholders: Story = {
  name: 'Grid of Placeholders',
  render: () => (
    <Grid container spacing={3}>
      {[1, 2, 3, 4].map((n) => (
        <Grid item xs={12} sm={6} md={3} key={n}>
          <ProductPlaceholder />
        </Grid>
      ))}
    </Grid>
  ),
};

export const LoadingProductList: Story = {
  name: 'Loading Product List',
  render: () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Products
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Loading products...
      </Typography>
      <Grid container spacing={3}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <Grid item xs={12} sm={6} md={4} key={n}>
            <ProductPlaceholder />
          </Grid>
        ))}
      </Grid>
    </Box>
  ),
};

export const SideBySide: Story = {
  name: 'Side by Side Comparison',
  render: () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Typography variant="h6" gutterBottom>
          Loading State
        </Typography>
        <ProductPlaceholder />
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="h6" gutterBottom>
          Actual Product Card (placeholder)
        </Typography>
        <Box
          sx={{
            border: 2,
            borderColor: 'divider',
            borderStyle: 'dashed',
            borderRadius: 1,
            p: 3,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography color="text.secondary">
            Product card would appear here
          </Typography>
        </Box>
      </Grid>
    </Grid>
  ),
};
