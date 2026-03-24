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
import type { Customer } from '../../types';
import { BaseFieldWrapper } from 'mocho/components/form-fields/BaseFieldWrapper';
import { getCustomers } from 'utils/api/fleet/customerApi';
import { CUSTOMER_TYPE_LABELS } from '../../constants';
import { CustomerInfoDrawer } from '../CustomerInfoDrawer';

const DEBOUNCE_MS = 300;

interface CustomerAutocompleteProps {
  value: string;
  onChange: (customerId: string) => void;
  onBlur?: () => void;
  name?: string;
  label?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
}

const formatCustomerLocation = (customer: Customer): string =>
  [customer.city, customer.state].filter(Boolean).join(', ');

export const CustomerAutocomplete: React.FC<CustomerAutocompleteProps> = ({
  value,
  onChange,
  onBlur,
  name = 'customerId',
  label = 'Customer',
  error = false,
  helperText,
  disabled = false,
  placeholder = 'Search customer by company name',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const requestIdRef = useRef(0);

  const selectedCustomer = useMemo(
    () => options.find((customer) => customer.id === value) ?? null,
    [options, value],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentRequestId = requestIdRef.current + 1;
      requestIdRef.current = currentRequestId;
      setLoading(true);

      void getCustomers({
        limit: 20,
        search: inputValue || undefined,
      })
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
  }, [inputValue, refreshTrigger]);

  const ActionPaper: React.FC<PaperProps> = (paperProps) => {
    const { children, ...rest } = paperProps;

    return (
      <Paper {...rest}>
        {children}
        <Divider />
        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            size="small"
            variant="text"
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => {
              setCreateDrawerOpen(true);
            }}
          >
            Add New Customer
          </Button>
        </Box>
      </Paper>
    );
  };

  return (
    <>
      <BaseFieldWrapper
        name={name}
        label={label}
        error={error ? helperText : undefined}
        touched={error}
        helperText={!error ? helperText : undefined}
      >
        <Autocomplete<Customer, false, false, false>
          value={selectedCustomer}
          options={options}
          loading={loading}
          disabled={disabled}
          PaperComponent={ActionPaper}
          onChange={(_event, nextCustomer) => {
            onChange(nextCustomer?.id ?? '');
          }}
          inputValue={inputValue}
          onInputChange={(_event, nextInputValue) => {
            setInputValue(nextInputValue);
          }}
          getOptionLabel={(customer) => customer.companyName}
          isOptionEqualToValue={(option, selected) => option.id === selected.id}
          noOptionsText="No customers found"
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.id}>
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {option.companyName}
                  </Typography>
                  <Chip
                    label={CUSTOMER_TYPE_LABELS[option.type]}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.625rem' }}
                  />
                </Box>
                {formatCustomerLocation(option) ? (
                  <Typography variant="caption" color="text.secondary">
                    {formatCustomerLocation(option)}
                  </Typography>
                ) : null}
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
              onBlur={onBlur}
              error={error}
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

      {createDrawerOpen ? (
        <CustomerInfoDrawer
          initialCompanyName={inputValue}
          onClose={() => {
            setCreateDrawerOpen(false);
            setRefreshTrigger((prev) => prev + 1);
          }}
        />
      ) : null}
    </>
  );
};

export default CustomerAutocomplete;
