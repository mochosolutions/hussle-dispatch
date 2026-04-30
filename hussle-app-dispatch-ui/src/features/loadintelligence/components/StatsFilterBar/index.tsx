import React from 'react';
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';

import { Meta } from 'components/Typography';

import type { EquipmentType, LoadFilters, MockLoad, ScoreTier, SourceType } from '../../types';

const SCORE_OPTIONS: ScoreTier[] = ['All', 'Excellent', 'Good', 'Fair', 'Pass'];
const SOURCE_OPTIONS: ('All' | SourceType)[] = ['All', 'DAT', 'Bulk', 'Manual'];
const SOURCE_TYPES: SourceType[] = ['DAT', 'Bulk', 'Manual'];

type SourceFilter = 'All' | SourceType;
type EquipmentFilter = 'All' | EquipmentType;

const EQUIPMENT_OPTIONS: EquipmentFilter[] = ['All', 'DV', 'RF', 'FB', 'SD'];
const EQUIPMENT_LABELS: Record<EquipmentFilter, string> = {
  All: 'All',
  DV: 'Dry Van',
  RF: 'Reefer',
  FB: 'Flatbed',
  SD: 'Step Deck',
};

const SCORE_VALUES: readonly string[] = SCORE_OPTIONS;
const SOURCE_VALUES: readonly string[] = SOURCE_OPTIONS;
const EQUIPMENT_VALUES: readonly string[] = EQUIPMENT_OPTIONS;

const isScoreTier = (value: string): value is ScoreTier => SCORE_VALUES.includes(value);

const isSourceFilter = (value: string): value is SourceFilter => SOURCE_VALUES.includes(value);

const isEquipmentFilter = (value: string): value is EquipmentFilter =>
  EQUIPMENT_VALUES.includes(value);

export interface StatsFilterBarProps {
  loads: MockLoad[];
  filters: LoadFilters;
  onFilterChange: (filters: LoadFilters) => void;
}

const computeSourceCounts = (loads: MockLoad[]): Record<SourceType, number> => {
  const counts: Record<SourceType, number> = { DAT: 0, Bulk: 0, Manual: 0 };
  loads.forEach((load) => {
    counts[load.source.type] += 1;
  });
  return counts;
};

const countUniqueSources = (loads: MockLoad[]): number => {
  const sourceTypes = new Set(loads.map((load) => load.source.type));
  return sourceTypes.size;
};

const StatsFilterBar: React.FC<StatsFilterBarProps> = ({ loads, filters, onFilterChange }) => {
  const sourceCounts = computeSourceCounts(loads);
  const uniqueSourceCount = countUniqueSources(loads);

  const handleScoreChange = (event: SelectChangeEvent) => {
    const { value } = event.target;
    if (isScoreTier(value)) {
      onFilterChange({ ...filters, score: value });
    }
  };

  const handleEquipmentChange = (event: SelectChangeEvent) => {
    const { value } = event.target;
    if (isEquipmentFilter(value)) {
      onFilterChange({ ...filters, equipment: value });
    }
  };

  const handleSourceChange = (event: SelectChangeEvent) => {
    const { value } = event.target;
    if (isSourceFilter(value)) {
      onFilterChange({ ...filters, source: value });
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 2,
        py: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Meta sx={{ color: 'text.primary' }}>
          {loads.length} loads from {uniqueSourceCount} sources
        </Meta>
        {SOURCE_TYPES.map((sourceType) => (
          <Chip
            key={sourceType}
            label={`${sourceType}: ${sourceCounts[sourceType]}`}
            size="small"
            sx={{ color: 'text.secondary', bgcolor: 'grey.100' }}
          />
        ))}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="score-filter-label">Score</InputLabel>
          <Select
            labelId="score-filter-label"
            id="score-filter"
            value={filters.score}
            label="Score"
            variant="outlined"
            onChange={handleScoreChange}
          >
            {SCORE_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="equipment-filter-label">Equipment</InputLabel>
          <Select
            labelId="equipment-filter-label"
            id="equipment-filter"
            value={filters.equipment}
            label="Equipment"
            variant="outlined"
            onChange={handleEquipmentChange}
          >
            {EQUIPMENT_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {EQUIPMENT_LABELS[option]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="source-filter-label">Source</InputLabel>
          <Select
            labelId="source-filter-label"
            id="source-filter"
            value={filters.source}
            label="Source"
            variant="outlined"
            onChange={handleSourceChange}
          >
            {SOURCE_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
};

export default StatsFilterBar;
