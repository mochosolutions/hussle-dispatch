import type { Meta, StoryObj } from '@storybook/react';
import { Suspense, lazy } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import Loadable from './index';
import Loader from './Loader';

/**
 * Loadable is a Higher-Order Component (HOC) for lazy loading components
 * with a consistent loading indicator. It wraps React.lazy components
 * in a Suspense boundary with the Loader component as fallback.
 */
const meta: Meta = {
  title: 'Components/Layout/Loadable',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

// Simulated lazy component
const SimulatedLazyComponent = () => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom>
      Lazy Loaded Component
    </Typography>
    <Typography variant="body1">
      This component was loaded lazily using React.lazy and Suspense.
    </Typography>
  </Paper>
);

// Create a delayed lazy component for demo
const createDelayedComponent = (delay: number) => {
  return lazy(
    () =>
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              default: SimulatedLazyComponent,
            }),
          delay
        )
      )
  );
};

export const LoaderComponent: StoryObj = {
  name: 'Loader Component',
  render: () => (
    <Box sx={{ position: 'relative', height: 100 }}>
      <Typography variant="body2" sx={{ mb: 2 }}>
        This is the Loader component shown during lazy loading:
      </Typography>
      <Loader />
    </Box>
  ),
};

export const LoadableHOCExample: StoryObj = {
  name: 'Loadable HOC Example',
  render: () => {
    // Create a loadable component using the HOC
    const LazyComponent = Loadable(
      lazy(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  default: SimulatedLazyComponent,
                }),
              1500
            )
          )
      )
    );

    return (
      <Box>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Component loaded with Loadable HOC (1.5s delay simulation):
        </Typography>
        <LazyComponent />
      </Box>
    );
  },
};

export const InstantLoad: StoryObj = {
  name: 'Instant Load',
  render: () => {
    const LazyComponent = Loadable(
      lazy(() => Promise.resolve({ default: SimulatedLazyComponent }))
    );

    return (
      <Box>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Component loaded instantly (no delay):
        </Typography>
        <LazyComponent />
      </Box>
    );
  },
};

export const MultipleLoadableComponents: StoryObj = {
  name: 'Multiple Loadable Components',
  render: () => {
    const Component1 = Loadable(createDelayedComponent(500));
    const Component2 = Loadable(createDelayedComponent(1000));
    const Component3 = Loadable(createDelayedComponent(1500));

    return (
      <Box>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Multiple components loading at different speeds:
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Loads in 0.5s:
            </Typography>
            <Component1 />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Loads in 1s:
            </Typography>
            <Component2 />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Loads in 1.5s:
            </Typography>
            <Component3 />
          </Box>
        </Box>
      </Box>
    );
  },
};

export const UsageExample: StoryObj = {
  name: 'Usage Example Code',
  render: () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        How to use Loadable
      </Typography>
      <Box
        component="pre"
        sx={{
          bgcolor: 'grey.100',
          p: 2,
          borderRadius: 1,
          overflow: 'auto',
          fontSize: '0.875rem',
        }}
      >
        {`// Import Loadable HOC
import Loadable from '@mocho/ui/Loadable';
import { lazy } from 'react';

// Create a loadable component
const Dashboard = Loadable(
  lazy(() => import('./pages/Dashboard'))
);

// Use in your routes or components
function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}`}
      </Box>
      <Typography variant="body2" sx={{ mt: 2 }}>
        The Loadable HOC wraps your lazy-loaded component in a Suspense boundary
        and displays a loading indicator while the component is being fetched.
      </Typography>
    </Paper>
  ),
};
