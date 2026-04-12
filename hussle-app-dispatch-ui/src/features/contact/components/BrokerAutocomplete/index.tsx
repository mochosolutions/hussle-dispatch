import { useCallback, useRef } from 'react';
import { Box, InputAdornment, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import type { FormikFieldProps } from '@mocho/ui/forms';
import type { Contact } from 'features/carrier/types';
import { EntityAutocomplete } from 'components/EntityAutocomplete';
import type { EntityAutocompleteOption } from 'components/EntityAutocomplete';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';
import { getContacts } from 'utils/api/fleet/contactApi';

interface BrokerAutocompleteProps {
  name?: string;
  label?: string;
  formik: FormikFieldProps;
  scopeParams?: Record<string, string>;
  onSelectContact?: (contact: Contact | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  createNewLabel?: string;
  onCreateNew?: () => void;
  renderInlineCreate?: (props: {
    onCreated: (id: string) => void;
    onCancel: () => void;
  }) => React.ReactNode;
}

const renderContactOption = (option: EntityAutocompleteOption) => (
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
);

export const BrokerAutocomplete: React.FC<BrokerAutocompleteProps> = ({
  name = 'contactId',
  label = 'Contact',
  formik,
  scopeParams,
  onSelectContact,
  placeholder = 'Search contacts by name',
  disabled,
  required,
  helperText,
  createNewLabel = 'Add New Contact',
  onCreateNew,
  renderInlineCreate,
}) => {
  const contactsRef = useRef<Contact[]>([]);
  const { openDrawer } = useDrawerActions();

  const fetchContactOptions = useCallback(
    async (search: string, scope?: Record<string, string>): Promise<EntityAutocompleteOption[]> => {
      const response = await getContacts({
        limit: 20,
        search: search || undefined,
        customerId: scope?.customerId,
      });
      contactsRef.current = response.data;

      return response.data.map((contact) => {
        const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim();
        const hasName = fullName.length > 0;
        const contactLabel = hasName
          ? fullName
          : (contact.email || contact.phone || '(Unnamed Contact)');
        const descriptionParts: string[] = [];

        if (hasName && contact.email) {
          descriptionParts.push(contact.email);
        }
        if (contact.role) {
          descriptionParts.push(contact.role);
        }

        return {
          value: contact.id,
          label: contactLabel,
          description: descriptionParts.length > 0 ? descriptionParts.join(' · ') : undefined,
          metadata: { role: contact.role ?? '' },
        };
      });
    },
    [],
  );

  const handleSelect = useCallback(
    (option: EntityAutocompleteOption | null) => {
      if (!onSelectContact) {
        return;
      }
      if (!option) {
        onSelectContact(null);
        return;
      }
      const contact = contactsRef.current.find((c) => c.id === option.value) ?? null;
      onSelectContact(contact);
    },
    [onSelectContact],
  );

  const defaultOnCreateNew = useCallback(() => {
    openDrawer('contactCreate', {});
  }, [openDrawer]);

  const resolvedOnCreateNew = onCreateNew ?? (renderInlineCreate ? undefined : defaultOnCreateNew);

  return (
    <EntityAutocomplete
      name={name}
      label={label}
      formik={formik}
      fetchOptions={fetchContactOptions}
      scopeParams={scopeParams}
      renderOptionContent={renderContactOption}
      noOptionsText="No contacts found"
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      helperText={helperText}
      createNewLabel={createNewLabel}
      onCreateNew={resolvedOnCreateNew}
      renderInlineCreate={renderInlineCreate}
      onSelect={handleSelect}
      startAdornment={
        <InputAdornment position="start">
          <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        </InputAdornment>
      }
    />
  );
};

export default BrokerAutocomplete;
