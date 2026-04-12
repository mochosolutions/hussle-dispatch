import * as Yup from 'yup';
import { TextField } from '@mocho/ui/components';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { DrawerSection } from 'components/EditDrawer';
import { useDispatch } from 'store';
import { disputeSettlementRequest } from '../../store/reducers/settlementPageSlice';

const disputeSchema = Yup.object({
  disputeReason: Yup.string().required('Dispute reason is required').min(1),
}).required();

interface DisputeFormValues {
  disputeReason: string;
}

interface DisputeSettlementDrawerProps {
  settlementId: string;
  onClose: () => void;
}

export const DisputeSettlementDrawer: React.FC<DisputeSettlementDrawerProps> = ({
  settlementId,
  onClose,
}) => {
  const dispatch = useDispatch();

  const initialValues: DisputeFormValues = {
    disputeReason: '',
  };

  const handleSubmit = (values: DisputeFormValues) => {
    dispatch(
      disputeSettlementRequest({
        id: settlementId,
        input: { disputeReason: values.disputeReason },
      }),
    );
  };

  return (
    <FormDrawer<DisputeFormValues>
      open
      onClose={onClose}
      title="Dispute Settlement"
      initialValues={initialValues}
      validationSchema={disputeSchema}
      onSubmit={handleSubmit}
      saveLabel="Submit Dispute"
      savingLabel="Submitting..."
    >
      {(formik) => (
        <DrawerSection label="Dispute Details">
          <TextField
            name="disputeReason"
            label="Reason for Dispute"
            formik={formik}
            multiline
            rows={4}
          />
        </DrawerSection>
      )}
    </FormDrawer>
  );
};
