import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import ImageRadioGroup from './index';

/**
 * ImageRadioGroup displays a group of radio buttons with images.
 * Each option shows an image and title, with visual feedback on selection.
 *
 * Supports both controlled and uncontrolled usage patterns.
 */
const meta: Meta<typeof ImageRadioGroup> = {
  title: 'Components/Complex/ImageRadioGroup',
  component: ImageRadioGroup,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    selectedValue: {
      control: 'text',
      description: 'Currently selected value (controlled)',
    },
    defaultValue: {
      control: 'text',
      description: 'Default selected value (uncontrolled)',
    },
    onChange: {
      action: 'changed',
      description: 'Callback when selection changes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImageRadioGroup>;

const planOptions = [
  {
    value: 'basic',
    title: 'Basic',
    imageUrl: 'https://via.placeholder.com/100x100?text=Basic',
  },
  {
    value: 'pro',
    title: 'Professional',
    imageUrl: 'https://via.placeholder.com/100x100?text=Pro',
  },
  {
    value: 'enterprise',
    title: 'Enterprise',
    imageUrl: 'https://via.placeholder.com/100x100?text=Ent',
  },
];

const themeOptions = [
  {
    value: 'light',
    title: 'Light Mode',
    imageUrl: 'https://via.placeholder.com/100x100/ffffff/333333?text=☀️',
  },
  {
    value: 'dark',
    title: 'Dark Mode',
    imageUrl: 'https://via.placeholder.com/100x100/1a1a1a/ffffff?text=🌙',
  },
];

const layoutOptions = [
  {
    value: 'grid',
    title: 'Grid Layout',
    imageUrl: 'https://via.placeholder.com/100x100?text=Grid',
  },
  {
    value: 'list',
    title: 'List Layout',
    imageUrl: 'https://via.placeholder.com/100x100?text=List',
  },
  {
    value: 'masonry',
    title: 'Masonry',
    imageUrl: 'https://via.placeholder.com/100x100?text=Msnry',
  },
];

export const Default: Story = {
  args: {
    options: planOptions,
  },
};

export const WithDefaultValue: Story = {
  args: {
    options: planOptions,
    defaultValue: 'pro',
  },
};

export const ThemeSelector: Story = {
  args: {
    options: themeOptions,
    defaultValue: 'light',
  },
};

export const LayoutSelector: Story = {
  args: {
    options: layoutOptions,
  },
};

const ControlledExample = () => {
  const [selected, setSelected] = useState('basic');

  return (
    <Box>
      <ImageRadioGroup
        options={planOptions}
        selectedValue={selected}
        onChange={setSelected}
      />
      <Paper sx={{ mt: 3, p: 2 }}>
        <Typography variant="body2">
          Selected plan: <strong>{selected}</strong>
        </Typography>
      </Paper>
    </Box>
  );
};

export const Controlled: Story = {
  name: 'Controlled Component',
  render: () => <ControlledExample />,
};

const PricingExample = () => {
  const [selectedPlan, setSelectedPlan] = useState('basic');

  const pricingOptions = [
    {
      value: 'starter',
      title: 'Starter - $9/mo',
      imageUrl: 'https://via.placeholder.com/100x100/e3f2fd/1976d2?text=🚀',
    },
    {
      value: 'growth',
      title: 'Growth - $29/mo',
      imageUrl: 'https://via.placeholder.com/100x100/e8f5e9/388e3c?text=📈',
    },
    {
      value: 'scale',
      title: 'Scale - $99/mo',
      imageUrl: 'https://via.placeholder.com/100x100/fce4ec/c2185b?text=🏢',
    },
  ];

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom align="center">
        Choose Your Plan
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }} align="center">
        Select the plan that best fits your needs
      </Typography>
      <ImageRadioGroup
        options={pricingOptions}
        selectedValue={selectedPlan}
        onChange={setSelectedPlan}
      />
    </Box>
  );
};

export const PricingSelector: Story = {
  name: 'Pricing Plan Selector',
  render: () => <PricingExample />,
};

const OnboardingExample = () => {
  const [role, setRole] = useState('');

  const roleOptions = [
    {
      value: 'developer',
      title: 'Developer',
      imageUrl: 'https://via.placeholder.com/100x100/e3f2fd/1976d2?text=👩‍💻',
    },
    {
      value: 'designer',
      title: 'Designer',
      imageUrl: 'https://via.placeholder.com/100x100/f3e5f5/7b1fa2?text=🎨',
    },
    {
      value: 'manager',
      title: 'Manager',
      imageUrl: 'https://via.placeholder.com/100x100/e8f5e9/388e3c?text=📊',
    },
    {
      value: 'other',
      title: 'Other',
      imageUrl: 'https://via.placeholder.com/100x100/fff3e0/f57c00?text=🤔',
    },
  ];

  return (
    <Paper sx={{ p: 4, maxWidth: 700, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        What best describes your role?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        This helps us personalize your experience
      </Typography>
      <ImageRadioGroup
        options={roleOptions}
        selectedValue={role}
        onChange={setRole}
      />
      {role && (
        <Typography sx={{ mt: 2 }}>
          You selected: <strong>{role}</strong>
        </Typography>
      )}
    </Paper>
  );
};

export const OnboardingFlow: Story = {
  name: 'Onboarding Flow Example',
  render: () => <OnboardingExample />,
};
