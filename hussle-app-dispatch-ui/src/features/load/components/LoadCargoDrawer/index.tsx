import React from 'react';
import { Box, Stack } from '@mui/material';
import * as Yup from 'yup';
import { TextField, SelectField, CheckboxField, NumericField } from '@mocho/ui/components';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { DrawerSection } from 'components/EditDrawer';
import { useDispatch } from 'store';
import { updateLoadRequest } from '../../store/reducers';
import type { LoadDetail } from '../../types';
import { EQUIPMENT_OPTIONS } from '../../constants';

const cargoSchema = Yup.object().shape({
  equipmentType: Yup.string(),
  commodity: Yup.string(),
  weight: Yup.number().positive('Weight must be positive').nullable(),
  pieceCount: Yup.number().integer('Must be whole number').min(0).nullable(),
  isHazmat: Yup.boolean(),
  isTarp: Yup.boolean(),
});

type CargoFormValues = Yup.InferType<typeof cargoSchema>;

interface LoadCargoDrawerProps {
  load: LoadDetail;
  onClose: () => void;
}

export const LoadCargoDrawer: React.FC<LoadCargoDrawerProps> = ({ load, onClose }) => {
  const dispatch = useDispatch();

  const initialValues: CargoFormValues = {
    equipmentType: load.equipmentType ?? '',
    commodity: load.cargo.commodity ?? '',
    weight: load.cargo.weight ?? undefined,
    pieceCount: load.cargo.pieceCount ?? undefined,
    isHazmat: load.cargo.isHazmat,
    isTarp: load.cargo.isTarp,
  };

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Edit Cargo"
      subtitle={load.loadNumber}
      initialValues={initialValues}
      validationSchema={cargoSchema}
      onSubmit={(values) => {
        dispatch(updateLoadRequest({ id: load.id, data: values }));
      }}
    >
      {(formik) => (
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <DrawerSection label="Cargo Details">
            <SelectField
              name="equipmentType"
              label="Equipment Type"
              data={EQUIPMENT_OPTIONS}
              formik={formik}
            />
            <TextField name="commodity" label="Commodity" formik={formik} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <NumericField name="weight" label="Weight" suffix="lbs" formik={formik} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <NumericField name="pieceCount" label="Piece Count" formik={formik} />
              </Box>
            </Box>
            <Stack direction="row" spacing={2}>
              <CheckboxField name="isHazmat" label="Hazmat" formik={formik} />
              <CheckboxField name="isTarp" label="Tarp Required" formik={formik} />
            </Stack>
          </DrawerSection>
        </Stack>
      )}
    </FormDrawer>
  );
};
