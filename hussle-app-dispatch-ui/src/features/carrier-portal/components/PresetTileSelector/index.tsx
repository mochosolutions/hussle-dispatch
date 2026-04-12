import { useState } from 'react';
import { Box, Chip, TextField } from '@mui/material';

interface PresetOption {
  value: number;
  label: string;
}

interface PresetTileSelectorProps {
  presets: PresetOption[];
  value: number;
  onChange: (v: number) => void;
}

export const PresetTileSelector: React.FC<PresetTileSelectorProps> = ({
  presets,
  value,
  onChange,
}) => {
  const [customOpen, setCustomOpen] = useState(false);

  const isPresetSelected = presets.some((p) => p.value === value);
  const isCustomActive = !isPresetSelected && value !== 0;

  const handlePresetClick = (presetValue: number) => {
    setCustomOpen(false);
    onChange(presetValue);
  };

  const handleCustomClick = () => {
    setCustomOpen(true);
  };

  const handleCustomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(event.target.value);
    if (!Number.isNaN(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
      {presets.map((preset) => (
        <Chip
          key={preset.value}
          label={preset.label}
          variant={value === preset.value ? 'filled' : 'outlined'}
          color={value === preset.value ? 'primary' : 'default'}
          onClick={() => handlePresetClick(preset.value)}
          sx={{ cursor: 'pointer' }}
        />
      ))}
      <Chip
        label="Custom"
        variant={isCustomActive || customOpen ? 'filled' : 'outlined'}
        color={isCustomActive || customOpen ? 'primary' : 'default'}
        onClick={handleCustomClick}
        sx={{ cursor: 'pointer' }}
      />
      {customOpen && (
        <TextField
          type="number"
          size="small"
          value={isCustomActive ? value : ''}
          onChange={handleCustomChange}
          placeholder="Enter amount"
          sx={{ width: 140 }}
        />
      )}
    </Box>
  );
};
