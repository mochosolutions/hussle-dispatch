import { Formik, Form } from 'formik';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Card,
  Grid,
  Stack,
  CircularProgress,
} from '@mui/material';
import { EditDrawer } from '../../components/EditDrawer';
import { dispatchTermsSchema } from '../../validators/fleetSchema';
import { PAYMENT_TERMS_OPTIONS } from '../../constants';
import { CarrierData } from '../../types';

export const DispatchTermsDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  data: CarrierData;
  onSave: (values: Partial<CarrierData>) => void;
}> = ({ open, onClose, data, onSave }) => (
  <EditDrawer open={open} onClose={onClose} title="Edit Dispatch Terms" subtitle={data.legalName}>
    <Formik
      initialValues={{
        dispatchFee: data.dispatchFee,
        partnerSplit: data.partnerSplit,
        paymentTerms: data.paymentTerms,
        agreementDate: data.agreementDate,
      }}
      validationSchema={dispatchTermsSchema}
      onSubmit={(values, { setSubmitting }) => {
        setTimeout(() => {
          onSave(values);
          setSubmitting(false);
          onClose();
        }, 600);
      }}
      enableReinitialize
    >
      {({ values, errors, touched, handleChange, handleBlur, isSubmitting, isValid, dirty }) => (
        <Form>
          <Stack spacing={2.5}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="dispatchFee"
                  label="Dispatch Fee %"
                  type="number"
                  value={values.dispatchFee}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.dispatchFee && Boolean(errors.dispatchFee)}
                  helperText={touched.dispatchFee && errors.dispatchFee}
                  InputProps={{ inputProps: { min: 0, max: 100, step: 0.5 } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="partnerSplit"
                  label="Partner Split %"
                  type="number"
                  value={values.partnerSplit}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.partnerSplit && Boolean(errors.partnerSplit)}
                  helperText={touched.partnerSplit && errors.partnerSplit}
                  InputProps={{ inputProps: { min: 0, max: 100, step: 0.5 } }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              select
              name="paymentTerms"
              label="Payment Terms"
              value={values.paymentTerms}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.paymentTerms && Boolean(errors.paymentTerms)}
              helperText={touched.paymentTerms && errors.paymentTerms}
            >
              {PAYMENT_TERMS_OPTIONS.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              name="agreementDate"
              label="Agreement Date"
              type="date"
              value={values.agreementDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />

            {/* Summary preview */}
            <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, display: 'block' }}
              >
                Preview
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  rowGap: 0.75,
                  fontSize: '0.8125rem',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Dispatch Fee
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: 'primary.main', textAlign: 'right' }}
                >
                  {values.dispatchFee}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Partner Split
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
                  {values.partnerSplit}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Payment Terms
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
                  {values.paymentTerms || '—'}
                </Typography>
              </Box>
            </Card>

            <Box
              sx={{
                pt: 2,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1.5,
                borderTop: 1,
                borderColor: 'divider',
                mt: 1,
              }}
            >
              <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={!isValid || !dirty || isSubmitting}
                startIcon={
                  isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined
                }
              >
                {isSubmitting ? 'Saving…' : 'Save Changes'}
              </Button>
            </Box>
          </Stack>
        </Form>
      )}
    </Formik>
  </EditDrawer>
);
