import { useCallback } from 'react';
import { Checkbox, FormControlLabel, OutlinedInput, Stack } from '@mui/material';
import { getIn, useFormikContext } from 'formik';
import { PatternFormat } from 'react-number-format';
import * as Yup from 'yup';
import { BaseFieldWrapper } from 'mocho/components/form-fields/BaseFieldWrapper';

/**
 * TinField — Formik-aware TIN input that accepts both EIN (XX-XXXXXXX) and
 * SSN (XXX-XX-XXXX) formats.
 *
 * The format is controlled by a companion field (`tinType`, defaulting to 'EIN').
 * Users flip an "I'm an individual" checkbox to switch the mask to SSN.
 *
 * Normalization is delegated to react-number-format's `PatternFormat`, which
 * strips non-digits and re-inserts hyphens at the canonical positions for the
 * active mask. The stored Formik value is the formatted string
 * ("12-3456789" or "123-45-6789").
 *
 * Pair the field with `tinYupFragment()` in your Yup schema to validate format.
 */
export type TinType = 'EIN' | 'SSN';

export interface TinFieldProps {
  name: string;
  typeName?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

const EIN_FORMAT = '##-#######';
const SSN_FORMAT = '###-##-####';

/**
 * Yup validator fragment for TIN format. Compose into a schema:
 *
 * Yup.object({
 *   tin: tinYupFragment().required('TIN is required'),
 *   tinType: Yup.mixed<TinType>().oneOf(['EIN', 'SSN']).default('EIN'),
 * })
 */
export const tinYupFragment = () =>
  Yup.string().matches(
    /^(\d{2}-\d{7}|\d{3}-\d{2}-\d{4})$/,
    'TIN must be EIN (XX-XXXXXXX) or SSN (XXX-XX-XXXX) format',
  );

export const TinField: React.FC<TinFieldProps> = ({
  name,
  typeName = 'tinType',
  label = 'Tax ID (TIN)',
  required = false,
  disabled = false,
}) => {
  const formik = useFormikContext<Record<string, unknown>>();

  const error = getIn(formik.errors, name) as string | undefined;
  const touched = getIn(formik.touched, name) as boolean | undefined;
  const value = (getIn(formik.values, name) as string | undefined) ?? '';
  const tinType = (getIn(formik.values, typeName) as TinType | undefined) ?? 'EIN';

  const isIndividual = tinType === 'SSN';
  const format = isIndividual ? SSN_FORMAT : EIN_FORMAT;
  const placeholder = isIndividual ? 'XXX-XX-XXXX' : 'XX-XXXXXXX';

  const handleToggleIndividual = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextType: TinType = event.target.checked ? 'SSN' : 'EIN';
      formik.setFieldValue(typeName, nextType);
      // Reset the value so a half-typed digit string doesn't get re-masked
      // into a half-valid pattern under the new format.
      formik.setFieldValue(name, '');
    },
    [formik, name, typeName],
  );

  return (
    <BaseFieldWrapper
      name={name}
      label={label}
      required={required}
      error={error}
      touched={touched}
    >
      <Stack spacing={1}>
        <PatternFormat
          id={name}
          name={name}
          format={format}
          value={value}
          onValueChange={(values) => {
            formik.setFieldValue(name, values.formattedValue);
          }}
          onBlur={formik.handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          customInput={OutlinedInput}
          fullWidth
          error={Boolean(touched && error)}
        />
        <FormControlLabel
          control={
            <Checkbox
              id={`${name}-individual-toggle`}
              checked={isIndividual}
              onChange={handleToggleIndividual}
              disabled={disabled}
              size="small"
            />
          }
          label="I'm an individual (use SSN)"
        />
      </Stack>
    </BaseFieldWrapper>
  );
};

export default TinField;
