import React from 'react';
import { Stack, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'store';
import { CheckboxField, PercentField } from '../../../../mocho/components';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { dispatchTermsSchema } from '../../validators/fleetSchema';
import { selectCarrierById, selectUserRole } from '../../store/selectors/carrierSelectors';
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
  const userRole = useSelector(selectUserRole);
  const isDispatcher = userRole === 'DISPATCHER' || userRole === 'dispatcher';

  if (!carrier) {
    return null;
  }

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Edit Dispatch Terms"
      subtitle={carrier.name}
      initialValues={{
        companyMarginPercent: carrier.companyMarginPercent,
        feeIncludesAccessorials: carrier.feeIncludesAccessorials,
        dispatchAgreementOnFile: carrier.dispatchAgreementOnFile,
      }}
      validationSchema={dispatchTermsSchema}
      onSubmit={(values) => {
        dispatch(updateCarrierRequest({ id: carrierId, data: values }));
      }}
    >
      {(formikProps) => (
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <PercentField
            name="companyMarginPercent"
            label="Company Margin"
            formik={formikProps}
          />

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
      )}
    </FormDrawer>
  );
};
