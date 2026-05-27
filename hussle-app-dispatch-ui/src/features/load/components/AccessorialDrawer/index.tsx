import React, { useMemo } from 'react';
import { Stack } from '@mui/material';
import * as Yup from 'yup';
import type { InferType } from 'yup';
import { CurrencyField, SelectField, TextField } from '@mocho/ui/components';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { useDispatch, useSelector } from 'store';
import {
  createAccessorialRequest,
  updateAccessorialRequest,
} from '../../store/reducers';
import { selectLoadDetailById } from '../../store/selectors/loadSelectors';
import type { AccessorialType } from '../../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCESSORIAL_TYPE_VALUES: readonly AccessorialType[] = [
  'DETENTION',
  'LUMPER',
  'TONU',
  'LAYOVER',
  'DRIVER_ASSIST',
  'FUEL_SURCHARGE',
  'TARP',
  'TOLL',
  'OTHER',
];

const ACCESSORIAL_TYPE_OPTIONS: { value: AccessorialType; label: string }[] = [
  { value: 'DETENTION', label: 'Detention' },
  { value: 'LUMPER', label: 'Lumper' },
  { value: 'TONU', label: 'TONU' },
  { value: 'LAYOVER', label: 'Layover' },
  { value: 'DRIVER_ASSIST', label: 'Driver Assist' },
  { value: 'FUEL_SURCHARGE', label: 'Fuel Surcharge' },
  { value: 'TARP', label: 'Tarp' },
  { value: 'TOLL', label: 'Toll' },
  { value: 'OTHER', label: 'Custom' },
];

const BILL_TO_OPTIONS = [
  { value: 'CARRIER', label: 'Carrier' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'BOTH', label: 'Both' },
];

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const accessorialSchema = Yup.object({
  type: Yup.mixed<AccessorialType>()
    .oneOf(ACCESSORIAL_TYPE_VALUES, 'Type is required')
    .required('Type is required'),
  description: Yup.string()
    .trim()
    .max(500, 'Description must be 500 characters or fewer')
    .when('type', {
      is: (val: AccessorialType) => val === 'OTHER',
      then: (schema) =>
        schema.required('Description is required for custom charges'),
      otherwise: (schema) => schema.optional(),
    })
    .default(''),
  amount: Yup.number()
    .typeError('Amount is required')
    .positive('Amount must be greater than zero')
    .required('Amount is required'),
  billTo: Yup.string()
    .oneOf(['CARRIER', 'CUSTOMER', 'BOTH'], 'Bill to is required')
    .required('Bill to is required'),
}).required();

type AccessorialFormValues = InferType<typeof accessorialSchema>;

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

export interface AccessorialDrawerProps {
  loadId: string;
  accessorialId?: string;
  onClose: () => void;
}

export const AccessorialDrawer: React.FC<AccessorialDrawerProps> = ({
  loadId,
  accessorialId,
  onClose,
}) => {
  const dispatch = useDispatch();
  const load = useSelector(selectLoadDetailById(loadId));

  const existingCharge = useMemo(() => {
    if (!accessorialId || !load) {
      return undefined;
    }
    return load.activity.accessorialCharges.find((c) => c.id === accessorialId);
  }, [accessorialId, load]);

  const isEdit = existingCharge !== undefined;

  const initialValues: AccessorialFormValues = useMemo(() => {
    if (existingCharge) {
      const typeValue = ACCESSORIAL_TYPE_VALUES.includes(
        existingCharge.type as AccessorialType,
      )
        ? (existingCharge.type as AccessorialType)
        : 'OTHER';
      return {
        type: typeValue,
        description: existingCharge.description ?? '',
        amount: parseFloat(existingCharge.amount),
        billTo: existingCharge.billTo.toUpperCase(),
      };
    }
    return {
      type: 'DETENTION',
      description: '',
      amount: 0,
      billTo: 'BOTH',
    };
  }, [existingCharge]);

  const handleSubmit = (values: AccessorialFormValues) => {
    const description = values.description?.trim() ?? '';
    const payload = {
      type: values.type,
      amount: values.amount,
      billTo: values.billTo,
      description: description.length > 0 ? description : undefined,
    };

    if (isEdit && accessorialId !== undefined) {
      dispatch(
        updateAccessorialRequest({
          loadId,
          accessorialId,
          data: payload,
        }),
      );
    } else {
      dispatch(createAccessorialRequest({ loadId, data: payload }));
    }
  };

  return (
    <FormDrawer
      open
      onClose={onClose}
      title={isEdit ? 'Edit Accessorial' : 'Add Accessorial'}
      subtitle={load?.loadNumber}
      initialValues={initialValues}
      validationSchema={accessorialSchema}
      onSubmit={handleSubmit}
      saveLabel={isEdit ? 'Save Changes' : 'Add Accessorial'}
      savingLabel={isEdit ? 'Saving…' : 'Adding…'}
    >
      {(formik) => {
        const isCustom = formik.values.type === 'OTHER';
        return (
          <Stack spacing={2.5} sx={{ p: 3 }}>
            <SelectField
              name="type"
              label="Type"
              data={ACCESSORIAL_TYPE_OPTIONS}
              formik={formik}
              required
            />
            <TextField
              name="description"
              label={isCustom ? 'Description' : 'Description (optional)'}
              formik={formik}
              required={isCustom}
              placeholder={
                isCustom
                  ? 'Describe this charge'
                  : 'Additional details about this charge'
              }
            />
            <CurrencyField
              name="amount"
              label="Amount"
              formik={formik}
              required
            />
            <SelectField
              name="billTo"
              label="Bill To"
              data={BILL_TO_OPTIONS}
              formik={formik}
              required
            />
          </Stack>
        );
      }}
    </FormDrawer>
  );
};
