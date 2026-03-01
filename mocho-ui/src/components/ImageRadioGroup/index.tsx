import React, {useState, useEffect} from 'react';
import {
  Radio,
  RadioGroup,
  FormControlLabel,
  Box,
  Typography,
  Stack,
} from '@mui/material';
import {styled} from '@mui/system';

// Custom styling for the radio selection
const StyledFormControlLabel = styled(FormControlLabel)(({theme}) => ({
  margin: '8px 0',
  '& .MuiTypography-root': {
    fontWeight: 'bold',
    marginTop: '8px',
  },
}));

// Props definition for the reusable component
interface ImageRadioOption {
  value: string;
  title: string;
  imageUrl: string;
}

interface ImageRadioGroupProps {
  options: ImageRadioOption[];
  selectedValue?: string; // Optional prop for controlled usage
  defaultValue?: string; // Optional default value for uncontrolled usage
  onChange?: (value: string) => void; // Optional change handler
}

const ImageRadioGroup: React.FC<ImageRadioGroupProps> = ({
  options,
  selectedValue, // Controlled value
  defaultValue, // Default value for uncontrolled behavior
  onChange, // Optional handler
}) => {
  const [internalValue, setInternalValue] = useState<string>(
    defaultValue || '',
  );

  // Sync internal state with the controlled `selectedValue` prop, if provided
  useEffect(() => {
    if (selectedValue !== undefined) {
      setInternalValue(selectedValue);
    }
  }, [selectedValue]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const {value} = event.target;

    // Update internal state for uncontrolled usage
    if (selectedValue === undefined) {
      setInternalValue(value);
    }

    // Call the parent's `onChange` handler if provided
    if (onChange) {
      onChange(value);
    }
  };

  const currentValue =
    selectedValue !== undefined ? selectedValue : internalValue;

  return (
    <RadioGroup
      name="image-radio-group"
      value={currentValue}
      onChange={handleChange}
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}
    >
      {options.map((option) => (
        <StyledFormControlLabel
          key={option.value}
          value={option.value}
          control={<Radio sx={{display: 'none'}} />} // Hide default radio UI
          label={
            <Box
              sx={{
                border:
                  currentValue === option.value
                    ? '2px solid #1976d2'
                    : '1px solid #ccc',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.3s ease',
              }}
            >
              <Stack direction="column" alignItems="center">
                <Box
                  component="img"
                  src={option.imageUrl}
                  alt={option.title}
                  sx={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '4px',
                    marginBottom: '8px',
                  }}
                />
                <Typography variant="body1">{option.title}</Typography>
              </Stack>
            </Box>
          }
        />
      ))}
    </RadioGroup>
  );
};

export default ImageRadioGroup;
