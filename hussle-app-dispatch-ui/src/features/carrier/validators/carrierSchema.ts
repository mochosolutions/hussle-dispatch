import * as Yup from 'yup';
import type { InferType } from 'yup';
import type { CarrierType, VehicleType } from '../types';

/**
 * Schema for the full onboarding create-carrier form (CreateCarrierPage).
 */
export const carrierSchema = Yup.object({
  mcNumber: Yup.string().required('MC number is required').min(5, 'Min 5 characters'),
  dotNumber: Yup.string().default(''),
  legalName: Yup.string().required('Legal name is required').min(2, 'Min 2 characters'),
  address: Yup.string().default(''),
  contactName: Yup.string().required('Contact name is required'),
  contactRole: Yup.string().default(''),
  contactPhone: Yup.string().required('Phone is required').min(10, 'Enter a valid phone'),
  contactEmail: Yup.string().email('Invalid email').default(''),
  equipmentTypes: Yup.array()
    .of(
      Yup.mixed<VehicleType>()
        .oneOf(['DRY_VAN', 'REEFER', 'FLATBED', 'STEP_DECK', 'BOX_TRUCK', 'HOTSHOT', 'POWER_ONLY'])
        .required(),
    )
    .required()
    .min(1, 'Select at least one'),
  fleetSize: Yup.string().default(''),
  notes: Yup.string().default(''),
}).required();

export type CarrierFormValues = InferType<typeof carrierSchema>;

/**
 * Schema for the edit/quick-add carrier form (CarrierFormDialog, CreateCarrierForm).
 */
export const carrierEditSchema = Yup.object({
  name: Yup.string().required('Name is required').min(2, 'Min 2 characters'),
  type: Yup.mixed<CarrierType>()
    .oneOf(['COMPANY_ASSET', 'OWNER_OPERATOR', 'EXTERNAL_CARRIER'])
    .required('Type is required'),
  mcNumber: Yup.string(),
  dotNumber: Yup.string(),
  phone: Yup.string(),
  email: Yup.string().email('Invalid email'),
  address: Yup.string(),
  city: Yup.string(),
  state: Yup.string(),
  zip: Yup.string(),
  dispatchFeePercent: Yup.string(),
  partnerSplitPercent: Yup.string(),
  feeIncludesAccessorials: Yup.boolean(),
  dispatchAgreementOnFile: Yup.boolean(),
  insuranceCertOnFile: Yup.boolean(),
  w9OnFile: Yup.boolean(),
  carrierPacketOnFile: Yup.boolean(),
  insuranceExpiry: Yup.date().nullable(),
  notes: Yup.string(),
}).required();

export type CarrierEditFormValues = InferType<typeof carrierEditSchema>;
