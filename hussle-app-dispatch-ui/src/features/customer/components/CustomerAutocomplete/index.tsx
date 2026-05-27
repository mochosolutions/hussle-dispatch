import { useCallback, useState } from 'react';
import { Box } from '@mui/material';
import type { FormikFieldProps } from '@mocho/ui/forms';
import {
  EntityAutocomplete,
} from 'components/EntityAutocomplete';
import type { EntityAutocompleteOption } from 'components/EntityAutocomplete';
import { Meta, MetaStrong } from 'components/Typography';
import { StatusBadge } from '../../../../components/Statusbadge';
import { getCustomers } from 'utils/api/fleet/customerApi';
import { CUSTOMER_TYPE_LABELS } from '../../constants';
import { CustomerInfoDrawer } from '../CustomerInfoDrawer';
import type { Customer } from '../../types';

interface CustomerAutocompleteProps {
  name?: string;
  label?: string;
  formik: FormikFieldProps;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
}

const formatCustomerLocation = (customer: Customer): string =>
  [customer.city, customer.state].filter(Boolean).join(', ');

const fetchCustomerOptions = async (search: string): Promise<EntityAutocompleteOption[]> => {
  const response = await getCustomers({ limit: 20, search: search || undefined });
  return response.data.map((customer) => ({
    value: customer.id,
    label: customer.companyName,
    description: formatCustomerLocation(customer),
    metadata: {
      type: customer.type,
      city: customer.city,
      state: customer.state,
    },
  }));
};

const isCustomerType = (value: unknown): value is keyof typeof CUSTOMER_TYPE_LABELS =>
  typeof value === 'string' && value in CUSTOMER_TYPE_LABELS;

const renderCustomerOption = (option: EntityAutocompleteOption): React.ReactNode => {
  const customerType = option.metadata?.type;
  const typeLabel = isCustomerType(customerType) ? CUSTOMER_TYPE_LABELS[customerType] : undefined;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MetaStrong>{option.label}</MetaStrong>
        {typeLabel ? <StatusBadge status={typeLabel} /> : null}
      </Box>
      {option.description ? <Meta>{option.description}</Meta> : null}
    </Box>
  );
};

export const CustomerAutocomplete: React.FC<CustomerAutocompleteProps> = ({
  name = 'customerId',
  label = 'Customer',
  formik,
  placeholder = 'Search customer by company name',
  disabled = false,
  required = false,
  helperText,
}) => {
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const handleCreateNew = useCallback(() => {
    setCreateDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setCreateDrawerOpen(false);
  }, []);

  const handleCreated = useCallback(
    (newId: string) => {
      formik.setFieldValue(name, newId);
      setCreateDrawerOpen(false);
    },
    [formik, name],
  );

  return (
    <>
      <EntityAutocomplete
        name={name}
        label={label}
        formik={formik}
        fetchOptions={fetchCustomerOptions}
        renderOptionContent={renderCustomerOption}
        createNewLabel="Add New Customer"
        onCreateNew={handleCreateNew}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        helperText={helperText}
        noOptionsText="No customers found"
      />

      {createDrawerOpen ? (
        <CustomerInfoDrawer
          onClose={handleDrawerClose}
          onCreated={handleCreated}
        />
      ) : null}
    </>
  );
};

export default CustomerAutocomplete;
