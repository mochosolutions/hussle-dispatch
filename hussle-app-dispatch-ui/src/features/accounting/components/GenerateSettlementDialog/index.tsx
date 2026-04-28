import { useState } from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import type { InferType } from 'yup';
import { TextField, DateField } from '@mocho/ui/components';
import { CarrierAutocomplete } from '../../../carrier/components/CarrierAutocomplete';
import { useDispatch } from 'store';
import { generateSettlementRequest } from '../../store/reducers/settlementPageSlice';
import type { GenerateSettlementInput } from '../../types';

interface GenerateSettlementDialogProps {
  onClose: () => void;
}

const validationSchema = Yup.object({
  carrierId: Yup.string().required('Carrier is required'),
  driverId: Yup.string().optional().default(''),
  vehicleId: Yup.string().optional().default(''),
  periodStart: Yup.string().required('Period start is required'),
  periodEnd: Yup.string().required('Period end is required'),
}).required();

type GenerateFormValues = InferType<typeof validationSchema>;

const initialValues: GenerateFormValues = {
  carrierId: '',
  driverId: '',
  vehicleId: '',
  periodStart: '',
  periodEnd: '',
};

export const GenerateSettlementDialog: React.FC<GenerateSettlementDialogProps> = ({
  onClose,
}) => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (values: GenerateFormValues) => {
    setIsSubmitting(true);

    const input: GenerateSettlementInput = {
      carrierId: values.carrierId,
      periodStart: values.periodStart,
      periodEnd: values.periodEnd,
      ...(values.driverId ? { driverId: values.driverId } : {}),
      ...(values.vehicleId ? { vehicleId: values.vehicleId } : {}),
    };

    dispatch(generateSettlementRequest(input));
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <Formik<GenerateFormValues>
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {(formik) => (
          <Form>
            <DialogTitle>Generate Settlement</DialogTitle>
            <DialogContent>
              <Stack spacing={2.5} sx={{ pt: 1 }}>
                <CarrierAutocomplete
                  name="carrierId"
                  label="Carrier"
                  formik={formik}
                  required
                />
                <TextField name="driverId" label="Driver ID" formik={formik} />
                <TextField name="vehicleId" label="Vehicle ID" formik={formik} />
                <DateField name="periodStart" label="Period Start" formik={formik} />
                <DateField name="periodEnd" label="Period End" formik={formik} />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={!formik.isValid || !formik.dirty || isSubmitting}
                startIcon={
                  isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined
                }
              >
                {isSubmitting ? 'Generating...' : 'Generate'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};
