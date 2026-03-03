import { CarrierType } from '@prisma/client';
import * as Yup from 'yup';

const carrierTypeValues = Object.values(CarrierType);

const optionalTrimmed = Yup.string().trim().notRequired();

const createBodySchema = Yup.object({
  name: Yup.string().trim().required('name is required'),
  type: Yup.mixed<CarrierType>()
    .oneOf(carrierTypeValues, 'type must be a valid CarrierType')
    .required('type is required'),
  mcNumber: optionalTrimmed,
  dotNumber: optionalTrimmed,
  ein: optionalTrimmed,
  phone: optionalTrimmed,
  email: Yup.string().trim().email('email must be valid').notRequired(),
  address: optionalTrimmed,
  city: optionalTrimmed,
  state: optionalTrimmed,
  zip: optionalTrimmed,
  dispatchFeePercent: Yup.number().notRequired(),
  partnerSplitPercent: Yup.number().notRequired(),
  feeIncludesAccessorials: Yup.boolean().notRequired(),
  ownerOpPayPercent: Yup.number().notRequired(),
  dispatchAgreementOnFile: Yup.boolean().notRequired(),
  dispatchAgreementSignedAt: Yup.date().notRequired(),
  insuranceCertOnFile: Yup.boolean().notRequired(),
  insuranceExpiry: Yup.date().notRequired(),
  w9OnFile: Yup.boolean().notRequired(),
  carrierPacketOnFile: Yup.boolean().notRequired(),
  onboardingFlowId: optionalTrimmed,
  onboardingStatus: optionalTrimmed,
  authorityStatus: optionalTrimmed,
  status: optionalTrimmed,
  notes: optionalTrimmed,
});

const updateBodySchema = createBodySchema
  .shape({
    name: Yup.string().trim().notRequired(),
    type: Yup.mixed<CarrierType>().oneOf(carrierTypeValues, 'type must be a valid CarrierType'),
  })
  .test('has-any-field', 'At least one field must be provided', (value) => {
    if (value === undefined) {
      return false;
    }
    return Object.keys(value).length > 0;
  });

export const createCarrierValidator = Yup.object({
  body: createBodySchema,
});

export const updateCarrierValidator = Yup.object({
  body: updateBodySchema,
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

export const listCarriersValidator = Yup.object({
  query: Yup.object({
    page: Yup.number().integer().min(1).notRequired(),
    limit: Yup.number().integer().min(1).max(100).notRequired(),
    sort: Yup.string().trim().notRequired(),
    order: Yup.string().oneOf(['asc', 'desc']).notRequired(),
    type: Yup.mixed<CarrierType>().oneOf(carrierTypeValues).notRequired(),
    search: Yup.string().trim().notRequired(),
  }),
});

export const carrierIdParamValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});
