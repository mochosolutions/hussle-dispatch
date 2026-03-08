import * as Yup from 'yup';

export const vehicleTargetsSchema = Yup.object({
  monthlyGrossTarget: Yup.string().nullable(),
  monthlyMilesTarget: Yup.number().nullable().min(0, 'Must be 0 or greater'),
  workingDaysPerMonth: Yup.number()
    .nullable()
    .min(1, 'Must be at least 1')
    .max(31, 'Must be 31 or fewer'),
}).required();

export type VehicleTargetsFormValues = Yup.InferType<typeof vehicleTargetsSchema>;
