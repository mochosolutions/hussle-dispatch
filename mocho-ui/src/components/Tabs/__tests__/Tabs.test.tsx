import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { TabComponent, TabPanel } from '../index';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

// Simple tab content component for testing
const TabContent = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>{children}</div>
);

describe('TabComponent', () => {
  describe('rendering', () => {
    it('renders tabs from children labels', () => {
      renderWithTheme(
        <TabComponent>
          <TabContent label="Tab 1">Content 1</TabContent>
          <TabContent label="Tab 2">Content 2</TabContent>
          <TabContent label="Tab 3">Content 3</TabContent>
        </TabComponent>
      );

      expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Tab 3' })).toBeInTheDocument();
    });

    it('renders first tab content by default', () => {
      renderWithTheme(
        <TabComponent>
          <TabContent label="Tab 1">Content 1</TabContent>
          <TabContent label="Tab 2">Content 2</TabContent>
        </TabComponent>
      );

      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('does not render inactive tab content', () => {
      renderWithTheme(
        <TabComponent>
          <TabContent label="Tab 1">Content 1</TabContent>
          <TabContent label="Tab 2">Content 2</TabContent>
        </TabComponent>
      );

      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    });

    it('renders tablist with correct role', () => {
      renderWithTheme(
        <TabComponent>
          <TabContent label="Tab 1">Content 1</TabContent>
          <TabContent label="Tab 2">Content 2</TabContent>
        </TabComponent>
      );

      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('renders tabpanel with correct role', () => {
      renderWithTheme(
        <TabComponent>
          <TabContent label="Tab 1">Content 1</TabContent>
          <TabContent label="Tab 2">Content 2</TabContent>
        </TabComponent>
      );

      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });
  });

  describe('tab selection', () => {
    it('first tab is selected by default', () => {
      renderWithTheme(
        <TabComponent>
          <TabContent label="Tab 1">Content 1</TabContent>
          <TabContent label="Tab 2">Content 2</TabContent>
        </TabComponent>
      );

      const firstTab = screen.getByRole('tab', { name: 'Tab 1' });
      expect(firstTab).toHaveAttribute('aria-selected', 'true');
    });

    it('other tabs are not selected by default', () => {
      renderWithTheme(
        <TabComponent>
          <TabContent label="Tab 1">Content 1</TabContent>
          <TabContent label="Tab 2">Content 2</TabContent>
        </TabComponent>
      );

      const secondTab = screen.getByRole('tab', { name: 'Tab 2' });
      expect(secondTab).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('tab interaction', () => {
    it('switches to clicked tab', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <TabComponent>
          <TabContent label="Tab 1">Content 1</TabContent>
          <TabContent label="Tab 2">Content 2</TabContent>
        </TabComponent>
      );

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));

      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('shows content of selected tab', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <TabComponent>
          <TabContent label="Tab 1">Content 1</TabContent>
          <TabContent label="Tab 2">Content 2</TabContent>
        </TabComponent>
      );

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));

      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('hides content of unselected tab', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <TabComponent>
          <TabContent label="Tab 1">Content 1</TabContent>
          <TabContent label="Tab 2">Content 2</TabContent>
        </TabComponent>
      );

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));

      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    });

    it('can switch between multiple tabs', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <TabComponent>
          <TabContent label="Tab 1">Content 1</TabContent>
          <TabContent label="Tab 2">Content 2</TabContent>
          <TabContent label="Tab 3">Content 3</TabContent>
        </TabComponent>
      );

      // Switch to Tab 2
      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));
      expect(screen.getByText('Content 2')).toBeInTheDocument();

      // Switch to Tab 3
      await user.click(screen.getByRole('tab', { name: 'Tab 3' }));
      expect(screen.getByText('Content 3')).toBeInTheDocument();

      // Switch back to Tab 1
      await user.click(screen.getByRole('tab', { name: 'Tab 1' }));
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });
  });

  describe('with complex content', () => {
    it('renders complex content in tabs', () => {
      renderWithTheme(
        <TabComponent>
          <TabContent label="Profile">
            <div data-testid="profile-content">
              <h2>User Profile</h2>
              <p>Profile details here</p>
            </div>
          </TabContent>
          <TabContent label="Settings">
            <div data-testid="settings-content">
              <h2>Settings</h2>
              <button>Save</button>
            </div>
          </TabContent>
        </TabComponent>
      );

      expect(screen.getByTestId('profile-content')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'User Profile' })).toBeInTheDocument();
    });

    it('switches complex content correctly', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <TabComponent>
          <TabContent label="Profile">
            <div data-testid="profile-content">
              <h2>User Profile</h2>
            </div>
          </TabContent>
          <TabContent label="Settings">
            <div data-testid="settings-content">
              <h2>Settings</h2>
            </div>
          </TabContent>
        </TabComponent>
      );

      await user.click(screen.getByRole('tab', { name: 'Settings' }));

      expect(screen.queryByTestId('profile-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('settings-content')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    });
  });

  describe('with many tabs', () => {
    it('renders all tabs in scrollable container', () => {
      renderWithTheme(
        <TabComponent>
          <TabContent label="Tab 1">Content 1</TabContent>
          <TabContent label="Tab 2">Content 2</TabContent>
          <TabContent label="Tab 3">Content 3</TabContent>
          <TabContent label="Tab 4">Content 4</TabContent>
          <TabContent label="Tab 5">Content 5</TabContent>
          <TabContent label="Tab 6">Content 6</TabContent>
        </TabComponent>
      );

      expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Tab 6' })).toBeInTheDocument();
    });

    it('can select any tab in a long list', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <TabComponent>
          <TabContent label="Tab 1">Content 1</TabContent>
          <TabContent label="Tab 2">Content 2</TabContent>
          <TabContent label="Tab 3">Content 3</TabContent>
          <TabContent label="Tab 4">Content 4</TabContent>
          <TabContent label="Tab 5">Content 5</TabContent>
        </TabComponent>
      );

      await user.click(screen.getByRole('tab', { name: 'Tab 5' }));

      expect(screen.getByText('Content 5')).toBeInTheDocument();
    });
  });
});

describe('TabPanel', () => {
  describe('rendering', () => {
    it('renders children when value matches index', () => {
      renderWithTheme(
        <TabPanel value={0} index={0}>
          <div>Panel Content</div>
        </TabPanel>
      );

      expect(screen.getByText('Panel Content')).toBeInTheDocument();
    });

    it('hides content when value does not match index', () => {
      renderWithTheme(
        <TabPanel value={1} index={0}>
          <div>Panel Content</div>
        </TabPanel>
      );

      expect(screen.queryByText('Panel Content')).not.toBeInTheDocument();
    });

    it('has tabpanel role', () => {
      renderWithTheme(
        <TabPanel value={0} index={0}>
          <div>Panel Content</div>
        </TabPanel>
      );

      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('is hidden when not active', () => {
      renderWithTheme(
        <TabPanel value={1} index={0}>
          <div>Panel Content</div>
        </TabPanel>
      );

      expect(screen.getByRole('tabpanel', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has correct aria-labelledby attribute', () => {
      renderWithTheme(
        <TabPanel value={0} index={0}>
          <div>Panel Content</div>
        </TabPanel>
      );

      const panel = screen.getByRole('tabpanel');
      expect(panel).toHaveAttribute('aria-labelledby', 'product-details-tab-0');
    });

    it('has correct id attribute', () => {
      renderWithTheme(
        <TabPanel value={0} index={0}>
          <div>Panel Content</div>
        </TabPanel>
      );

      const panel = screen.getByRole('tabpanel');
      expect(panel).toHaveAttribute('id', 'product-details-tabpanel-0');
    });

    it('uses index in aria attributes', () => {
      renderWithTheme(
        <TabPanel value={2} index={2}>
          <div>Panel Content</div>
        </TabPanel>
      );

      const panel = screen.getByRole('tabpanel');
      expect(panel).toHaveAttribute('id', 'product-details-tabpanel-2');
      expect(panel).toHaveAttribute('aria-labelledby', 'product-details-tab-2');
    });
  });

  describe('with different value types', () => {
    it('works with numeric values', () => {
      renderWithTheme(
        <TabPanel value={2} index={2}>
          <div>Numeric Panel</div>
        </TabPanel>
      );

      expect(screen.getByText('Numeric Panel')).toBeInTheDocument();
    });

    it('works with string values', () => {
      renderWithTheme(
        <TabPanel value="tab1" index={0}>
          <div>String Panel</div>
        </TabPanel>
      );

      // String "tab1" !== number 0, so content should be hidden
      expect(screen.queryByText('String Panel')).not.toBeInTheDocument();
    });
  });

  describe('content rendering', () => {
    it('renders text content', () => {
      renderWithTheme(
        <TabPanel value={0} index={0}>
          Simple text content
        </TabPanel>
      );

      expect(screen.getByText('Simple text content')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      renderWithTheme(
        <TabPanel value={0} index={0}>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </TabPanel>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('renders nested components', () => {
      const NestedComponent = () => <span data-testid="nested">Nested</span>;

      renderWithTheme(
        <TabPanel value={0} index={0}>
          <NestedComponent />
        </TabPanel>
      );

      expect(screen.getByTestId('nested')).toBeInTheDocument();
    });
  });
});
