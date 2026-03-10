import { EquipmentType, ExpenseCategory, VehicleOwnership } from '@prisma/client';
import * as Yup from 'yup';

const equipmentTypeValues = Object.values(EquipmentType);
const ownershipValues = Object.values(VehicleOwnership);
const expenseCategoryValues = Object.values(ExpenseCategory);

const optionalTrimmed = Yup.string().trim().notRequired();

const expenseSchema = Yup.object({
  category: Yup.mixed<ExpenseCategory>()
    .oneOf(expenseCategoryValues, 'category must be a valid ExpenseCategory')
    .required('category is required'),
  expenseKey: Yup.string().trim().required('expenseKey is required'),
  label: Yup.string().trim().required('label is required'),
  monthlyAmount: Yup.number().min(0).notRequired(),
});

const createBodySchema = Yup.object({
  carrierId: Yup.string().uuid('carrierId must be a valid uuid').required('carrierId is required'),
  unitNumber: Yup.string().trim().required('unitNumber is required'),
  type: Yup.mixed<EquipmentType>()
    .oneOf(equipmentTypeValues, 'type must be a valid EquipmentType')
    .required('type is required'),
  ownership: Yup.mixed<VehicleOwnership>()
    .oneOf(ownershipValues, 'ownership must be a valid VehicleOwnership')
    .notRequired(),
  year: Yup.number().integer().min(1900).max(2100).notRequired(),
  make: optionalTrimmed,
  model: optionalTrimmed,
  vin: optionalTrimmed,
  licensePlate: optionalTrimmed,
  licensePlateState: optionalTrimmed,
  emergencyContactName: optionalTrimmed,
  emergencyContactPhone: optionalTrimmed,
  warrantyInfo: optionalTrimmed,
  monthlyGrossTarget: Yup.number().min(0).notRequired(),
  monthlyMilesTarget: Yup.number().integer().min(0).notRequired(),
  workingDaysPerMonth: Yup.number().integer().min(1).max(31).notRequired(),
  isActive: Yup.boolean().notRequired(),
  notes: optionalTrimmed,
});

const updateBodySchema = createBodySchema
  .shape({
    carrierId: Yup.string().uuid('carrierId must be a valid uuid').notRequired(),
    unitNumber: Yup.string().trim().notRequired(),
    type: Yup.mixed<EquipmentType>().oneOf(
      equipmentTypeValues,
      'type must be a valid EquipmentType',
    ),
    expenses: Yup.array().of(expenseSchema).notRequired(),
  })
  .test('has-any-field', 'At least one field must be provided', (value) => {
    if (value === undefined) {
      return false;
    }

    return Object.keys(value).length > 0;
  });

export const createVehicleValidator = Yup.object({
  body: createBodySchema,
});

export const updateVehicleValidator = Yup.object({
  body: updateBodySchema,
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

export const listVehiclesValidator = Yup.object({
  query: Yup.object({
    page: Yup.number().integer().min(1).notRequired(),
    limit: Yup.number().integer().min(1).max(100).notRequired(),
    sort: Yup.string().trim().notRequired(),
    order: Yup.string().oneOf(['asc', 'desc']).notRequired(),
    carrierId: Yup.string().uuid('carrierId must be a valid uuid').notRequired(),
    search: Yup.string().trim().notRequired(),
  }),
});

export const vehicleIdParamValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

export const assignDriverValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: Yup.object({
    driverId: Yup.string().uuid('driverId must be a valid uuid').required('driverId is required'),
  }),
});

export const loadHistoryValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  query: Yup.object({
    page: Yup.number().integer().min(1).notRequired(),
    limit: Yup.number().integer().min(1).max(100).notRequired(),
  }),
});
