import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PaperProps } from '@mui/material';
import {
  Autocomplete,
  Box,
  CircularProgress,
  IconButton,
  Paper,
  TextField as MuiTextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import WarehouseOutlined from '@mui/icons-material/WarehouseOutlined';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import ClearIcon from '@mui/icons-material/Clear';
import { searchAddresses } from 'utils/api/places/placeApi';
import type { AddressSearchResult } from 'features/place/types';

const SHORT_DEBOUNCE_MS = 150;
const LONG_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const CACHE_TTL_MS = 5 * 60 * 1000;

export interface AddressTypeaheadProps {
  /** Current display value for the input */
  value: string;
  /** Called when user selects a result */
  onSelect: (result: AddressSearchResult) => void;
  /** Called when user clears the selection */
  onClear: () => void;
  /** Whether a place is currently selected */
  hasSelection?: boolean;
  /** Disable the input */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Label above the field */
  label?: string;
}

interface AddressOption {
  value: string;
  label: string;
  description: string;
  group: string;
  source: 'SAVED' | 'EXTERNAL';
  facilityType: string | null;
}

interface CacheEntry {
  results: AddressSearchResult[];
  timestamp: number;
}

const GROUP_SAVED = 'SAVED PLACES';
const GROUP_EXTERNAL = 'ADDRESS RESULTS';

const mapResultsToOptions = (results: AddressSearchResult[]): AddressOption[] =>
  results.map((result) => {
    const isSaved = result.source === 'SAVED';
    const description = isSaved
      ? [result.address, result.city, result.state].filter(Boolean).join(', ')
      : result.zip || '';

    return {
      value: result.id,
      label: result.name,
      description,
      group: isSaved ? GROUP_SAVED : GROUP_EXTERNAL,
      source: result.source,
      facilityType: result.facilityType,
    };
  });

export const AddressTypeahead: React.FC<AddressTypeaheadProps> = ({
  value,
  onSelect,
  onClear,
  hasSelection = false,
  disabled = false,
  placeholder = 'Search saved places or type an address',
  label = 'Facility / Address',
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);
  const justSelectedRef = useRef(false);
  const hasSelectionRef = useRef(hasSelection);

  // Keep ref in sync so the search effect can read it without re-triggering
  hasSelectionRef.current = hasSelection;

  // Sync input when external value changes
  useEffect(() => {
    if (!justSelectedRef.current) {
      setInputValue(value);
      setDropdownOpen(false);
    }
    justSelectedRef.current = false;
  }, [value]);

  // Debounced search with AbortController and caching
  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }

    // Don't auto-search when a place is already selected —
    // the user must clear the selection first to trigger a new search
    if (hasSelectionRef.current) {
      return;
    }

    if (inputValue.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setDropdownOpen(false);
      setLoading(false);
      return;
    }

    const cacheKey = inputValue.toLowerCase().trim();
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setResults(cached.results);
      setDropdownOpen(cached.results.length > 0);
      setLoading(false);
      return;
    }

    const debounceMs = inputValue.length >= 5 ? SHORT_DEBOUNCE_MS : LONG_DEBOUNCE_MS;
    setLoading(true);
    setDropdownOpen(true);

    const timer = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      void searchAddresses(inputValue, 10, controller.signal)
        .then((response) => {
          if (controller.signal.aborted) {
            return;
          }
          setResults(response);
          setDropdownOpen(response.length > 0);
          cacheRef.current.set(cacheKey, { results: response, timestamp: Date.now() });
        })
        .catch((error: unknown) => {
          if (error instanceof Error && error.name === 'CanceledError') {
            return;
          }
          setResults([]);
          setDropdownOpen(false);
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [inputValue]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    },
    [],
  );

  const options = useMemo(() => mapResultsToOptions(results), [results]);

  const hasBothGroups = useMemo(() => {
    const groups = new Set(options.map((o) => o.group));
    return groups.size > 1;
  }, [options]);

  const handleOptionSelect = useCallback(
    (_event: React.SyntheticEvent, option: AddressOption | null) => {
      if (option === null) {
        return;
      }

      const selected = results.find((r) => r.id === option.value);
      if (selected === undefined) {
        return;
      }

      const display = [selected.address, selected.city, selected.state]
        .filter(Boolean)
        .join(', ');
      justSelectedRef.current = true;
      setInputValue(display || selected.name);
      setResults([]);
      setDropdownOpen(false);

      onSelect(selected);
    },
    [results, onSelect],
  );

  const handleClear = useCallback(() => {
    setInputValue('');
    setResults([]);
    setDropdownOpen(false);
    onClear();
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [onClear]);

  const handleInputChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string, reason: string) => {
      if (reason === 'clear') {
        handleClear();
        return;
      }
      if (reason === 'input') {
        setInputValue(newValue);

        if (hasSelection) {
          onClear();
        }
      }
    },
    [handleClear, hasSelection, onClear],
  );

  const handleInputFocus = useCallback(() => {
    if (hasSelection && inputRef.current) {
      inputRef.current.select();
    }
  }, [hasSelection]);

  const DropdownPaper = useMemo(
    () =>
      function AddressDropdownPaper(paperProps: PaperProps) {
        return (
          <Paper
            {...paperProps}
            elevation={8}
            sx={{
              ...((paperProps.sx ?? {}) as Record<string, unknown>),
              borderRadius: 2,
              overflow: 'hidden',
            }}
          />
        );
      },
    [],
  );

  return (
    <Box>
      {label ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600, textTransform: 'uppercase', mb: 0.5, display: 'block' }}
        >
          {label}
        </Typography>
      ) : null}

      <Autocomplete<AddressOption, false, false, false>
        disabled={disabled}
        open={dropdownOpen}
        onOpen={() => {
          if (inputValue.length >= MIN_QUERY_LENGTH && (loading || options.length > 0)) {
            setDropdownOpen(true);
          }
        }}
        onClose={() => setDropdownOpen(false)}
        options={options}
        value={null}
        inputValue={inputValue}
        loading={loading}
        loadingText={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, py: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Searching...
            </Typography>
          </Box>
        }
        noOptionsText="No addresses match"
        groupBy={hasBothGroups ? (option) => option.group : undefined}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, val) => option.value === val.value}
        onInputChange={handleInputChange}
        onChange={handleOptionSelect}
        filterOptions={(x) => x}
        PaperComponent={DropdownPaper}
        renderGroup={(params) => (
          <Box key={params.key} component="li" sx={{ listStyle: 'none' }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'text.secondary',
                px: 2,
                py: 0.75,
                display: 'block',
                backgroundColor: 'grey.50',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              {params.group}
            </Typography>
            <Box component="ul" sx={{ p: 0, m: 0 }}>
              {params.children}
            </Box>
          </Box>
        )}
        renderOption={(props, option) => {
          const isSaved = option.source === 'SAVED';
          return (
            <Box
              component="li"
              {...props}
              key={option.value}
              sx={{
                '&:hover': { backgroundColor: 'action.hover' },
                cursor: 'pointer',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, width: '100%' }}>
                {isSaved ? (
                  <WarehouseOutlined sx={{ fontSize: 18, color: 'success.main', mt: 0.25 }} />
                ) : (
                  <PlaceOutlined sx={{ fontSize: 18, color: 'primary.main', mt: 0.25 }} />
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: isSaved ? 'text.primary' : 'primary.main' }}
                  >
                    {option.label}
                  </Typography>
                  {option.description ? (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {option.description}
                    </Typography>
                  ) : null}
                </Box>
                {option.facilityType ? (
                  <Box
                    component="span"
                    sx={{
                      fontSize: '0.625rem',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 0.5,
                      px: 0.75,
                      py: 0.25,
                      color: 'text.secondary',
                      flexShrink: 0,
                      mt: 0.25,
                    }}
                  >
                    {option.facilityType}
                  </Box>
                ) : null}
              </Box>
            </Box>
          );
        }}
        renderInput={(params) => (
          <MuiTextField
            {...params}
            placeholder={placeholder}
            fullWidth
            inputRef={inputRef}
            onFocus={handleInputFocus}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <SearchIcon sx={{ fontSize: 18, color: 'text.secondary', ml: 0.5, mr: -0.5 }} />
              ),
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={18} /> : null}
                  {hasSelection && !loading ? (
                    <IconButton
                      size="small"
                      onClick={handleClear}
                      aria-label="Clear selection"
                      sx={{ p: 0.25 }}
                    >
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </Box>
  );
};

export default AddressTypeahead;
