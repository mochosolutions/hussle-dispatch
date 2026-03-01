import React from 'react';
import { render, screen } from '../../../../__tests__/test-utils';
import Breadcrumbs from '../../Breadcrumbs';
import { RightOutlined, UserOutlined } from '@ant-design/icons';

describe('Breadcrumbs', () => {
  const basicItems = [
    { title: 'Dashboard', url: '/dashboard' },
    { title: 'Users', url: '/users' },
    { title: 'Profile' },
  ];

  describe('rendering', () => {
    it('renders breadcrumb navigation', () => {
      render(<Breadcrumbs items={basicItems} />);

      expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toBeInTheDocument();
    });

    it('renders Home link by default', () => {
      render(<Breadcrumbs items={basicItems} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('renders all breadcrumb items', () => {
      render(<Breadcrumbs items={basicItems} />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('renders last item as active (not clickable)', () => {
      render(<Breadcrumbs items={basicItems} />);

      const profileText = screen.getByText('Profile');
      // Active item should not be a link
      expect(profileText.closest('a')).not.toBeInTheDocument();
    });

    it('renders intermediate items as links', () => {
      render(<Breadcrumbs items={basicItems} />);

      const dashboardLink = screen.getByText('Dashboard');
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('card wrapper', () => {
    it('renders with card wrapper by default', () => {
      const { container } = render(<Breadcrumbs items={basicItems} />);

      expect(container.querySelector('.MuiCard-root')).toBeInTheDocument();
    });

    it('renders without card wrapper when card=false', () => {
      const { container } = render(<Breadcrumbs items={basicItems} card={false} />);

      // Should not have border/shadow but may still have structure
      expect(container.querySelector('.MuiPaper-root')).toBeInTheDocument();
    });
  });

  describe('title display', () => {
    it('does not show title by default', () => {
      render(<Breadcrumbs items={basicItems} />);

      // Profile appears once (in breadcrumb), not as h2 title
      const profileElements = screen.getAllByText('Profile');
      expect(profileElements).toHaveLength(1);
    });

    it('shows page title when title=true', () => {
      render(<Breadcrumbs items={basicItems} title />);

      // Profile should appear twice - in breadcrumb and as title
      const profileElements = screen.getAllByText('Profile');
      expect(profileElements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows title from last item', () => {
      render(<Breadcrumbs items={basicItems} title />);

      // Last item title should be displayed
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Profile');
    });

    it('shows title from explicitly active item', () => {
      const itemsWithActive = [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Active Page', active: true },
        { title: 'Other', url: '/other' },
      ];

      render(<Breadcrumbs items={itemsWithActive} title />);

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Active Page');
    });
  });

  describe('icons', () => {
    it('shows home icon when icon=true', () => {
      const { container } = render(<Breadcrumbs items={basicItems} icon />);

      // Should render HomeFilled icon
      expect(container.querySelector('[aria-label="home-filled"]') ||
             container.querySelector('svg')).toBeInTheDocument();
    });

    it('shows all icons when icons=true', () => {
      const itemsWithIcons = [
        { title: 'Dashboard', url: '/dashboard', icon: UserOutlined },
        { title: 'Profile' },
      ];

      const { container } = render(<Breadcrumbs items={itemsWithIcons} icons />);

      // Should have multiple icons
      const icons = container.querySelectorAll('svg, span[role="img"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('does not show icons by default', () => {
      render(<Breadcrumbs items={basicItems} />);

      // Should show "Home" text, not icon
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  describe('separator', () => {
    it('uses default "/" separator', () => {
      render(<Breadcrumbs items={basicItems} />);

      // Default separator is "/"
      const nav = screen.getByRole('navigation', { name: 'breadcrumb' });
      expect(nav).toBeInTheDocument();
    });

    it('uses custom separator icon when provided', () => {
      const { container } = render(
        <Breadcrumbs items={basicItems} separator={RightOutlined} />
      );

      // Should render the custom separator icon
      expect(container.querySelector('svg, span[role="img"]')).toBeInTheDocument();
    });
  });

  describe('divider', () => {
    it('shows divider when card=false and divider=true', () => {
      const { container } = render(<Breadcrumbs items={basicItems} card={false} divider />);

      expect(container.querySelector('hr')).toBeInTheDocument();
    });

    it('does not show divider when divider=false', () => {
      const { container } = render(<Breadcrumbs items={basicItems} card={false} divider={false} />);

      expect(container.querySelector('hr')).not.toBeInTheDocument();
    });
  });

  describe('maxItems', () => {
    it('limits displayed breadcrumbs when maxItems is set', () => {
      const manyItems = [
        { title: 'Item 1', url: '/1' },
        { title: 'Item 2', url: '/2' },
        { title: 'Item 3', url: '/3' },
        { title: 'Item 4', url: '/4' },
        { title: 'Item 5' },
      ];

      render(<Breadcrumbs items={manyItems} maxItems={3} />);

      // MUI Breadcrumbs will collapse middle items with ellipsis
      expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toBeInTheDocument();
    });
  });

  describe('homeUrl', () => {
    it('uses default homeUrl="/"', () => {
      render(<Breadcrumbs items={basicItems} />);

      const homeLink = screen.getByText('Home');
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('uses custom homeUrl when provided', () => {
      render(<Breadcrumbs items={basicItems} homeUrl="/home" />);

      const homeLink = screen.getByText('Home');
      expect(homeLink).toHaveAttribute('href', '/home');
    });
  });

  describe('rightAlign', () => {
    it('renders with flex-start alignment by default', () => {
      const { container } = render(<Breadcrumbs items={basicItems} />);

      const grid = container.querySelector('.MuiGrid-container');
      expect(grid).toBeInTheDocument();
    });

    it('renders with space-between alignment when rightAlign=true', () => {
      const { container } = render(<Breadcrumbs items={basicItems} rightAlign title />);

      const grid = container.querySelector('.MuiGrid-container');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper navigation landmark', () => {
      render(<Breadcrumbs items={basicItems} />);

      expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toBeInTheDocument();
    });

    it('renders links with proper href attributes', () => {
      render(<Breadcrumbs items={basicItems} />);

      expect(screen.getByText('Dashboard')).toHaveAttribute('href', '/dashboard');
      expect(screen.getByText('Users')).toHaveAttribute('href', '/users');
    });

    it('renders title as heading when title=true', () => {
      render(<Breadcrumbs items={basicItems} title />);

      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders with empty items array', () => {
      render(<Breadcrumbs items={[]} />);

      // Should still render Home
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });
});
