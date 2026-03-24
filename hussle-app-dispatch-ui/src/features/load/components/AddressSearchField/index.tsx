import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PaperProps } from '@mui/material';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Link,
  Paper,
  TextField as MuiTextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import WarehouseOutlined from '@mui/icons-material/WarehouseOutlined';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import type { FormikProps } from 'formik';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';
import { searchAddresses } from 'utils/api/places/placeApi';
import type { AddressSearchResult } from 'features/place/types';
import type { LoadFormValues } from '../../validators/loadSchema';
import { SaveAsPlacePrompt } from '../SaveAsPlacePrompt';

const DEBOUNCE_MS = 300;

interface AddressSearchFieldProps {
  prefix: string;
  formik: FormikProps<LoadFormValues>;
  disabled?: boolean;
}

interface AddressOption {
  value: string;
  label: string;
  description: string;
  group: string;
  source: 'SAVED' | 'EXTERNAL';
  facilityType: string | null;
}

const GROUP_SAVED = 'SAVED PLACES';
const GROUP_EXTERNAL = 'ADDRESS RESULTS';

const mapResultsToOptions = (results: AddressSearchResult[]): AddressOption[] =>
  results.map((result) => ({
    value: result.id,
    label: result.name,
    description: [result.address, result.city, result.state].filter(Boolean).join(', '),
    group: result.source === 'SAVED' ? GROUP_SAVED : GROUP_EXTERNAL,
    source: result.source,
    facilityType: result.facilityType,
  }));

export const AddressSearchField: React.FC<AddressSearchFieldProps> = ({
  prefix,
  formik,
  disabled = false,
}) => {
  const stop = formik.values.stops[Number(prefix.replace(/^stops\[(\d+)\]$/, '$1'))];
  const hasSelection = Boolean(stop?.facilityName || stop?.placeId);

  const [isSearching, setIsSearching] = useState(!hasSelection);
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [externalSelection, setExternalSelection] = useState<AddressSearchResult | null>(null);
  const requestIdRef = useRef(0);
  const inputValueRef = useRef('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { openDrawer } = useDrawerActions();

  // Sync isSearching when external form values change (e.g. editing existing load)
  useEffect(() => {
    const selected = Boolean(stop?.facilityName || stop?.placeId);
    if (selected && isSearching) {
      setIsSearching(false);
    }
  }, [stop?.facilityName, stop?.placeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    if (inputValue.length < 1) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      const currentRequestId = requestIdRef.current + 1;
      requestIdRef.current = currentRequestId;
      setLoading(true);

      void searchAddresses(inputValue, 10)
        .then((response) => {
          if (requestIdRef.current !== currentRequestId) {
            return;
          }
          setResults(response);
        })
        .catch(() => {
          if (requestIdRef.current !== currentRequestId) {
            return;
          }
          setResults([]);
        })
        .finally(() => {
          if (requestIdRef.current === currentRequestId) {
            setLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const options = useMemo(() => mapResultsToOptions(results), [results]);

  const handleOptionSelect = useCallback(
    (_event: React.SyntheticEvent, option: AddressOption | null) => {
      setExternalSelection(null);

      if (option === null) {
        return;
      }

      const selected = results.find((r) => r.id === option.value);
      if (selected === undefined) {
        return;
      }

      if (selected.source === 'SAVED') {
        void formik.setFieldValue(`${prefix}.placeId`, selected.id);
        void formik.setFieldValue(`${prefix}.facilityName`, selected.name);
        void formik.setFieldValue(`${prefix}.address`, selected.address);
        void formik.setFieldValue(`${prefix}.city`, selected.city);
        void formik.setFieldValue(`${prefix}.state`, selected.state);
        void formik.setFieldValue(`${prefix}.zip`, selected.zip);
        void formik.setFieldValue(`${prefix}.lat`, selected.lat);
        void formik.setFieldValue(`${prefix}.lng`, selected.lng);
        void formik.setFieldValue(`${prefix}.contactName`, selected.contactName ?? '');
        void formik.setFieldValue(`${prefix}.contactPhone`, selected.contactPhone ?? '');
        if (selected.appointmentRequired) {
          void formik.setFieldValue(`${prefix}.appointmentRequired`, true);
        }
        if (selected.lumperRequired) {
          void formik.setFieldValue(`${prefix}.lumperRequired`, true);
        }
        if (selected.ppeRequired) {
          void formik.setFieldValue(`${prefix}.ppeRequired`, true);
        }
      } else {
        void formik.setFieldValue(`${prefix}.placeId`, '');
        void formik.setFieldValue(`${prefix}.facilityName`, selected.name);
        void formik.setFieldValue(`${prefix}.address`, selected.address);
        void formik.setFieldValue(`${prefix}.city`, selected.city);
        void formik.setFieldValue(`${prefix}.state`, selected.state);
        void formik.setFieldValue(`${prefix}.zip`, selected.zip);
        void formik.setFieldValue(`${prefix}.lat`, selected.lat);
        void formik.setFieldValue(`${prefix}.lng`, selected.lng);
        setExternalSelection(selected);
      }

      setInputValue('');
      setResults([]);
      setIsSearching(false);
    },
    [formik, prefix, results],
  );

  const handleClearSelection = useCallback(() => {
    void formik.setFieldValue(`${prefix}.placeId`, '');
    void formik.setFieldValue(`${prefix}.facilityName`, '');
    void formik.setFieldValue(`${prefix}.address`, '');
    void formik.setFieldValue(`${prefix}.city`, '');
    void formik.setFieldValue(`${prefix}.state`, '');
    void formik.setFieldValue(`${prefix}.zip`, '');
    void formik.setFieldValue(`${prefix}.lat`, null);
    void formik.setFieldValue(`${prefix}.lng`, null);
    void formik.setFieldValue(`${prefix}.contactName`, '');
    void formik.setFieldValue(`${prefix}.contactPhone`, '');
    setExternalSelection(null);
    setIsSearching(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [formik, prefix]);

  const handleInputChange = useCallback(
    (_event: React.SyntheticEvent, value: string, reason: string) => {
      if (reason === 'input') {
        setInputValue(value);
        inputValueRef.current = value;
      }
    },
    [],
  );

  const handleAddPlaceClick = useCallback(() => {
    openDrawer('placeCreate', {
      initialName: inputValueRef.current,
      onClose: () => undefined,
    });
  }, [openDrawer]);

  const handlePlaceSaved = useCallback(
    (placeId: string) => {
      void formik.setFieldValue(`${prefix}.placeId`, placeId);
      setExternalSelection(null);
    },
    [formik, prefix],
  );

  const handleDismissPrompt = useCallback(() => {
    setExternalSelection(null);
  }, []);

  const ActionPaper = useMemo(
    () =>
      function AddressActionPaper(paperProps: PaperProps) {
        const { children, ...rest } = paperProps;
        return (
          <Paper {...rest}>
            {children}
            <Divider />
            <Box sx={{ p: 1 }}>
              <Button
                fullWidth
                onClick={handleAddPlaceClick}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                size="small"
                variant="text"
              >
                Add New Place
              </Button>
            </Box>
          </Paper>
        );
      },
    [handleAddPlaceClick],
  );

  // ── Selected mode ──────────────────────────────────────────────────────────
  if (!isSearching && stop) {
    const addressDisplay = [stop.address, stop.city, stop.state]
      .filter(Boolean)
      .join(', ');
    const cityStateZip = [stop.city, stop.state].filter(Boolean).join(', ')
      + (stop.zip ? ` ${stop.zip}` : '');

    return (
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600, textTransform: 'uppercase', mb: 0.5, display: 'block' }}
        >
          Facility / Address
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Chip
            icon={<PlaceOutlined sx={{ fontSize: 16 }} />}
            label={addressDisplay || stop.facilityName || 'Selected location'}
            color="primary"
            variant="filled"
            size="small"
            sx={{ maxWidth: '100%' }}
          />
        </Box>

        <Link
          component="button"
          variant="caption"
          onClick={handleClearSelection}
          sx={{ mb: 1.5, display: 'inline-block' }}
          underline="hover"
        >
          Change place
        </Link>

        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 0.25 }}
            >
              Address
            </Typography>
            <Typography variant="body2">{stop.address || '\u2014'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 0.25 }}
            >
              City / State / Zip
            </Typography>
            <Typography variant="body2">{cityStateZip || '\u2014'}</Typography>
          </Grid>
        </Grid>

        {externalSelection !== null && (
          <SaveAsPlacePrompt
            name={externalSelection.name}
            address={externalSelection.address}
            city={externalSelection.city}
            state={externalSelection.state}
            zip={externalSelection.zip}
            lat={externalSelection.lat}
            lng={externalSelection.lng}
            onSave={handlePlaceSaved}
            onDismiss={handleDismissPrompt}
          />
        )}
      </Box>
    );
  }

  // ── Search mode ────────────────────────────────────────────────────────────
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, textTransform: 'uppercase', mb: 0.5, display: 'block' }}
      >
        Facility / Address
      </Typography>

      <Autocomplete<AddressOption, false, false, false>
        disabled={disabled}
        options={options}
        value={null}
        inputValue={inputValue}
        loading={loading}
        noOptionsText={inputValue.length < 1 ? 'Type to search' : 'No results found'}
        groupBy={(option) => option.group}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        onInputChange={handleInputChange}
        onChange={handleOptionSelect}
        filterOptions={(x) => x}
        PaperComponent={ActionPaper}
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
            <Box component="li" {...props} key={option.value}>
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
                <Chip
                  label={isSaved ? 'SAVED' : 'RESULT'}
                  size="small"
                  color={isSaved ? 'success' : 'primary'}
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.625rem', flexShrink: 0 }}
                />
                {option.facilityType ? (
                  <Chip
                    label={option.facilityType}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.625rem', flexShrink: 0 }}
                  />
                ) : null}
              </Box>
            </Box>
          );
        }}
        renderInput={(params) => (
          <MuiTextField
            {...params}
            placeholder="Search saved places or type an address"
            fullWidth
            inputRef={inputRef}
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
    </Box>
  );
};

export default AddressSearchField;
