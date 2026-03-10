import * as Yup from 'yup';

export const vehicleExpenseSchema = Yup.object({
  category: Yup.string()
    .required('Category is required')
    .oneOf(['FIXED', 'VARIABLE', 'SERVICE', 'WAGE', 'DEDUCTION']),
  expenseKey: Yup.string().required('Expense key is required'),
  label: Yup.string().required('Label is required'),
  monthlyAmount: Yup.number().required('Monthly amount is required').min(0, 'Must be 0 or greater'),
}).required();

export type VehicleExpenseFormValues = Yup.InferType<typeof vehicleExpenseSchema>;
