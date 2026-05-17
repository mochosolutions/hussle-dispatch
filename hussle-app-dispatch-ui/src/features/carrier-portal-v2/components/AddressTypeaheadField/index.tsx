import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PaperProps } from '@mui/material';
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  InputLabel,
  Link,
  OutlinedInput,
  Paper,
  Stack,
  TextField as MuiTextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { getIn, useFormikContext } from 'formik';
import { enqueueSnackbar } from 'notistack';
import { searchAddresses } from 'utils/api/places/placeApi';
import type { AddressSearchResult } from 'features/place/types';

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;
const FAILURE_THRESHOLD = 3;

/**
 * AddressTypeaheadField — Formik-aware address typeahead used by the carrier-portal-v2
 * conversational flow.
 *
 * Behavior:
 * - Defaults to AWS-Location-backed typeahead via `searchAddresses`.
 * - Surfaces visible errors with a Retry button (no silent failures).
 * - After 3 consecutive failures OR an explicit "Skip lookup" click, falls back
 *   to manual-entry fields (line1, line2, city, state, zip, country).
 * - Errors are toasted at most once per component lifetime (deduped via ref).
 *
 * Form shape: expects `values[name]` to be an Address object with
 * `{ line1, line2, city, state, zip, country }`.
 */
export interface AddressTypeaheadFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

interface AddressValue {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface AddressOption {
  value: string;
  label: string;
  description: string;
}

const MANUAL_FIELDS: Array<{ key: keyof AddressValue; label: string; placeholder: string }> = [
  { key: 'line1', label: 'Address line 1', placeholder: '123 Main St' },
  { key: 'line2', label: 'Address line 2', placeholder: 'Suite 200 (optional)' },
  { key: 'city', label: 'City', placeholder: 'Atlanta' },
  { key: 'state', label: 'State / Region', placeholder: 'GA' },
  { key: 'zip', label: 'ZIP / Postal code', placeholder: '30301' },
  { key: 'country', label: 'Country', placeholder: 'US' },
];

const formatDisplay = (result: AddressSearchResult): string =>
  [result.address, result.city, result.state, result.zip].filter(Boolean).join(', ');

const mapResultsToOptions = (results: AddressSearchResult[]): AddressOption[] =>
  results.map((result) => ({
    value: result.id,
    label: result.name || result.address || formatDisplay(result),
    description: formatDisplay(result),
  }));

export const AddressTypeaheadField: React.FC<AddressTypeaheadFieldProps> = ({
  name,
  label,
  required = false,
  disabled = false,
}) => {
  const formik = useFormikContext<Record<string, unknown>>();
  const addressValue = (getIn(formik.values, name) as AddressValue | undefined) ?? {};

  const [mode, setMode] = useState<'typeahead' | 'manual'>('typeahead');
  const [inputValue, setInputValue] = useState<string>(() => {
    const parts = [addressValue.line1, addressValue.city, addressValue.state, addressValue.zip]
      .filter(Boolean)
      .join(', ');
    return parts;
  });
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failureCount, setFailureCount] = useState(0);
  const [retryNonce, setRetryNonce] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const snackbarShownRef = useRef(false);

  const setAddressField = useCallback(
    (key: keyof AddressValue, val: string) => {
      const next: AddressValue = { ...addressValue, [key]: val };
      formik.setFieldValue(name, next);
    },
    [addressValue, formik, name],
  );

  const applySearchResult = useCallback(
    (result: AddressSearchResult) => {
      const next: AddressValue = {
        line1: result.address || '',
        line2: addressValue.line2 ?? '',
        city: result.city || '',
        state: result.state || '',
        zip: result.zip || '',
        country: addressValue.country ?? 'US',
      };
      formik.setFieldValue(name, next);
    },
    [addressValue.line2, addressValue.country, formik, name],
  );

  // Debounced search effect — only active in typeahead mode.
  useEffect(() => {
    if (mode !== 'typeahead') {
      return undefined;
    }

    if (inputValue.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setDropdownOpen(false);
      setLoading(false);
      return undefined;
    }

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
          setErrorMessage(null);
          setFailureCount(0);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) {
            return;
          }
          // eslint-disable-next-line no-console
          console.warn('AddressTypeaheadField search failed', error);
          setResults([]);
          setDropdownOpen(false);
          setErrorMessage("We couldn't reach address lookup. Try again or skip to manual entry.");
          setFailureCount((prev) => {
            const nextCount = prev + 1;
            if (nextCount >= FAILURE_THRESHOLD) {
              setMode('manual');
            }
            return nextCount;
          });
          if (!snackbarShownRef.current) {
            snackbarShownRef.current = true;
            enqueueSnackbar('Address lookup is having trouble — you can enter your address manually.', {
              variant: 'warning',
            });
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [inputValue, mode, retryNonce]);

  // Cleanup on unmount.
  useEffect(
    () => () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    },
    [],
  );

  const options = useMemo(() => mapResultsToOptions(results), [results]);

  const handleRetry = useCallback(() => {
    setErrorMessage(null);
    setRetryNonce((n) => n + 1);
  }, []);

  const handleSkipLookup = useCallback(() => {
    setErrorMessage(null);
    setMode('manual');
  }, []);

  const handleUseLookupAgain = useCallback(() => {
    setMode('typeahead');
    setFailureCount(0);
    setErrorMessage(null);
  }, []);

  const handleInputChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string, reason: string) => {
      if (reason === 'input') {
        setInputValue(newValue);
      } else if (reason === 'clear') {
        setInputValue('');
        setResults([]);
        setDropdownOpen(false);
      }
    },
    [],
  );

  const handleOptionSelect = useCallback(
    (_event: React.SyntheticEvent, option: AddressOption | null) => {
      if (option === null) {
        return;
      }
      const selected = results.find((r) => r.id === option.value);
      if (selected === undefined) {
        return;
      }
      setInputValue(formatDisplay(selected));
      setResults([]);
      setDropdownOpen(false);
      applySearchResult(selected);
    },
    [applySearchResult, results],
  );

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

  if (mode === 'manual') {
    return (
      <Stack spacing={1.5}>
        {label ? (
          <InputLabel htmlFor={`${name}.line1`} required={required}>
            {label}
          </InputLabel>
        ) : null}
        <Typography variant="caption" color="text.secondary">
          Enter your address manually.{' '}
          <Link
            component="button"
            type="button"
            onClick={handleUseLookupAgain}
            disabled={disabled}
            sx={{ verticalAlign: 'baseline' }}
          >
            Use lookup again
          </Link>
        </Typography>
        {MANUAL_FIELDS.map((field) => (
          <Stack key={field.key} spacing={0.5}>
            <InputLabel htmlFor={`${name}.${field.key}`}>{field.label}</InputLabel>
            <OutlinedInput
              id={`${name}.${field.key}`}
              name={`${name}.${field.key}`}
              value={addressValue[field.key] ?? ''}
              onChange={(e) => setAddressField(field.key, e.target.value)}
              onBlur={formik.handleBlur}
              placeholder={field.placeholder}
              disabled={disabled}
              fullWidth
            />
          </Stack>
        ))}
      </Stack>
    );
  }

  return (
    <Stack spacing={1}>
      {label ? (
        <InputLabel htmlFor={name} required={required}>
          {label}
        </InputLabel>
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
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, py: 2 }}
          >
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Searching...
            </Typography>
          </Box>
        }
        noOptionsText="No addresses match"
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, val) => option.value === val.value}
        onInputChange={handleInputChange}
        onChange={handleOptionSelect}
        filterOptions={(x) => x}
        PaperComponent={DropdownPaper}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.value}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, width: '100%' }}>
              <PlaceOutlined sx={{ fontSize: 18, color: 'primary.main', mt: 0.25 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {option.label}
                </Typography>
                {option.description ? (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {option.description}
                  </Typography>
                ) : null}
              </Box>
            </Box>
          </Box>
        )}
        renderInput={(params) => (
          <MuiTextField
            {...params}
            placeholder="Start typing your address"
            fullWidth
            inputProps={{
              ...params.inputProps,
              id: name,
              'aria-label': label,
            }}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <SearchIcon sx={{ fontSize: 18, color: 'text.secondary', ml: 0.5, mr: -0.5 }} />
              ),
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />

      {errorMessage ? (
        <Box
          role="alert"
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            p: 1.25,
            borderRadius: 1,
            backgroundColor: 'warning.lighter',
            border: '1px solid',
            borderColor: 'warning.light',
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 18, color: 'warning.dark', mt: 0.25 }} />
          <Stack spacing={0.75} sx={{ flex: 1 }}>
            <Typography variant="body2" color="warning.dark">
              {errorMessage}
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={handleRetry}
                disabled={disabled || loading}
              >
                Retry
              </Button>
              <Button
                size="small"
                variant="text"
                color="warning"
                onClick={handleSkipLookup}
                disabled={disabled}
              >
                Skip lookup
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : (
        <Typography variant="caption" color="text.secondary">
          Can't find your address?{' '}
          <Link
            component="button"
            type="button"
            onClick={handleSkipLookup}
            disabled={disabled}
            sx={{ verticalAlign: 'baseline' }}
          >
            Skip lookup
          </Link>
        </Typography>
      )}
    </Stack>
  );
};

export default AddressTypeaheadField;
