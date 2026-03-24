import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, InputAdornment, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import type { Contact } from 'features/carrier/types';
import type { FormikFieldProps, TypeaheadOption } from '@mocho/ui/forms';
import { TypeaheadField } from '@mocho/ui/components';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';
import { getContacts } from 'utils/api/fleet/contactApi';

const DEBOUNCE_MS = 300;

interface BrokerAutocompleteProps {
  value: string;
  onChange: (contactId: string) => void;
  onBlur?: () => void;
  onSelectContact?: (contact: Contact | null) => void;
  name?: string;
  label?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
}

const formatContactName = (contact: Contact): string => {
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim();
  if (name) {
    return name;
  }
  return contact.email ?? contact.phone ?? '(Unnamed Contact)';
};

const mapContactsToOptions = (contacts: Contact[]): TypeaheadOption[] =>
  contacts.map((contact) => {
    const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim();
    const hasName = fullName.length > 0;
    const label = hasName ? fullName : (contact.email ?? contact.phone ?? '(Unnamed Contact)');
    const descriptionParts: string[] = [];

    if (hasName && contact.email) {
      descriptionParts.push(contact.email);
    }

    if (contact.role) {
      descriptionParts.push(contact.role);
    }

    return {
      value: contact.id,
      label,
      description: descriptionParts.length > 0
        ? descriptionParts.join(' \u00B7 ')
        : undefined,
    };
  });

export const BrokerAutocomplete: React.FC<BrokerAutocompleteProps> = ({
  value,
  onChange,
  onBlur,
  onSelectContact,
  name = 'contactId',
  label = 'Contact',
  error = false,
  helperText,
  disabled = false,
  placeholder = 'Search contacts by name',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const requestIdRef = useRef(0);

  const { openDrawer } = useDrawerActions();
  const inputValueRef = useRef('');

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentRequestId = requestIdRef.current + 1;
      requestIdRef.current = currentRequestId;
      setLoading(true);

      void getContacts({
        limit: 20,
        search: inputValue || undefined,
      })
        .then((response) => {
          if (requestIdRef.current !== currentRequestId) {
            return;
          }

          setContacts(response.data);
        })
        .catch(() => {
          if (requestIdRef.current !== currentRequestId) {
            return;
          }

          setContacts([]);
        })
        .finally(() => {
          if (requestIdRef.current === currentRequestId) {
            setLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [inputValue, refreshTrigger]);

  const options = useMemo(() => mapContactsToOptions(contacts), [contacts]);

  const typeaheadFormik: FormikFieldProps<Record<string, unknown>> = useMemo(
    () => ({
      values: { [name]: value },
      errors: error && helperText ? { [name]: helperText } : {},
      touched: error ? { [name]: true } : {},
      handleChange: () => undefined,
      handleBlur: () => {
        onBlur?.();
      },
      setFieldValue: (_field: string, nextValue: unknown) => {
        onChange(typeof nextValue === 'string' ? nextValue : '');
      },
    }),
    [name, value, error, helperText, onBlur, onChange],
  );

  const handleOptionSelect = useCallback(
    (option: TypeaheadOption | null) => {
      if (!onSelectContact) {
        return;
      }

      if (!option) {
        onSelectContact(null);
        return;
      }

      const contact = contacts.find((c) => c.id === option.value) ?? null;
      onSelectContact(contact);
    },
    [contacts, onSelectContact],
  );

  const handleInputValueChange = useCallback((nextValue: string) => {
    setInputValue(nextValue);
    inputValueRef.current = nextValue;
  }, []);

  const handleAddContactClick = useCallback(() => {
    openDrawer('contactCreate', {
      onClose: () => {
        setRefreshTrigger((prev) => prev + 1);
      },
    });
  }, [openDrawer]);

  const renderContactOption = useCallback(
    (option: TypeaheadOption) => (
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {option.label}
        </Typography>
        {option.description ? (
          <Typography variant="caption" color="text.secondary">
            {option.description}
          </Typography>
        ) : null}
      </Box>
    ),
    [],
  );

  return (
    <TypeaheadField
      name={name}
      label={label}
      options={options}
      formik={typeaheadFormik}
      placeholder={placeholder}
      disabled={disabled}
      loading={loading}
      noOptionsText="No contacts found"
      actionButtonLabel="Add New Contact"
      onActionButtonClick={handleAddContactClick}
      onInputValueChange={handleInputValueChange}
      onOptionSelect={handleOptionSelect}
      renderOptionContent={renderContactOption}
      startAdornment={
        <InputAdornment position="start">
          <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        </InputAdornment>
      }
    />
  );
};

export default BrokerAutocomplete;
