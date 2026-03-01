import type { Meta, StoryObj } from '@storybook/react';
import PageLoader from './index';

/**
 * PageLoader is a full-page loading overlay displayed during async operations.
 */
const meta: Meta<typeof PageLoader> = {
  title: 'Components/Feedback/PageLoader',
  component: PageLoader,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PageLoader>;

/**
 * Default page loader
 */
export const Default: Story = {};

/**
 * Page loader with custom message (if supported)
 */
export const Loading: Story = {
  render: () => (
    <div style={{ height: '100vh', position: 'relative' }}>
      <PageLoader />
    </div>
  ),
};
