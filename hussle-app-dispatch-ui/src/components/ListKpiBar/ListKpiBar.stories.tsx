import type { Meta, StoryObj } from '@storybook/react';
import ListKpiBar from './index';

const meta: Meta<typeof ListKpiBar> = {
  title: 'Components/ListKpiBar',
  component: ListKpiBar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ListKpiBar>;

export const ThreeItems: Story = {
  args: {
    items: [
      { label: 'Total Carriers', value: 142 },
      { label: 'Active', value: 98 },
      { label: 'Pending', value: 44 },
    ],
  },
};

export const FourItems: Story = {
  args: {
    items: [
      { label: 'Total Carriers', value: 142 },
      { label: 'Active', value: 98 },
      { label: 'Inactive', value: 12 },
      { label: 'Onboarding', value: 32 },
    ],
  },
};

export const FiveItems: Story = {
  args: {
    items: [
      { label: 'Loads', value: 256 },
      { label: 'In Transit', value: 45 },
      { label: 'Delivered', value: 180 },
      { label: 'Cancelled', value: 11 },
      { label: 'Pending', value: 20 },
    ],
  },
};

export const SixItems: Story = {
  args: {
    items: [
      { label: 'Drivers', value: 89 },
      { label: 'Active', value: 62 },
      { label: 'On Leave', value: 8 },
      { label: 'Inactive', value: 5 },
      { label: 'Onboarding', value: 10 },
      { label: 'Terminated', value: 4 },
    ],
  },
};

export const WithSubtitles: Story = {
  args: {
    items: [
      { label: 'Total Carriers', value: 142, subtitle: '+12 this month' },
      { label: 'Active', value: 98, subtitle: '69% of total' },
      { label: 'Pending Review', value: 44, subtitle: '15 urgent' },
    ],
  },
};

export const WithCurrencyValues: Story = {
  args: {
    items: [
      { label: 'Total Revenue', value: '$1,245,000', subtitle: 'Year to date' },
      { label: 'Outstanding', value: '$89,500', subtitle: '12 invoices' },
      { label: 'Avg Load Rate', value: '$2,450', subtitle: 'Per mile: $2.15' },
      { label: 'This Month', value: '$156,200', subtitle: '+8% vs last month' },
    ],
  },
};
