import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import type { PaperProps } from '@mui/material';
import type { CarrierListItem } from 'features/carrier/types';
import { BaseFieldWrapper } from 'mocho/components/form-fields/BaseFieldWrapper';
import { getCarriers } from 'utils/api/fleet/carrierApi';

const DEBOUNCE_MS = 300;

interface CarrierAutocompleteProps {
  value: string;
  onChange: (carrierId: string) => void;
  onBlur?: () => void;
  name?: string;
  label?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
  actionButtonLabel?: string;
  onActionButtonClick?: () => void;
}

const getCarrierLabel = (carrier: CarrierListItem): string => carrier.name;

export const CarrierAutocomplete: React.FC<CarrierAutocompleteProps> = ({
  value,
  onChange,
  onBlur,
  name = 'carrierId',
  label = 'Carrier',
  error = false,
  helperText,
  disabled = false,
  placeholder = 'Search carrier by name',
  actionButtonLabel,
  onActionButtonClick,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<CarrierListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  const selectedCarrier = useMemo(
    () => options.find((carrier) => carrier.id === value) ?? null,
    [options, value],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentRequestId = requestIdRef.current + 1;
      requestIdRef.current = currentRequestId;
      setLoading(true);

      void getCarriers({ limit: 20, search: inputValue || undefined })
        .then((response) => {
          if (requestIdRef.current !== currentRequestId) {
            return;
          }

          setOptions(response.data);
        })
        .catch(() => {
          if (requestIdRef.current !== currentRequestId) {
            return;
          }

          setOptions([]);
        })
        .finally(() => {
          if (requestIdRef.current === currentRequestId) {
            setLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const hasActionButton = Boolean(actionButtonLabel && onActionButtonClick);

  const ActionPaper: React.FC<PaperProps> = (paperProps) => {
    const { children, ...rest } = paperProps;

    return (
      <Paper {...rest}>
        {children}
        {hasActionButton ? (
          <>
            <Divider />
            <Box sx={{ p: 1 }}>
              <Button
                fullWidth
                size="small"
                variant="text"
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={onActionButtonClick}
              >
                {actionButtonLabel}
              </Button>
            </Box>
          </>
        ) : null}
      </Paper>
    );
  };

  return (
    <BaseFieldWrapper
      name={name}
      label={label}
      error={error ? helperText : undefined}
      touched={error}
      helperText={!error ? helperText : undefined}
    >
      <Autocomplete<CarrierListItem, false, false, false>
        value={selectedCarrier}
        options={options}
        loading={loading}
        disabled={disabled}
        PaperComponent={ActionPaper}
        onChange={(_event, nextCarrier) => {
          onChange(nextCarrier?.id ?? '');
        }}
        inputValue={inputValue}
        onInputChange={(_event, nextInputValue) => {
          setInputValue(nextInputValue);
        }}
        getOptionLabel={getCarrierLabel}
        isOptionEqualToValue={(option, selected) => option.id === selected.id}
        noOptionsText="No carriers found"
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.id}>
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {option.name}
                </Typography>
                <Chip
                  label={option.type.replace(/_/g, ' ')}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.625rem' }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {option.driverCount} drivers · {option.vehicleCount} vehicles
              </Typography>
            </Box>
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            id={name}
            placeholder={placeholder}
            fullWidth
            size="small"
            error={error}
            onBlur={onBlur}
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
      />
    </BaseFieldWrapper>
  );
};

export default CarrierAutocomplete;
