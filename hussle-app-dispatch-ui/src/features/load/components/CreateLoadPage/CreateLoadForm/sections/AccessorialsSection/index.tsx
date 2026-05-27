import { useCallback, useMemo } from 'react';
import { Alert, Box, Button, IconButton, Stack } from '@mui/material';

import { MetaStrong } from 'components/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { FormikProps } from 'formik';
import { CurrencyField, SelectField } from '@mocho/ui/components';
import type { FormikFieldProps } from '@mocho/ui/forms';
import { useSelector } from 'store';
import { selectCarrierById } from 'features/carrier/store/selectors/carrierSelectors';
import SectionCard from 'components/SectionCard';
import type { LoadFormValues } from '../../../../../validators/loadSchema';
import { ACCESSORIAL_TYPE_OPTIONS, formatCurrencyCompact } from '../../../../../constants';

interface AccessorialsSectionProps {
  formik: FormikProps<LoadFormValues>;
  carrierId?: string;
}

const APPLIES_TO_OPTIONS = [
  { label: 'Carrier', value: 'carrier' },
  { label: 'Customer', value: 'customer' },
  { label: 'Both', value: 'both' },
];

export const AccessorialsSection: React.FC<AccessorialsSectionProps> = ({ formik, carrierId }) => {
  const { values } = formik;

  const selectedCarrier = useSelector(carrierId ? selectCarrierById(carrierId) : () => undefined);
  const feeIncludesAccessorials = selectedCarrier?.feeIncludesAccessorials === true;

  const accessorials = useMemo(() => values.accessorials ?? [], [values.accessorials]);

  const accessorialTotal = useMemo(
    () => accessorials.reduce((sum, a) => sum + (Number(a.amount) || 0), 0),
    [accessorials],
  );

  const formikProps: FormikFieldProps<Record<string, unknown>> = {
    values: formik.values as unknown as Record<string, unknown>,
    errors: formik.errors as unknown as FormikFieldProps<Record<string, unknown>>['errors'],
    touched: formik.touched as unknown as FormikFieldProps<Record<string, unknown>>['touched'],
    handleChange: formik.handleChange,
    handleBlur: formik.handleBlur,
    setFieldValue: formik.setFieldValue,
  };

  const handleAddAccessorial = useCallback(
    (type: string, label: string, defaultApplies: string) => {
      const current = values.accessorials ?? [];
      void formik.setFieldValue('accessorials', [
        ...current,
        { type, label, amount: 0, applies: defaultApplies },
      ]);
    },
    [formik, values.accessorials],
  );

  const handleRemoveAccessorial = useCallback(
    (idx: number) => {
      const current = values.accessorials ?? [];
      void formik.setFieldValue(
        'accessorials',
        current.filter((_, i) => i !== idx),
      );
    },
    [formik, values.accessorials],
  );

  return (
    <SectionCard
      title="Accessorials"
      subheader="Add extra charges like fuel surcharge, detention, or lumper fees"
      actions={
        <MetaStrong sx={{ fontWeight: 700, color: 'text.primary' }}>
          {formatCurrencyCompact(accessorialTotal)}
        </MetaStrong>
      }
    >
      <Stack spacing={1.5}>
        {feeIncludesAccessorials && (
          <Alert severity="info" sx={{ py: 0.5, fontSize: 12 }}>
            Carrier fee includes accessorials
          </Alert>
        )}

        {accessorials.map((acc, idx) => (
          <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Box sx={{ flex: 3 }}>
              <MetaStrong sx={{ color: 'text.primary' }}>
                {acc.label || acc.type}
              </MetaStrong>
            </Box>
            <Box sx={{ flex: 3 }}>
              <CurrencyField
                name={`accessorials[${idx}].amount`}
                label="Amount"
                formik={formikProps}
              />
            </Box>
            <Box sx={{ flex: 3 }}>
              <SelectField
                name={`accessorials[${idx}].applies`}
                label="Applies to"
                data={APPLIES_TO_OPTIONS}
                formik={formikProps}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <IconButton
                size="small"
                onClick={() => handleRemoveAccessorial(idx)}
                aria-label={`Remove ${acc.label || acc.type}`}
              >
                <DeleteOutlineIcon fontSize="small" color="error" />
              </IconButton>
            </Box>
          </Box>
        ))}

        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {ACCESSORIAL_TYPE_OPTIONS.map((opt) => (
            <Button
              key={opt.key}
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => handleAddAccessorial(opt.key, opt.label, opt.defaultApplies)}
              sx={{ textTransform: 'none', fontSize: 12 }}
            >
              {opt.label}
            </Button>
          ))}
        </Stack>
      </Stack>
    </SectionCard>
  );
};
