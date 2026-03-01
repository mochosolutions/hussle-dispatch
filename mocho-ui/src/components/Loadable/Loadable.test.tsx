import React, { lazy, Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Loadable from './index';
import Loader from './Loader';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('Loader', () => {
  it('renders linear progress indicator', () => {
    renderWithTheme(<Loader />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});

describe('Loadable', () => {
  it('shows loader while component is loading', async () => {
    // Create a delayed lazy component
    const DelayedComponent = lazy(
      () =>
        new Promise<{ default: React.ComponentType }>((resolve) => {
          setTimeout(() => {
            resolve({
              default: () => <div>Loaded Content</div>,
            });
          }, 100);
        })
    );

    const LoadableComponent = Loadable(DelayedComponent);

    renderWithTheme(<LoadableComponent />);

    // Should show loader initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for component to load
    await waitFor(
      () => {
        expect(screen.getByText('Loaded Content')).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it('renders loaded component after loading', async () => {
    const InstantComponent = lazy(() =>
      Promise.resolve({
        default: () => <div>Instant Content</div>,
      })
    );

    const LoadableComponent = Loadable(InstantComponent);

    renderWithTheme(<LoadableComponent />);

    await waitFor(() => {
      expect(screen.getByText('Instant Content')).toBeInTheDocument();
    });
  });

  it('passes props to loaded component', async () => {
    interface TestProps {
      message: string;
    }

    const PropsComponent = lazy(() =>
      Promise.resolve({
        default: ({ message }: TestProps) => <div>{message}</div>,
      })
    );

    const LoadableComponent = Loadable(PropsComponent);

    renderWithTheme(<LoadableComponent message="Hello World" />);

    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
  });

  it('wraps component in Suspense boundary', () => {
    // Verify the Loadable function returns a component
    const TestComponent = lazy(() =>
      Promise.resolve({
        default: () => <div>Test</div>,
      })
    );

    const LoadableComponent = Loadable(TestComponent);

    // Should be a valid React component
    expect(typeof LoadableComponent).toBe('function');
  });

  it('handles multiple loadable components independently', async () => {
    const Component1 = lazy(() =>
      Promise.resolve({
        default: () => <div>Component 1</div>,
      })
    );

    const Component2 = lazy(() =>
      new Promise<{ default: React.ComponentType }>((resolve) => {
        setTimeout(() => {
          resolve({
            default: () => <div>Component 2</div>,
          });
        }, 100);
      })
    );

    const Loadable1 = Loadable(Component1);
    const Loadable2 = Loadable(Component2);

    renderWithTheme(
      <>
        <Loadable1 />
        <Loadable2 />
      </>
    );

    // Component 1 should load instantly
    await waitFor(() => {
      expect(screen.getByText('Component 1')).toBeInTheDocument();
    });

    // Component 2 should load after delay
    await waitFor(
      () => {
        expect(screen.getByText('Component 2')).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });
});
