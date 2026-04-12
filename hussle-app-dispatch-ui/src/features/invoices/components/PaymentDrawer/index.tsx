import * as Yup from 'yup';
import { TextField, SelectField, DateField } from '@mocho/ui/components';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { DrawerSection } from 'components/EditDrawer';
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
// Helpers
// ---------------------------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

// ---------------------------------------------------------------------------
// PaymentDrawer
// ---------------------------------------------------------------------------

interface PaymentDrawerProps {
  invoiceId: string;
  balanceDue: number;
  onClose: () => void;
}

export const PaymentDrawer: React.FC<PaymentDrawerProps> = ({ invoiceId, balanceDue, onClose }) => {
  const dispatch = useDispatch();

  const today = new Date().toISOString().split('T')[0];

  const initialValues: PaymentFormValues = {
    amount: balanceDue,
    method: 'ACH',
    reference: '',
    paidAt: today,
  };

  const handleSubmit = (values: PaymentFormValues) => {
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
  };

  return (
    <FormDrawer<PaymentFormValues>
      open
      onClose={onClose}
      title="Record Payment"
      subtitle={`Balance due: ${currencyFormatter.format(balanceDue)}`}
      initialValues={initialValues}
      validationSchema={paymentSchema}
      onSubmit={handleSubmit}
      saveLabel="Record Payment"
      savingLabel="Recording…"
    >
      {(formik) => (
        <DrawerSection label="Payment Details">
          <TextField name="amount" label="Amount" type="number" formik={formik} />
          <SelectField
            name="method"
            label="Payment Method"
            data={PAYMENT_METHOD_OPTIONS}
            formik={formik}
          />
          <TextField name="reference" label="Reference / Check Number" formik={formik} />
          <DateField name="paidAt" label="Payment Date" formik={formik} />
        </DrawerSection>
      )}
    </FormDrawer>
  );
};
