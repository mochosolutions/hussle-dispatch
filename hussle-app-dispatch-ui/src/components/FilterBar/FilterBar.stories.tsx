import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Box } from '@mui/material';

import { FilterBar } from './FilterBar';
import type {
  FilterConfig,
  SelectFilterConfig,
  MultiChipFilterConfig,
  DateRangeFilterConfig,
  ToggleFilterConfig,
  SearchConfig,
} from './filterBarTypes';

const meta: Meta<typeof FilterBar> = {
  title: 'Components/FilterBar',
  component: FilterBar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FilterBar>;

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
];

const TAG_OPTIONS = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low Priority' },
  { value: 'vip', label: 'VIP' },
];

const AllFilterTypesDemo = () => {
  const [status, setStatus] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState<string | number>('');

  const filters: FilterConfig[] = [
    {
      type: 'select',
      name: 'status',
      label: 'Status',
      options: STATUS_OPTIONS,
      value: status,
      onChange: setStatus,
    },
    {
      type: 'multiSelectChip',
      name: 'tags',
      label: 'Tags',
      options: TAG_OPTIONS,
      value: tags,
      onChange: setTags,
    },
    {
      type: 'dateRange',
      name: 'dateRange',
      label: 'Date Range',
      from,
      to,
      onChange: (newFrom, newTo) => {
        setFrom(newFrom);
        setTo(newTo);
      },
    },
    {
      type: 'toggle',
      name: 'showArchived',
      label: 'Show Archived',
      checked: showArchived,
      onChange: setShowArchived,
    },
  ];

  const searchConfig: SearchConfig = {
    placeholder: 'Search items...',
    value: search,
    onChange: setSearch,
  };

  return (
    <Box sx={{ width: '100%' }}>
      <FilterBar filters={filters} search={searchConfig} />
    </Box>
  );
};

export const AllFilterTypes: Story = {
  render: () => <AllFilterTypesDemo />,
};

const SelectOnlyDemo = () => {
  const [status, setStatus] = useState('');
  const filter: SelectFilterConfig = {
    type: 'select',
    name: 'status',
    label: 'Status',
    options: STATUS_OPTIONS,
    value: status,
    onChange: setStatus,
  };
  return <FilterBar filters={[filter]} />;
};

export const SelectOnly: Story = {
  render: () => <SelectOnlyDemo />,
};

const MultiChipOnlyDemo = () => {
  const [tags, setTags] = useState<string[]>(['urgent']);
  const filter: MultiChipFilterConfig = {
    type: 'multiSelectChip',
    name: 'tags',
    label: 'Tags',
    options: TAG_OPTIONS,
    value: tags,
    onChange: setTags,
  };
  return <FilterBar filters={[filter]} />;
};

export const MultiChipOnly: Story = {
  render: () => <MultiChipOnlyDemo />,
};

const DateRangeOnlyDemo = () => {
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const filter: DateRangeFilterConfig = {
    type: 'dateRange',
    name: 'dateRange',
    label: 'Date Range',
    from,
    to,
    onChange: (newFrom, newTo) => {
      setFrom(newFrom);
      setTo(newTo);
    },
  };
  return <FilterBar filters={[filter]} />;
};

export const DateRangeOnly: Story = {
  render: () => <DateRangeOnlyDemo />,
};

const ToggleOnlyDemo = () => {
  const [checked, setChecked] = useState(false);
  const filter: ToggleFilterConfig = {
    type: 'toggle',
    name: 'showArchived',
    label: 'Show Archived',
    checked,
    onChange: setChecked,
  };
  return <FilterBar filters={[filter]} />;
};

export const ToggleOnly: Story = {
  render: () => <ToggleOnlyDemo />,
};

const SearchOnlyDemo = () => {
  const [search, setSearch] = useState<string | number>('');
  const searchConfig: SearchConfig = {
    placeholder: 'Search items...',
    value: search,
    onChange: setSearch,
  };
  return <FilterBar filters={[]} search={searchConfig} />;
};

export const SearchOnly: Story = {
  render: () => <SearchOnlyDemo />,
};

const WithoutSearchDemo = () => {
  const [status, setStatus] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const filters: FilterConfig[] = [
    {
      type: 'select',
      name: 'status',
      label: 'Status',
      options: STATUS_OPTIONS,
      value: status,
      onChange: setStatus,
    },
    {
      type: 'multiSelectChip',
      name: 'tags',
      label: 'Tags',
      options: TAG_OPTIONS,
      value: tags,
      onChange: setTags,
    },
  ];
  return <FilterBar filters={filters} />;
};

export const WithoutSearch: Story = {
  render: () => <WithoutSearchDemo />,
};
