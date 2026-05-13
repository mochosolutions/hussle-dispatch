import { Button, Stack } from '@mui/material';
import { BaseFieldWrapper } from 'mocho/components/form-fields/BaseFieldWrapper';
import type { FormikFieldProps } from 'mocho/components/form-fields/types';

interface YesNoFieldProps {
  name: string;
  label: string;
  required?: boolean;
  helperText?: string;
  yesLabel?: string;
  noLabel?: string;
  formik: FormikFieldProps<Record<string, unknown>>;
}

const YesNoField: React.FC<YesNoFieldProps> = ({
  name,
  label,
  required = false,
  helperText,
  yesLabel = 'Yes',
  noLabel = 'No',
  formik,
}) => {
  const rawValue = formik.values[name];
  const currentValue = typeof rawValue === 'boolean' ? rawValue : null;
  const errorRaw = formik.errors[name];
  const error = typeof errorRaw === 'string' ? errorRaw : undefined;
  const touched = Boolean(formik.touched[name]);

  const handleSelect = (value: boolean) => {
    formik.setFieldValue(name, value);
  };

  return (
    <BaseFieldWrapper
      name={name}
      label={label}
      required={required}
      error={error}
      touched={touched}
      helperText={helperText}
    >
      <Stack direction="row" spacing={1.5}>
        <Button
          variant={currentValue === true ? 'contained' : 'outlined'}
          color="primary"
          onClick={() => handleSelect(true)}
          sx={{ flex: 1 }}
        >
          {yesLabel}
        </Button>
        <Button
          variant={currentValue === false ? 'contained' : 'outlined'}
          color="primary"
          onClick={() => handleSelect(false)}
          sx={{ flex: 1 }}
        >
          {noLabel}
        </Button>
      </Stack>
    </BaseFieldWrapper>
  );
};

export default YesNoField;
