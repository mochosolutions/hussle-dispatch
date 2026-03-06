import * as Yup from 'yup';
import type { VehicleType } from '../types';

export const carrierSchema = Yup.object({
  mcNumber: Yup.string().required('MC number is required').min(5, 'Min 5 characters'),
  dotNumber: Yup.string(),
  legalName: Yup.string().required('Legal name is required').min(2, 'Min 2 characters'),
  address: Yup.string(),
  contactName: Yup.string().required('Contact name is required'),
  contactRole: Yup.string(),
  contactPhone: Yup.string().required('Phone is required').min(10, 'Enter a valid phone'),
  contactEmail: Yup.string().email('Invalid email'),
  equipmentTypes: Yup.array().of(Yup.string()).min(1, 'Select at least one'),
  fleetSize: Yup.string(),
  notes: Yup.string(),
});

export interface CarrierFormValues {
  mcNumber: string;
  dotNumber: string;
  legalName: string;
  address: string;
  contactName: string;
  contactRole: string;
  contactPhone: string;
  contactEmail: string;
  equipmentTypes: VehicleType[];
  fleetSize: string;
  notes: string;
}

export const driverSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  phone: Yup.string().required('Phone is required'),
  cdlNumber: Yup.string(),
  cdlClass: Yup.string(),
  cdlExpiry: Yup.string(),
  email: Yup.string().email('Invalid email'),
  assignedVehicleLocalId: Yup.string().nullable(),
});

export const vehicleSchema = Yup.object({
  year: Yup.string().required('Year is required'),
  make: Yup.string().required('Make is required'),
  model: Yup.string(),
  vin: Yup.string(),
  type: Yup.string(),
  licensePlate: Yup.string(),
  assignedDriverLocalId: Yup.string().nullable(),
});

export const companyInfoSchema = Yup.object().shape({
  legalName: Yup.string().required('Legal name is required'),
  mcNumber: Yup.string().required('MC number is required').min(5, 'Min 5 characters'),
  dotNumber: Yup.string(),
  address: Yup.string(),
  contactName: Yup.string().required('Contact name is required'),
  contactPhone: Yup.string().required('Phone is required'),
  contactEmail: Yup.string().email('Invalid email'),
  equipmentTypes: Yup.array().of(Yup.string()).min(1, 'Select at least one'),
});

export const dispatchTermsSchema = Yup.object().shape({
  dispatchFee: Yup.number().required('Required').min(0).max(100),
  partnerSplit: Yup.number().required('Required').min(0).max(100),
  paymentTerms: Yup.string().required('Required'),
  agreementDate: Yup.string(),
});
