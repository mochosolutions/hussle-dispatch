import {
  Box,
  Button,
  Card,
  OutlinedInput,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { SectionCard } from '../../../SectionCard';
import {
  CurrencyField,
  PercentField,
  SelectField,
  TextField,
  EmailField,
  BaseFieldWrapper,
  CharCounterField,
} from '../../../../../../mocho/components';
import { CARRIER_TYPE_OPTIONS } from '../../../../constants';

const CompanyInformationSection = ({ formik, errors, touched, values }) => {
  return (
    <SectionCard title="Company Information">
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: 'calc(50% - 8px)' }}>
          <SelectField
            required
            name="type"
            label="Carrier Type"
            data={CARRIER_TYPE_OPTIONS}
            formik={formik}
          />
        </Box>

        <Box sx={{ flex: 'calc(50% - 8px)' }}>
          <TextField
            required
            name="name"
            label="Legal Name"
            placeholder="Legal business name"
            formik={formik}
          />
          <TextField required name="phone" label="Phone Number" formik={formik} />
          <EmailField required name="email" label="Email" formik={formik} />
        </Box>

        <Box sx={{ flex: '0 0 calc(50% - 8px)' }}>
          <BaseFieldWrapper
            name="mcNumber"
            label="MC Number"
            error={errors.mcNumber}
            touched={touched.mcNumber}
          >
            <OutlinedInput
              id="mcNumber"
              name="mcNumber"
              placeholder="MC-0000000"
              value={values.mcNumber}
              //   onChange={(event) => {
              // handleChange(event);
              // setMcLookup('idle');
              //   }}
              // onBlur={(event) => {
              //   handleBlur(event);
              //   handleMcLookup(event.target.value);
              // }}
              error={Boolean(touched.mcNumber && errors.mcNumber)}
              fullWidth
            />
          </BaseFieldWrapper>
          {/* <MCLookupIndicator status={mcLookup} /> */}
        </Box>

        <Box sx={{ flex: '0 0 calc(50% - 8px)' }}>
          <TextField
            name="dotNumber"
            label="DOT Number"
            placeholder="Auto-filled or manual"
            formik={formik}
          />
        </Box>

        <Box sx={{ flex: '0 0 100%' }}>
          <TextField
            name="address"
            label="Address"
            placeholder="789 Carrier Way, Elizabeth, NJ 07201"
            formik={formik}
          />
        </Box>
      </Box>
    </SectionCard>
  );
};

export default CompanyInformationSection;
