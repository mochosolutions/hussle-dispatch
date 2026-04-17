import * as Yup from 'yup';
import { TextField, DateField, CurrencyField } from '@mocho/ui/components';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { DrawerSection } from 'components/EditDrawer';
import { useDispatch } from 'store';
import { addAdjustmentRequest } from '../../store/reducers/settlementPageSlice';

const adjustmentSchema = Yup.object({
  description: Yup.string().required('Description is required').min(1),
  amount: Yup.number().required('Amount is required'),
  date: Yup.string().required('Date is required'),
}).required();

interface AdjustmentFormValues {
  description: string;
  amount: number;
  date: string;
}

interface AddAdjustmentDrawerProps {
  settlementId: string;
  onClose: () => void;
}

export const AddAdjustmentDrawer: React.FC<AddAdjustmentDrawerProps> = ({
  settlementId,
  onClose,
}) => {
  const dispatch = useDispatch();

  const today = new Date().toISOString().split('T')[0];

  const initialValues: AdjustmentFormValues = {
    description: '',
    amount: 0,
    date: today,
  };

  const handleSubmit = (values: AdjustmentFormValues) => {
    dispatch(
      addAdjustmentRequest({
        settlementId,
        input: {
          description: values.description,
          amount: values.amount,
          date: values.date,
        },
      }),
    );
  };

  return (
    <FormDrawer<AdjustmentFormValues>
      open
      onClose={onClose}
      title="Add Adjustment"
      initialValues={initialValues}
      validationSchema={adjustmentSchema}
      onSubmit={handleSubmit}
      saveLabel="Add Adjustment"
      savingLabel="Adding..."
    >
      {(formik) => (
        <DrawerSection label="Adjustment Details">
          <TextField name="description" label="Description" formik={formik} />
          <CurrencyField name="amount" label="Amount" required formik={formik} />
          <DateField name="date" label="Date" formik={formik} />
        </DrawerSection>
      )}
    </FormDrawer>
  );
};
