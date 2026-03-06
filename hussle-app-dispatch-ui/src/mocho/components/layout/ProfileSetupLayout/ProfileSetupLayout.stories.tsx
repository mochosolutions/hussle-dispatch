import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, Paper, TextField, Button, Stack } from '@mui/material';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProfileSetupLayout from './index';

// Sample profile form content
const ProfileFormContent = () => (
  <Paper sx={{ p: 4, maxWidth: 500, mx: 'auto', my: 4 }}>
    <Typography variant="h5" gutterBottom>
      Complete Your Profile
    </Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>
      Please fill in the information below to complete your profile setup.
    </Typography>
    <Stack spacing={2}>
      <TextField label="Full Name" fullWidth />
      <TextField label="Company" fullWidth />
      <TextField label="Phone" fullWidth />
      <Button variant="contained" fullWidth>
        Continue
      </Button>
    </Stack>
  </Paper>
);

// Onboarding step content
const OnboardingStepContent = () => (
  <Box sx={{ maxWidth: 600, mx: 'auto', my: 4 }}>
    <Typography variant="h4" gutterBottom textAlign="center">
      Welcome to the Platform
    </Typography>
    <Typography color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
      Let's get you set up in just a few steps.
    </Typography>
    <Paper sx={{ p: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h6">Step 1: Basic Information</Typography>
        <TextField label="Display Name" fullWidth />
        <TextField label="Email" type="email" fullWidth disabled value="user@example.com" />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained">Next Step</Button>
        </Box>
      </Stack>
    </Paper>
  </Box>
);

// Verification step content
const VerificationStepContent = () => (
  <Box sx={{ maxWidth: 400, mx: 'auto', my: 4, textAlign: 'center' }}>
    <Typography variant="h4" gutterBottom>
      Verify Your Email
    </Typography>
    <Typography color="text.secondary" sx={{ mb: 4 }}>
      We've sent a verification code to user@example.com
    </Typography>
    <Paper sx={{ p: 4 }}>
      <Stack spacing={3}>
        <TextField
          label="Verification Code"
          placeholder="Enter 6-digit code"
          fullWidth
          inputProps={{ style: { textAlign: 'center', letterSpacing: '0.5em' } }}
        />
        <Button variant="contained" fullWidth>
          Verify
        </Button>
        <Button variant="text" size="small">
          Resend Code
        </Button>
      </Stack>
    </Paper>
  </Box>
);

/**
 * ProfileSetupLayout is a specialized layout for user onboarding and profile setup flows.
 * It provides a clean, focused interface with:
 * - Simple header (typically with logo only)
 * - Centered main content area
 * - Minimal footer
 *
 * The CSS Grid-based layout ensures proper alignment and responsive behavior.
 */
const meta: Meta<typeof ProfileSetupLayout> = {
  title: 'Components/Layouts/ProfileSetupLayout',
  component: ProfileSetupLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A focused layout for profile setup, onboarding, and wizard flows.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProfileSetupLayout>;

export const Default: Story = {
  name: 'Default',
  render: () => (
    <MemoryRouter>
      <Routes>
        <Route path="*" element={<ProfileSetupLayout />}>
          <Route index element={<ProfileFormContent />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};

export const OnboardingStep: Story = {
  name: 'Onboarding Step',
  render: () => (
    <MemoryRouter>
      <Routes>
        <Route path="*" element={<ProfileSetupLayout />}>
          <Route index element={<OnboardingStepContent />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};

export const VerificationStep: Story = {
  name: 'Verification Step',
  render: () => (
    <MemoryRouter>
      <Routes>
        <Route path="*" element={<ProfileSetupLayout />}>
          <Route index element={<VerificationStepContent />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};
