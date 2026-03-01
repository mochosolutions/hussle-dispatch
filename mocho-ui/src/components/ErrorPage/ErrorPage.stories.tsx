import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ErrorPage from './index';

/**
 * ErrorPage is a simple error page component that displays when an unexpected error occurs.
 * It provides a user-friendly message indicating something went wrong.
 */
const meta: Meta<typeof ErrorPage> = {
  title: 'Components/Feedback/ErrorPage',
  component: ErrorPage,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ErrorPage>;

/**
 * Default error page
 */
export const Default: Story = {
  render: () => <ErrorPage />,
};

/**
 * Centered in viewport
 */
export const CenteredInViewport: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <ErrorPage />
    </div>
  ),
};

/**
 * With custom styling wrapper
 */
export const WithCustomWrapper: Story = {
  render: () => (
    <div
      style={{
        padding: '2rem',
        maxWidth: '600px',
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      <ErrorPage />
    </div>
  ),
};
