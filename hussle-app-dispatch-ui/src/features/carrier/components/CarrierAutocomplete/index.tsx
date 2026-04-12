import { Box, Chip, Typography } from '@mui/material';
import { EntityAutocomplete } from 'components/EntityAutocomplete';
import type { EntityAutocompleteOption } from 'components/EntityAutocomplete';
import type { FormikFieldProps } from '@mocho/ui/forms';
import { getCarriers } from 'utils/api/fleet/carrierApi';

interface CarrierAutocompleteProps {
  name?: string;
  label?: string;
  formik: FormikFieldProps;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  createNewLabel?: string;
  onCreateNew?: () => void;
}

const fetchCarrierOptions = async (search: string): Promise<EntityAutocompleteOption[]> => {
  const response = await getCarriers({ limit: 20, search: search || undefined });
  return response.data.map((carrier) => ({
    value: carrier.id,
    label: carrier.name,
    description: `${carrier.driverCount} drivers · ${carrier.vehicleCount} vehicles`,
    metadata: {
      type: carrier.type.replace(/_/g, ' '),
      companyMarginPercent: carrier.companyMarginPercent,
      feeIncludesAccessorials: carrier.feeIncludesAccessorials,
    },
  }));
};

const renderCarrierOption = (option: EntityAutocompleteOption) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {option.label}
      </Typography>
      {option.metadata?.type && (
        <Chip
          label={String(option.metadata.type)}
          size="small"
          variant="outlined"
          sx={{ height: 20, fontSize: '0.625rem' }}
        />
      )}
    </Box>
    {option.description && (
      <Typography variant="caption" color="text.secondary">
        {option.description}
      </Typography>
    )}
  </Box>
);

export const CarrierAutocomplete: React.FC<CarrierAutocompleteProps> = ({
  name = 'carrierId',
  label = 'Carrier',
  formik,
  placeholder = 'Search carrier by name',
  disabled,
  required,
  helperText,
  createNewLabel,
  onCreateNew,
}) => (
  <EntityAutocomplete
    name={name}
    label={label}
    formik={formik}
    fetchOptions={fetchCarrierOptions}
    renderOptionContent={renderCarrierOption}
    noOptionsText="No carriers found"
    placeholder={placeholder}
    disabled={disabled}
    required={required}
    helperText={helperText}
    createNewLabel={createNewLabel}
    onCreateNew={onCreateNew}
  />
);

export default CarrierAutocomplete;
