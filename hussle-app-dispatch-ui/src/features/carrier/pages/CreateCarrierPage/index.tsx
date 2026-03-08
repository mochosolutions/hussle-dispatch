import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Button, Stack } from '@mui/material';
import { useDispatch } from 'store';
import { PageWrapper } from 'components/PageWrapper';
import { InnerPageHeader } from 'components/InnerPageHeader';
import { useFormRef } from '../../../../mocho/hooks/useFormRef';
import { createCarrierRequest } from '../../store/reducers/carrierNewPageSlice';
import { CarrierCreateForm } from '../../components/CarrierCreateForm';
import type { CarrierCreateFormWithAssets } from '../../components/CarrierCreateForm';

const CreateCarrierPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { formRef, formState, handleFormStateChange, submitForm } = useFormRef();

  const handleSubmit = useCallback(
    (values: CarrierCreateFormWithAssets) => {
      dispatch(createCarrierRequest({ data: { ...values } }));
    },
    [dispatch],
  );

  return (
    <PageWrapper errorContext="CreateCarrierPage">
      <InnerPageHeader
        onBack={() => navigate('/carriers')}
        backLabel="Carriers"
        title="Add New Carrier"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => navigate('/carriers')}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={submitForm}
              disabled={formState.isSubmitting}
            >
              {formState.isSubmitting ? 'Creating...' : 'Create Carrier'}
            </Button>
          </Stack>
        }
      />
      <CarrierCreateForm
        ref={formRef}
        onSubmit={handleSubmit}
        onStateChange={handleFormStateChange}
      />
    </PageWrapper>
  );
};

export default CreateCarrierPage;
