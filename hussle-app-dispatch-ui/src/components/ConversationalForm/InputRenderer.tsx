import {
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControl,
  FormHelperText,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import type { InputType, SelectOption } from './questionSchema';

interface InputRendererProps {
  inputType: InputType;
  value: unknown;
  onChange: (value: unknown) => void;
  options?: SelectOption[];
  label?: string;
  required?: boolean;
  startAdornment?: string;
  endAdornment?: string;
  yesLabel?: string;
  noLabel?: string;
  badgeText?: string;
  error?: string;
  touched?: boolean;
}

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

const asNumber = (value: unknown): number => (typeof value === 'number' ? value : 0);

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];

const TextInput: React.FC<
  Pick<InputRendererProps, 'value' | 'onChange' | 'label' | 'required' | 'startAdornment'>
> = ({ value, onChange, label, required, startAdornment }) => (
  <TextField
    fullWidth
    label={label}
    required={required}
    value={asString(value)}
    onChange={(e) => onChange(e.target.value)}
    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
    InputProps={
      startAdornment
        ? {
            startAdornment: (
              <InputAdornment position="start">
                <Typography variant="body1" color="text.secondary" fontWeight={500}>
                  {startAdornment}
                </Typography>
              </InputAdornment>
            ),
          }
        : undefined
    }
  />
);

const CurrencyInput: React.FC<
  Pick<InputRendererProps, 'value' | 'onChange' | 'label' | 'required' | 'endAdornment'>
> = ({ value, onChange, label, required, endAdornment }) => (
  <TextField
    fullWidth
    label={label}
    required={required}
    type="number"
    value={asNumber(value) === 0 && value === undefined ? '' : asNumber(value)}
    onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <Typography variant="body1" fontWeight={600}>
            $
          </Typography>
        </InputAdornment>
      ),
      endAdornment: endAdornment ? (
        <InputAdornment position="end">
          <Typography variant="body2" color="text.secondary">
            {endAdornment}
          </Typography>
        </InputAdornment>
      ) : undefined,
    }}
  />
);

const NumberInput: React.FC<
  Pick<InputRendererProps, 'value' | 'onChange' | 'label' | 'required' | 'endAdornment'>
> = ({ value, onChange, label, required, endAdornment }) => (
  <TextField
    fullWidth
    label={label}
    required={required}
    type="number"
    value={asNumber(value) === 0 && value === undefined ? '' : asNumber(value)}
    onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
    InputProps={
      endAdornment
        ? {
            endAdornment: (
              <InputAdornment position="end">
                <Typography variant="body2" color="text.secondary">
                  {endAdornment}
                </Typography>
              </InputAdornment>
            ),
          }
        : undefined
    }
  />
);

const SelectInput: React.FC<
  Pick<InputRendererProps, 'value' | 'onChange' | 'label' | 'required' | 'options'>
> = ({ value, onChange, label, required, options = [] }) => {
  const selectId = `select-${label ?? 'input'}`;

  return (
    <FormControl fullWidth required={required}>
      {label ? <InputLabel id={`${selectId}-label`}>{label}</InputLabel> : null}
      <Select
        labelId={label ? `${selectId}-label` : undefined}
        id={selectId}
        value={asString(value)}
        label={label}
        onChange={(e) => onChange(e.target.value)}
        sx={{ borderRadius: '8px' }}
        MenuProps={{ PaperProps: { sx: { borderRadius: '8px' } } }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

const MultiSelectInput: React.FC<
  Pick<InputRendererProps, 'value' | 'onChange' | 'label' | 'required' | 'options'>
> = ({ value, onChange, label, required, options = [] }) => {
  const selectedValues = asStringArray(value);
  const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value));

  return (
    <Autocomplete
      multiple
      fullWidth
      options={options}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, val) => option.value === val.value}
      value={selectedOptions}
      onChange={(_event, newValue) => onChange(newValue.map((opt) => opt.value))}
      renderTags={(tagValues, getTagProps) =>
        tagValues.map((option, index) => {
          const { key, ...chipProps } = getTagProps({ index });
          return (
            <Chip
              key={key}
              label={option.label}
              color="primary"
              sx={{ borderRadius: '20px' }}
              {...chipProps}
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          fullWidth
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
        />
      )}
    />
  );
};

const YesNoInput: React.FC<Pick<InputRendererProps, 'value' | 'onChange' | 'yesLabel' | 'noLabel'>> = ({
  value,
  onChange,
  yesLabel = 'Yes',
  noLabel = 'No',
}) => {
  const currentValue = typeof value === 'boolean' ? value : null;

  return (
    <Stack direction="row" spacing={2}>
      <Button
        variant={currentValue === true ? 'contained' : 'outlined'}
        color={currentValue === true ? 'primary' : undefined}
        onClick={() => onChange(true)}
        sx={{
          py: 1.5,
          px: 4,
          borderRadius: 24,
          minWidth: 120,
          flex: 1,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '15px',
          ...(currentValue !== true && { borderColor: 'grey.300', color: 'text.primary' }),
        }}
      >
        {yesLabel}
      </Button>
      <Button
        variant={currentValue === false ? 'contained' : 'outlined'}
        color={currentValue === false ? 'primary' : undefined}
        onClick={() => onChange(false)}
        sx={{
          py: 1.5,
          px: 4,
          borderRadius: 24,
          minWidth: 120,
          flex: 1,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '15px',
          ...(currentValue !== false && { borderColor: 'grey.300', color: 'text.primary' }),
        }}
      >
        {noLabel}
      </Button>
    </Stack>
  );
};

const SliderInput: React.FC<Pick<InputRendererProps, 'value' | 'onChange'>> = ({
  value,
  onChange,
}) => (
  <Box sx={{ width: '100%', px: 1 }}>
    <Slider
      value={asNumber(value)}
      onChange={(_event, newValue) => onChange(newValue)}
      valueLabelDisplay="auto"
      sx={{
        '& .MuiSlider-thumb': { width: 20, height: 20 },
        '& .MuiSlider-track': { height: 6 },
        '& .MuiSlider-rail': { height: 6 },
      }}
    />
  </Box>
);

const TagInput: React.FC<
  Pick<InputRendererProps, 'value' | 'onChange' | 'label' | 'required'>
> = ({ value, onChange, label, required }) => (
  <Autocomplete
    multiple
    freeSolo
    fullWidth
    options={[]}
    value={asStringArray(value)}
    onChange={(_event, newValue) => onChange(newValue)}
    renderTags={(tagValues, getTagProps) =>
      tagValues.map((option, index) => {
        const { key, ...chipProps } = getTagProps({ index });
        return <Chip key={key} label={option} size="medium" sx={{ borderRadius: '16px' }} {...chipProps} />;
      })
    }
    renderInput={(params) => (
      <TextField
        {...params}
        label={label}
        required={required}
        fullWidth
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
      />
    )}
  />
);

export const InputRenderer: React.FC<InputRendererProps> = ({
  inputType,
  value,
  onChange,
  options,
  label,
  required,
  startAdornment,
  endAdornment,
  yesLabel,
  noLabel,
  badgeText,
  error: _error,
  touched: _touched,
}) => {
  const badge = badgeText ? (
    <Chip
      icon={<span style={{ fontSize: 14, marginLeft: 8 }}>&#9432;</span>}
      label={badgeText}
      variant="outlined"
      color="info"
      size="medium"
      sx={{ mb: 2, borderRadius: '20px', fontWeight: 500 }}
    />
  ) : null;

  switch (inputType) {
    case 'text':
      return (
        <>
          {badge}
          <TextInput
            value={value}
            onChange={onChange}
            label={label}
            required={required}
            startAdornment={startAdornment}
          />
        </>
      );
    case 'currency':
      return (
        <>
          {badge}
          <CurrencyInput
            value={value}
            onChange={onChange}
            label={label}
            required={required}
            endAdornment={endAdornment}
          />
        </>
      );
    case 'number':
      return (
        <>
          {badge}
          <NumberInput
            value={value}
            onChange={onChange}
            label={label}
            required={required}
            endAdornment={endAdornment}
          />
        </>
      );
    case 'select':
      return (
        <SelectInput
          value={value}
          onChange={onChange}
          label={label}
          required={required}
          options={options}
        />
      );
    case 'multiSelect':
      return (
        <MultiSelectInput
          value={value}
          onChange={onChange}
          label={label}
          required={required}
          options={options}
        />
      );
    case 'yesNo':
      return <YesNoInput value={value} onChange={onChange} yesLabel={yesLabel} noLabel={noLabel} />;
    case 'slider':
      return <SliderInput value={value} onChange={onChange} />;
    case 'tagInput':
      return <TagInput value={value} onChange={onChange} label={label} required={required} />;
    default:
      return null;
  }
};

export const InputRendererWithError: React.FC<InputRendererProps> = (props) => {
  const { error, touched } = props;
  const showError = Boolean(touched && error);

  return (
    <>
      <InputRenderer {...props} />
      {showError ? (
        <FormHelperText error sx={{ mt: 0.5, ml: 0.5 }}>
          {error}
        </FormHelperText>
      ) : null}
    </>
  );
};
