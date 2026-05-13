import * as Yup from 'yup';
import type { Schema } from 'yup';
import type {
  QuestionDefinition,
  SubQuestionDefinition,
} from 'components/ConversationalForm';

type AnyQuestion = QuestionDefinition | SubQuestionDefinition;

const isVisible = (q: AnyQuestion, values: Record<string, unknown>): boolean =>
  !q.condition || q.condition(values);

const vehicleEntrySchema = Yup.object({
  category: Yup.string().required('Vehicle type is required'),
  year: Yup.number().nullable(),
  make: Yup.string().required('Make is required'),
  model: Yup.string().required('Model is required'),
  vin: Yup.string().required('VIN is required'),
  licensePlate: Yup.string().required('License plate is required'),
  gvwr: Yup.number().nullable(),
});

const driverEntrySchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  phone: Yup.string(),
  email: Yup.string().email('Invalid email'),
  payType: Yup.string(),
  payRate: Yup.number().nullable(),
});

const fieldSchema = (q: AnyQuestion): Schema => {
  switch (q.inputType) {
    case 'currency':
    case 'number':
    case 'slider':
      return Yup.number().nullable();
    case 'yesNo':
      return Yup.boolean().nullable();
    case 'documentSign':
      return Yup.boolean().nullable();
    case 'multiSelect':
    case 'tagInput':
      return Yup.array().of(Yup.string());
    case 'vehicleList':
      return Yup.array().of(vehicleEntrySchema);
    case 'driverList':
      return Yup.array().of(driverEntrySchema);
    case 'stateGrid':
      return Yup.object();
    case 'text':
    case 'address':
    case 'select':
    case 'presetTiles':
    case 'documentUpload':
    default:
      return Yup.string();
  }
};

const applyRequired = (schema: Schema, q: AnyQuestion): Schema => {
  if (!q.required) {
    return schema;
  }
  if (q.inputType === 'vehicleList') {
    return (schema as Yup.ArraySchema<unknown[], unknown>)
      .min(1, 'Add at least one vehicle')
      .required('Add at least one vehicle');
  }
  if (q.inputType === 'documentUpload') {
    return Yup.string().required('Upload this document to continue');
  }
  if (q.inputType === 'documentSign') {
    return Yup.boolean()
      .oneOf([true], 'Sign this document to continue')
      .required('Sign this document to continue');
  }
  return schema.required('This field is required');
};

const addressTest = (q: AnyQuestion) => (_value: unknown, ctx: Yup.TestContext): boolean => {
  const all = ctx.parent as Record<string, unknown>;
  const prefix = q.id.replace(/\.address$/, '');
  const lat = all[`${prefix}.lat`];
  const lng = all[`${prefix}.lng`];
  return typeof lat === 'number' && typeof lng === 'number';
};

const EIN_PATTERN = /^\d{2}-?\d{7}$/;
const SSN_PATTERN = /^\d{3}-?\d{2}-?\d{4}$/;

const tinSchema = (values: Record<string, unknown>): Schema => {
  const tinType = values['company.tinType'];
  return Yup.string()
    .required('Tax ID is required')
    .test('tin-format', 'Enter a valid Tax ID', (value) => {
      if (typeof value !== 'string' || value.length === 0) {
        return false;
      }
      if (tinType === 'SSN') {
        return SSN_PATTERN.test(value);
      }
      if (tinType === 'EIN') {
        return EIN_PATTERN.test(value);
      }
      return false;
    });
};

export const buildPhaseSchema = (
  questions: QuestionDefinition[],
  values: Record<string, unknown>,
): Yup.ObjectSchema<Record<string, unknown>> => {
  const shape: Record<string, Schema> = {};

  questions.forEach((q) => {
    if (!isVisible(q, values)) {
      return;
    }

    if (q.inputType === 'address') {
      shape[q.id] = Yup.string()
        .nullable()
        .test('address-selected', 'Pick an address from the dropdown', addressTest(q));
      return;
    }

    if (q.id === 'company.tin') {
      shape[q.id] = tinSchema(values);
      return;
    }

    shape[q.id] = applyRequired(fieldSchema(q), q);

    (q.subQuestions ?? []).forEach((sub) => {
      if (!isVisible(sub, values)) {
        return;
      }
      shape[sub.id] = applyRequired(fieldSchema(sub), sub);
    });
  });

  return Yup.object().shape(shape) as Yup.ObjectSchema<Record<string, unknown>>;
};
