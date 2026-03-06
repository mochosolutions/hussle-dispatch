import type { Meta, StoryObj } from '@storybook/react';
import Tooltip from '../Tooltip';
import { Button, IconButton, Stack, Typography, Box } from '@mui/material';
import { InfoCircleOutlined, QuestionCircleOutlined, SettingOutlined } from '@ant-design/icons';

/**
 * Tooltip displays informative text when users hover over, focus on, or tap an element.
 * Supports customizable colors, arrow display, and positioning.
 */
const meta: Meta<typeof Tooltip> = {
  title: 'Components/Extended/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Tooltip content',
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'error', 'warning', 'info'],
      description: 'Tooltip background color',
    },
    arrow: {
      control: 'boolean',
      description: 'Show arrow pointing to anchor',
    },
    placement: {
      control: 'select',
      options: [
        'top', 'top-start', 'top-end',
        'bottom', 'bottom-start', 'bottom-end',
        'left', 'left-start', 'left-end',
        'right', 'right-start', 'right-end',
      ],
      description: 'Tooltip placement',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

/**
 * Default tooltip
 */
export const Default: Story = {
  args: {
    title: 'This is a tooltip',
    children: <Button variant="contained">Hover me</Button>,
  },
};

/**
 * Tooltip with arrow
 */
export const WithArrow: Story = {
  args: {
    title: 'Tooltip with arrow',
    arrow: true,
    children: <Button variant="contained">Hover me</Button>,
  },
};

/**
 * Primary colored tooltip
 */
export const PrimaryColor: Story = {
  args: {
    title: 'Primary tooltip',
    color: 'primary',
    arrow: true,
    children: <Button variant="outlined">Primary</Button>,
  },
};

/**
 * Secondary colored tooltip
 */
export const SecondaryColor: Story = {
  args: {
    title: 'Secondary tooltip',
    color: 'secondary',
    arrow: true,
    children: <Button variant="outlined">Secondary</Button>,
  },
};

/**
 * Success colored tooltip
 */
export const SuccessColor: Story = {
  args: {
    title: 'Success tooltip',
    color: 'success',
    arrow: true,
    children: <Button variant="outlined" color="success">Success</Button>,
  },
};

/**
 * Error colored tooltip
 */
export const ErrorColor: Story = {
  args: {
    title: 'Error tooltip',
    color: 'error',
    arrow: true,
    children: <Button variant="outlined" color="error">Error</Button>,
  },
};

/**
 * Warning colored tooltip
 */
export const WarningColor: Story = {
  args: {
    title: 'Warning tooltip',
    color: 'warning',
    arrow: true,
    children: <Button variant="outlined" color="warning">Warning</Button>,
  },
};

/**
 * Info colored tooltip
 */
export const InfoColor: Story = {
  args: {
    title: 'Info tooltip',
    color: 'info',
    arrow: true,
    children: <Button variant="outlined" color="info">Info</Button>,
  },
};

/**
 * All placement options
 */
export const AllPlacements: Story = {
  render: () => (
    <Box sx={{ width: 500, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ position: 'relative', width: 300 }}>
        {/* Top row */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <Tooltip title="top-start" placement="top-start" arrow color="primary">
            <Button sx={{ mx: 0.5 }}>top-start</Button>
          </Tooltip>
          <Tooltip title="top" placement="top" arrow color="primary">
            <Button sx={{ mx: 0.5 }}>top</Button>
          </Tooltip>
          <Tooltip title="top-end" placement="top-end" arrow color="primary">
            <Button sx={{ mx: 0.5 }}>top-end</Button>
          </Tooltip>
        </Box>

        {/* Middle rows */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
          <Box>
            <Tooltip title="left-start" placement="left-start" arrow color="secondary">
              <Button sx={{ mb: 0.5 }}>left-start</Button>
            </Tooltip>
            <br />
            <Tooltip title="left" placement="left" arrow color="secondary">
              <Button sx={{ mb: 0.5 }}>left</Button>
            </Tooltip>
            <br />
            <Tooltip title="left-end" placement="left-end" arrow color="secondary">
              <Button>left-end</Button>
            </Tooltip>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Tooltip title="right-start" placement="right-start" arrow color="success">
              <Button sx={{ mb: 0.5 }}>right-start</Button>
            </Tooltip>
            <br />
            <Tooltip title="right" placement="right" arrow color="success">
              <Button sx={{ mb: 0.5 }}>right</Button>
            </Tooltip>
            <br />
            <Tooltip title="right-end" placement="right-end" arrow color="success">
              <Button>right-end</Button>
            </Tooltip>
          </Box>
        </Box>

        {/* Bottom row */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <Tooltip title="bottom-start" placement="bottom-start" arrow color="warning">
            <Button sx={{ mx: 0.5 }}>bottom-start</Button>
          </Tooltip>
          <Tooltip title="bottom" placement="bottom" arrow color="warning">
            <Button sx={{ mx: 0.5 }}>bottom</Button>
          </Tooltip>
          <Tooltip title="bottom-end" placement="bottom-end" arrow color="warning">
            <Button sx={{ mx: 0.5 }}>bottom-end</Button>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  ),
};

/**
 * All colors showcase
 */
export const AllColors: Story = {
  render: () => (
    <Stack spacing={4}>
      <Typography variant="h6">Tooltip Colors</Typography>

      <Stack spacing={2} direction="row" flexWrap="wrap">
        <Tooltip title="Primary tooltip" color="primary" arrow>
          <Button variant="outlined" color="primary">Primary</Button>
        </Tooltip>
        <Tooltip title="Secondary tooltip" color="secondary" arrow>
          <Button variant="outlined" color="secondary">Secondary</Button>
        </Tooltip>
        <Tooltip title="Success tooltip" color="success" arrow>
          <Button variant="outlined" color="success">Success</Button>
        </Tooltip>
        <Tooltip title="Error tooltip" color="error" arrow>
          <Button variant="outlined" color="error">Error</Button>
        </Tooltip>
        <Tooltip title="Warning tooltip" color="warning" arrow>
          <Button variant="outlined" color="warning">Warning</Button>
        </Tooltip>
        <Tooltip title="Info tooltip" color="info" arrow>
          <Button variant="outlined" color="info">Info</Button>
        </Tooltip>
      </Stack>
    </Stack>
  ),
};

/**
 * Tooltip on icon buttons
 */
export const OnIconButtons: Story = {
  render: () => (
    <Stack spacing={2} direction="row">
      <Tooltip title="Information" color="info" arrow>
        <IconButton color="info">
          <InfoCircleOutlined />
        </IconButton>
      </Tooltip>
      <Tooltip title="Help" color="primary" arrow>
        <IconButton color="primary">
          <QuestionCircleOutlined />
        </IconButton>
      </Tooltip>
      <Tooltip title="Settings" color="secondary" arrow>
        <IconButton color="secondary">
          <SettingOutlined />
        </IconButton>
      </Tooltip>
    </Stack>
  ),
};

/**
 * Tooltip with custom label color
 */
export const CustomLabelColor: Story = {
  args: {
    title: 'Custom label color',
    color: 'primary',
    labelColor: '#ffeb3b',
    arrow: true,
    children: <Button variant="contained">Custom Label</Button>,
  },
};

/**
 * Rich content tooltip
 */
export const RichContent: Story = {
  render: () => (
    <Tooltip
      title={
        <Box>
          <Typography variant="subtitle2">Rich Tooltip</Typography>
          <Typography variant="body2">
            This tooltip contains multiple lines of content
            with formatted text.
          </Typography>
        </Box>
      }
      arrow
      color="primary"
    >
      <Button variant="contained">Rich Content</Button>
    </Tooltip>
  ),
};

/**
 * Common use cases
 */
export const UseCases: Story = {
  render: () => (
    <Stack spacing={4}>
      <Typography variant="h6">Common Use Cases</Typography>

      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="subtitle2">Help text for form fields</Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography>Password</Typography>
            <Tooltip title="Password must be at least 8 characters with one uppercase letter and number" arrow color="info">
              <IconButton size="small" color="info">
                <QuestionCircleOutlined />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">Disabled button explanation</Typography>
          <Tooltip title="Complete all required fields to enable this button" arrow color="warning">
            <span>
              <Button variant="contained" disabled>
                Submit
              </Button>
            </span>
          </Tooltip>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">Truncated text expansion</Typography>
          <Tooltip title="This is a very long text that would be truncated in the UI but can be seen in full via tooltip" arrow>
            <Typography
              sx={{
                maxWidth: 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              This is a very long text that would be truncated
            </Typography>
          </Tooltip>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">Action confirmation</Typography>
          <Tooltip title="This will permanently delete the item" arrow color="error">
            <Button variant="outlined" color="error">
              Delete
            </Button>
          </Tooltip>
        </Stack>
      </Stack>
    </Stack>
  ),
};
