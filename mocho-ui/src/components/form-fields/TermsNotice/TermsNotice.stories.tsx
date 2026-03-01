import type { Meta, StoryObj } from '@storybook/react';
import { TermsNotice } from './index';
import { Stack, Typography } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';

/**
 * TermsNotice displays the terms of service and privacy policy notice for registration forms.
 * Includes links to both documents with customizable text.
 */
const meta: Meta<typeof TermsNotice> = {
  title: 'Components/Form Fields/TermsNotice',
  component: TermsNotice,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  argTypes: {
    termsLink: {
      control: 'text',
      description: 'URL to Terms of Service',
    },
    privacyLink: {
      control: 'text',
      description: 'URL to Privacy Policy',
    },
    customText: {
      control: 'text',
      description: 'Custom text before links (optional)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TermsNotice>;

/**
 * Default terms notice
 */
export const Default: Story = {
  args: {
    termsLink: '/terms',
    privacyLink: '/privacy',
  },
};

/**
 * With custom text
 */
export const WithCustomText: Story = {
  args: {
    termsLink: '/terms',
    privacyLink: '/privacy',
    customText: 'I agree to the',
  },
};

/**
 * External links
 */
export const ExternalLinks: Story = {
  args: {
    termsLink: 'https://example.com/terms',
    privacyLink: 'https://example.com/privacy',
  },
};

/**
 * In context (registration form)
 */
export const InContext: Story = {
  render: () => (
    <Stack spacing={3}>
      <Typography variant="h6">Registration Form Context</Typography>

      <Stack spacing={2} sx={{ maxWidth: 400 }}>
        <Typography variant="body2" color="text.secondary">
          Fill in your details to create an account:
        </Typography>

        {/* Simulated form fields */}
        <Stack
          spacing={1}
          sx={{
            p: 2,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            [Email Field Here]
          </Typography>
          <Typography variant="caption" color="text.secondary">
            [Password Field Here]
          </Typography>
        </Stack>

        {/* Terms Notice */}
        <TermsNotice termsLink="/terms" privacyLink="/privacy" />

        <Typography variant="caption" color="text.secondary">
          [Submit Button Here]
        </Typography>
      </Stack>
    </Stack>
  ),
};

/**
 * Different custom texts
 */
export const CustomTextVariations: Story = {
  render: () => (
    <Stack spacing={3}>
      <Typography variant="h6">Custom Text Variations</Typography>

      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">Default (no custom text):</Typography>
          <TermsNotice termsLink="/terms" privacyLink="/privacy" />
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">Agreement text:</Typography>
          <TermsNotice
            termsLink="/terms"
            privacyLink="/privacy"
            customText="By continuing, you agree to our"
          />
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">Short agreement:</Typography>
          <TermsNotice
            termsLink="/terms"
            privacyLink="/privacy"
            customText="I accept the"
          />
        </Stack>
      </Stack>
    </Stack>
  ),
};
