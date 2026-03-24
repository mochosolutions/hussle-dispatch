import React from 'react';
import { Formik, Form, useFormikContext } from 'formik';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import * as Yup from 'yup';
import { EditDrawer } from 'components/EditDrawer';
import { useDispatch } from 'store';
import { markPaidRequest } from '../../store/reducers';
import { PAYMENT_METHOD_OPTIONS } from '../../constants';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const paymentSchema = Yup.object({
  amount: Yup.number().required('Amount is required').positive('Amount must be positive'),
  method: Yup.string()
    .oneOf(['ACH', 'CHECK', 'WIRE', 'CREDIT_CARD', 'OTHER'])
    .required('Payment method is required'),
  reference: Yup.string().optional(),
  paidAt: Yup.string().required('Payment date is required'),
}).required();

interface PaymentFormValues {
  amount: number;
  method: string;
  reference: string;
  paidAt: string;
}

// ---------------------------------------------------------------------------
// Drawer content (inside Formik)
// ---------------------------------------------------------------------------

interface PaymentDrawerContentProps {
  onClose: () => void;
  balanceDue: number;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const PaymentDrawerContent: React.FC<PaymentDrawerContentProps> = ({ onClose, balanceDue }) => {
  const { values, errors, touched, handleChange, handleBlur, isSubmitting, isValid, dirty } =
    useFormikContext<PaymentFormValues>();

  const footer = (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
      <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        type="submit"
        form="payment-form"
        variant="contained"
        disabled={!isValid || !dirty || isSubmitting}
        startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
      >
        {isSubmitting ? 'Recording\u2026' : 'Record Payment'}
      </Button>
    </Box>
  );

  return (
    <EditDrawer
      open
      onClose={onClose}
      title="Record Payment"
      subtitle={`Balance due: ${currencyFormatter.format(balanceDue)}`}
      isDirty={dirty}
      footer={footer}
    >
      <Form id="payment-form">
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '0.6875rem',
              letterSpacing: 0.5,
            }}
          >
            Payment Details
          </Typography>

          <TextField
            fullWidth
            size="small"
            name="amount"
            label="Amount"
            type="number"
            value={values.amount}
            onChange={handleChange}
            onBlur={handleBlur}
            error={Boolean(touched.amount && errors.amount)}
            helperText={touched.amount ? (errors.amount as string | undefined) : undefined}
          />

          <TextField
            select
            fullWidth
            size="small"
            name="method"
            label="Payment Method"
            value={values.method}
            onChange={handleChange}
            onBlur={handleBlur}
            error={Boolean(touched.method && errors.method)}
            helperText={touched.method ? (errors.method as string | undefined) : undefined}
          >
            {PAYMENT_METHOD_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            size="small"
            name="reference"
            label="Reference / Check Number"
            value={values.reference}
            onChange={handleChange}
            onBlur={handleBlur}
          />

          <TextField
            fullWidth
            size="small"
            name="paidAt"
            label="Payment Date"
            type="date"
            value={values.paidAt}
            onChange={handleChange}
            onBlur={handleBlur}
            error={Boolean(touched.paidAt && errors.paidAt)}
            helperText={touched.paidAt ? (errors.paidAt as string | undefined) : undefined}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </Form>
    </EditDrawer>
  );
};

// ---------------------------------------------------------------------------
// PaymentDrawer (exported)
// ---------------------------------------------------------------------------

interface PaymentDrawerProps {
  invoiceId: string;
  balanceDue: number;
  onClose: () => void;
}

export const PaymentDrawer: React.FC<PaymentDrawerProps> = ({
  invoiceId,
  balanceDue,
  onClose,
}) => {
  const dispatch = useDispatch();

  const today = new Date().toISOString().split('T')[0];

  return (
    <Formik<PaymentFormValues>
      initialValues={{
        amount: balanceDue,
        method: 'ACH',
        reference: '',
        paidAt: today,
      }}
      validationSchema={paymentSchema}
      onSubmit={(values, { setSubmitting }) => {
        dispatch(
          markPaidRequest({
            id: invoiceId,
            payment: {
              amount: values.amount,
              method: values.method,
              reference: values.reference || undefined,
              paidAt: values.paidAt,
            },
          }),
        );
        setSubmitting(false);
        onClose();
      }}
    >
      <PaymentDrawerContent onClose={onClose} balanceDue={balanceDue} />
    </Formik>
  );
};
