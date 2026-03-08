import React from 'react';
import { Formik, Form, useFormikContext } from 'formik';
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'store';
import { TextField, CheckboxField } from '../../../../mocho/components';
import { EditDrawer } from '../../components/EditDrawer';
import { dispatchTermsSchema } from '../../validators/fleetSchema';
import { selectCarrierById } from '../../store/selectors/carrierSelectors';
import { updateCarrierRequest } from '../../store/reducers/carrierNewPageSlice';

interface DispatchTermsDrawerProps {
  carrierId: string;
  onClose: () => void;
}

export const DispatchTermsDrawer: React.FC<DispatchTermsDrawerProps> = ({
  carrierId,
  onClose,
}) => {
  const dispatch = useDispatch();
  const carrier = useSelector(selectCarrierById(carrierId));

  if (!carrier) {
    return null;
  }

  return (
    <Formik
      initialValues={{
        dispatchFeePercent: carrier.dispatchFeePercent,
        feeIncludesAccessorials: carrier.feeIncludesAccessorials,
        dispatchAgreementOnFile: carrier.dispatchAgreementOnFile,
      }}
      validationSchema={dispatchTermsSchema}
      onSubmit={(values) => {
        dispatch(updateCarrierRequest({ id: carrierId, data: values }));
        onClose();
      }}
      enableReinitialize
    >
      <DispatchTermsDrawerContent carrierName={carrier.name} partnerSplitPercent={carrier.partnerSplitPercent} onClose={onClose} />
    </Formik>
  );
};

interface DispatchTermsDrawerContentProps {
  carrierName: string;
  partnerSplitPercent: string | null | undefined;
  onClose: () => void;
}

const DispatchTermsDrawerContent: React.FC<DispatchTermsDrawerContentProps> = ({
  carrierName,
  partnerSplitPercent,
  onClose,
}) => {
  const { values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting, isValid, dirty } =
    useFormikContext<Record<string, unknown>>();

  const formikProps = { values, errors, touched, handleChange, handleBlur, setFieldValue };

  const footer = (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
      <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        type="submit"
        form="edit-dispatch-terms"
        variant="contained"
        disabled={!isValid || !dirty || isSubmitting}
        startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
      >
        {isSubmitting ? 'Saving\u2026' : 'Save Changes'}
      </Button>
    </Box>
  );

  return (
    <EditDrawer
      open
      onClose={onClose}
      title="Edit Dispatch Terms"
      subtitle={carrierName}
      isDirty={dirty}
      footer={footer}
    >
      <Form id="edit-dispatch-terms">
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <TextField
            name="dispatchFeePercent"
            label="Dispatch Fee %"
            type="number"
            formik={formikProps}
          />

          <Typography variant="body2" color="text.secondary">
            Partner Split: {partnerSplitPercent ?? '—'}% (admin-managed)
          </Typography>

          <CheckboxField
            name="feeIncludesAccessorials"
            label="Fee includes accessorials"
            formik={formikProps}
          />

          <CheckboxField
            name="dispatchAgreementOnFile"
            label="Dispatch agreement on file"
            formik={formikProps}
          />
        </Stack>
      </Form>
    </EditDrawer>
  );
};
