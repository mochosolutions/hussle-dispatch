import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Box, Typography, Paper, InputAdornment } from '@mui/material';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import DebouncedInput from './index';

/**
 * DebouncedInput is a search input field that delays triggering the filter callback
 * until the user has stopped typing for a specified duration.
 *
 * This is useful for search fields that trigger API calls, as it prevents
 * excessive requests while the user is still typing.
 */
const meta: Meta<typeof DebouncedInput> = {
  title: 'Components/Data Display/DebouncedInput',
  component: DebouncedInput,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'Current input value',
    },
    onFilterChange: {
      action: 'filterChanged',
      description: 'Callback fired after debounce delay',
    },
    debounce: {
      control: { type: 'number', min: 100, max: 2000, step: 100 },
      description: 'Debounce delay in milliseconds',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    size: {
      control: 'select',
      options: ['small', 'medium'],
      description: 'Input size',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DebouncedInput>;

// Interactive demo with live filter display
const InteractiveDemo = ({ debounce = 500 }: { debounce?: number }) => {
  const [inputValue, setInputValue] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [filterCount, setFilterCount] = useState(0);

  const handleFilterChange = (value: string | number) => {
    setFilterValue(String(value));
    setFilterCount((prev) => prev + 1);
  };

  return (
    <Box sx={{ maxWidth: 500 }}>
      <DebouncedInput
        value={inputValue}
        onFilterChange={handleFilterChange}
        debounce={debounce}
        placeholder="Type to search..."
        onChange={(e) => setInputValue(e.target.value)}
      />
      <Paper sx={{ mt: 2, p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Current input: <strong>{inputValue || '(empty)'}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Filtered value: <strong>{filterValue || '(empty)'}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Filter callbacks: <strong>{filterCount}</strong>
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Notice how the filter value only updates after you stop typing for {debounce}ms
        </Typography>
      </Paper>
    </Box>
  );
};

export const Default: Story = {
  args: {
    value: '',
    placeholder: 'Search...',
    debounce: 500,
  },
};

export const Interactive: Story = {
  name: 'Interactive Demo',
  render: () => <InteractiveDemo />,
};

export const FastDebounce: Story = {
  name: 'Fast Debounce (200ms)',
  render: () => <InteractiveDemo debounce={200} />,
};

export const SlowDebounce: Story = {
  name: 'Slow Debounce (1000ms)',
  render: () => <InteractiveDemo debounce={1000} />,
};

export const SmallSize: Story = {
  args: {
    value: '',
    placeholder: 'Small search...',
    debounce: 500,
    size: 'small',
  },
};

export const WithInitialValue: Story = {
  args: {
    value: 'initial search term',
    placeholder: 'Search...',
    debounce: 500,
  },
};

export const WithoutSearchIcon: Story = {
  args: {
    value: '',
    placeholder: 'Filter...',
    debounce: 500,
    startAdornment: undefined,
  },
};

export const WithCustomIcon: Story = {
  args: {
    value: '',
    placeholder: 'Filter items...',
    debounce: 500,
    startAdornment: (
      <InputAdornment position="start">
        <FilterListIcon />
      </InputAdornment>
    ),
  },
};

export const FullWidth: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Box sx={{ width: '100%' }}>
        <DebouncedInput
          value={value}
          onFilterChange={() => {}}
          placeholder="Full width search..."
          sx={{ width: '100%', minWidth: 'auto' }}
          onChange={(e) => setValue(e.target.value)}
        />
      </Box>
    );
  },
};

export const InTableHeader: Story = {
  name: 'In Table Header Context',
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Paper sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6">Data Table</Typography>
          <DebouncedInput
            value={value}
            onFilterChange={() => {}}
            placeholder="Search records..."
            size="small"
            onChange={(e) => setValue(e.target.value)}
          />
        </Box>
        <Box
          sx={{
            height: 200,
            bgcolor: 'action.hover',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography color="text.secondary">Table content goes here</Typography>
        </Box>
      </Paper>
    );
  },
};

export const Disabled: Story = {
  args: {
    value: '',
    placeholder: 'Disabled input...',
    debounce: 500,
    disabled: true,
  },
};
