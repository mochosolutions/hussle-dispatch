import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Button, Stack } from '@mui/material';
import { useDispatch } from 'store';
import { PageWrapper } from '@mocho/ui/components';
import { InnerPageHeader } from 'components/InnerPageHeader';
import { DetailLayout } from 'components/DetailLayout';
import { useFormRef } from '../../../../mocho/hooks/useFormRef';
import { useDirtyFormBlocker } from '../../../../mocho/forms/hooks/useDirtyFormBlocker';
import { useModalActions } from '../../../ui/hooks/useModalActions';
import { createCarrierRequest } from '../../store/reducers/carrierNewPageSlice';
import { CarrierCreateForm } from '../../components/CarrierCreateForm';
import type { CarrierCreateFormWithAssets } from '../../components/CarrierCreateForm';

const CreateCarrierPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { formRef, formState, handleFormStateChange, submitForm } = useFormRef();
  const { openModal } = useModalActions();

  useDirtyFormBlocker({
    isDirty: formState.isDirty,
    isSubmitting: formState.isSubmitting,
    onBlock: (blocker) => {
      openModal('dirtyFormConfirm', {
        onConfirm: () => blocker.proceed?.(),
        onCancel: () => blocker.reset?.(),
      });
    },
  });

  const handleBack = () => {
    navigate('/carriers');
  };

  const handleSubmit = useCallback(
    (values: CarrierCreateFormWithAssets) => {
      dispatch(createCarrierRequest({ data: { ...values } }));
    },
    [dispatch],
  );

  return (
    <PageWrapper errorContext="CreateCarrierPage">
      <DetailLayout
        id="Create Carrier"
        breadcrumb={{ label: 'Add New Carrier', href: '/carriers' }}
        onBack={handleBack}
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={submitForm} disabled={formState.isSubmitting}>
              {formState.isSubmitting ? 'Creating...' : 'Create Carrier'}
            </Button>
          </Stack>
        }
      >
        <CarrierCreateForm
          ref={formRef}
          onSubmit={handleSubmit}
          onStateChange={handleFormStateChange}
        />
      </DetailLayout>
    </PageWrapper>
  );
};

export default CreateCarrierPage;
