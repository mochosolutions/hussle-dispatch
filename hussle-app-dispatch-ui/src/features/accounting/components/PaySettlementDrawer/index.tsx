import * as Yup from 'yup';
import { TextField, SelectField } from '@mocho/ui/components';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { DrawerSection } from 'components/EditDrawer';
import { useDispatch } from 'store';
import { paySettlementRequest } from '../../store/reducers/settlementPageSlice';

const PAYMENT_METHOD_OPTIONS = [
  { value: 'CHECK', label: 'Check' },
  { value: 'ACH', label: 'ACH' },
  { value: 'WIRE', label: 'Wire' },
  { value: 'OTHER', label: 'Other' },
];

const paymentSchema = Yup.object({
  paymentMethod: Yup.string()
    .oneOf(['CHECK', 'ACH', 'WIRE', 'OTHER'])
    .required('Payment method is required'),
  paymentReference: Yup.string().optional(),
}).required();

interface PaymentFormValues {
  paymentMethod: string;
  paymentReference: string;
}

interface PaySettlementDrawerProps {
  settlementId: string;
  onClose: () => void;
}

export const PaySettlementDrawer: React.FC<PaySettlementDrawerProps> = ({
  settlementId,
  onClose,
}) => {
  const dispatch = useDispatch();

  const initialValues: PaymentFormValues = {
    paymentMethod: 'ACH',
    paymentReference: '',
  };

  const handleSubmit = (values: PaymentFormValues) => {
    dispatch(
      paySettlementRequest({
        id: settlementId,
        input: {
          paymentMethod: values.paymentMethod,
          paymentReference: values.paymentReference || undefined,
        },
      }),
    );
  };

  return (
    <FormDrawer<PaymentFormValues>
      open
      onClose={onClose}
      title="Mark as Paid"
      initialValues={initialValues}
      validationSchema={paymentSchema}
      onSubmit={handleSubmit}
      saveLabel="Mark as Paid"
      savingLabel="Processing..."
    >
      {(formik) => (
        <DrawerSection label="Payment Details">
          <SelectField
            name="paymentMethod"
            label="Payment Method"
            data={PAYMENT_METHOD_OPTIONS}
            formik={formik}
          />
          <TextField
            name="paymentReference"
            label="Reference / Check Number"
            formik={formik}
          />
        </DrawerSection>
      )}
    </FormDrawer>
  );
};
