import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { Place } from '../../types';
import { typeaheadPlaces } from 'utils/api/places/placeApi';
import { PlaceInfoDrawer } from '../PlaceInfoDrawer';

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

interface PlaceTypeaheadProps {
  value: Place | null;
  onChange: (place: Place | null) => void;
  onAutoFill?: (place: Place) => void;
  disabled?: boolean;
  label?: string;
  error?: boolean;
  helperText?: string;
}

const FACILITY_TYPE_LABELS: Record<string, string> = {
  WAREHOUSE: 'Warehouse',
  DISTRIBUTION_CENTER: 'DC',
  MANUFACTURING: 'Mfg',
  COLD_STORAGE: 'Cold',
  CROSS_DOCK: 'Cross-Dock',
  PORT: 'Port',
  RAIL_YARD: 'Rail',
  DROP_YARD: 'Drop Yard',
  OTHER: 'Other',
};

const formatOptionLabel = (place: Place): string =>
  `${place.name} — ${place.city}, ${place.state}`;

export const PlaceTypeahead: React.FC<PlaceTypeaheadProps> = ({
  value,
  onChange,
  onAutoFill,
  disabled = false,
  label = 'Place',
  error = false,
  helperText,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchOptions = useCallback(async (query: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      const { places } = await typeaheadPlaces(query, 10);
      setOptions(places);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setOptions([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (inputValue.length < MIN_CHARS) {
      setOptions([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      void fetchOptions(inputValue);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue, fetchOptions]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSelectionChange = useCallback(
    (_event: React.SyntheticEvent, newValue: Place | null) => {
      onChange(newValue);
      if (newValue && onAutoFill) {
        onAutoFill(newValue);
      }
    },
    [onChange, onAutoFill],
  );

  const handleOpenCreateDrawer = useCallback(() => {
    setCreateDrawerOpen(true);
  }, []);

  const handleCloseCreateDrawer = useCallback(() => {
    setCreateDrawerOpen(false);
  }, []);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Autocomplete<Place, false, false, false>
          value={value}
          onChange={handleSelectionChange}
          inputValue={inputValue}
          onInputChange={(_event, newInputValue) => setInputValue(newInputValue)}
          options={options}
          getOptionLabel={formatOptionLabel}
          isOptionEqualToValue={(option, val) => option.id === val.id}
          loading={loading}
          noOptionsText={
            inputValue.length < MIN_CHARS
              ? 'Type at least 2 characters'
              : 'No places found'
          }
          disabled={disabled}
          fullWidth
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              size="small"
              error={error}
              helperText={helperText}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={18} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.id}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {option.name}
                  </Typography>
                  {option.facilityType && (
                    <Chip
                      label={FACILITY_TYPE_LABELS[option.facilityType] ?? option.facilityType}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.625rem' }}
                    />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {option.city}, {option.state}
                </Typography>
                {option.contactName && (
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                    {option.contactName}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
          sx={{ flex: 1 }}
        />
        <IconButton
          onClick={handleOpenCreateDrawer}
          disabled={disabled}
          size="small"
          aria-label="Create new place"
          sx={{ mt: 0.25 }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>

      {createDrawerOpen && (
        <PlaceInfoDrawer onClose={handleCloseCreateDrawer} />
      )}
    </>
  );
};
