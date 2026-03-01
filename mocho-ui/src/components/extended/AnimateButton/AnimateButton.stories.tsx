import type { Meta, StoryObj } from '@storybook/react';
import AnimateButton from '../AnimateButton';
import { Button, Stack } from '@mui/material';

/**
 * AnimateButton wraps buttons with Framer Motion animations.
 * Supports different animation types: slide, scale, and rotate.
 */
const meta: Meta<typeof AnimateButton> = {
  title: 'Components/Primitives/AnimateButton',
  component: AnimateButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['slide', 'scale', 'rotate'],
      description: 'Animation type',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AnimateButton>;

/**
 * Default slide animation
 */
export const Slide: Story = {
  args: {
    type: 'slide',
    children: <Button variant="contained">Hover Me (Slide)</Button>,
  },
};

/**
 * Scale animation
 */
export const Scale: Story = {
  args: {
    type: 'scale',
    children: <Button variant="contained">Hover Me (Scale)</Button>,
  },
};

/**
 * Rotate animation
 */
export const Rotate: Story = {
  args: {
    type: 'rotate',
    children: <Button variant="contained">Hover Me (Rotate)</Button>,
  },
};

/**
 * Different button variants with animations
 */
export const AllVariants: Story = {
  render: () => (
    <Stack spacing={2} direction="row">
      <AnimateButton type="slide">
        <Button variant="contained">Contained (Slide)</Button>
      </AnimateButton>
      <AnimateButton type="scale">
        <Button variant="outlined">Outlined (Scale)</Button>
      </AnimateButton>
      <AnimateButton type="rotate">
        <Button variant="text">Text (Rotate)</Button>
      </AnimateButton>
    </Stack>
  ),
};

/**
 * Different sizes with animations
 */
export const DifferentSizes: Story = {
  render: () => (
    <Stack spacing={2} direction="row" alignItems="center">
      <AnimateButton type="scale">
        <Button variant="contained" size="small">
          Small
        </Button>
      </AnimateButton>
      <AnimateButton type="scale">
        <Button variant="contained" size="medium">
          Medium
        </Button>
      </AnimateButton>
      <AnimateButton type="scale">
        <Button variant="contained" size="large">
          Large
        </Button>
      </AnimateButton>
    </Stack>
  ),
};

/**
 * Colored buttons with animations
 */
export const ColoredButtons: Story = {
  render: () => (
    <Stack spacing={2} direction="row">
      <AnimateButton type="slide">
        <Button variant="contained" color="primary">
          Primary
        </Button>
      </AnimateButton>
      <AnimateButton type="slide">
        <Button variant="contained" color="secondary">
          Secondary
        </Button>
      </AnimateButton>
      <AnimateButton type="slide">
        <Button variant="contained" color="success">
          Success
        </Button>
      </AnimateButton>
      <AnimateButton type="slide">
        <Button variant="contained" color="error">
          Error
        </Button>
      </AnimateButton>
    </Stack>
  ),
};
