import * as Yup from 'yup';

export const STOP_TYPE_OPTIONS = [
  { value: 'PICKUP', label: 'Pickup' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'STOP_OFF', label: 'Stop Off' },
  { value: 'DROP_HOOK', label: 'Drop Hook' },
  { value: 'LIVE_UNLOAD', label: 'Live Unload' },
] as const;

const STOP_TYPES = STOP_TYPE_OPTIONS.map((opt) => opt.value);

export const stopSchema = Yup.object({
  type: Yup.string()
    .oneOf(STOP_TYPES, 'Invalid stop type')
    .required('Stop type is required'),
  facilityName: Yup.string()
    .max(255, 'Facility name must be 255 characters or fewer')
    .required('Facility name is required'),
  address: Yup.string()
    .max(500, 'Address must be 500 characters or fewer')
    .required('Address is required'),
  city: Yup.string()
    .max(100, 'City must be 100 characters or fewer')
    .required('City is required'),
  state: Yup.string()
    .max(50, 'State must be 50 characters or fewer')
    .required('State is required'),
  zip: Yup.string()
    .max(20, 'ZIP must be 20 characters or fewer')
    .required('ZIP is required'),
  appointmentDate: Yup.string().default(''),
  appointmentTime: Yup.string().default(''),
  contactName: Yup.string().max(255, 'Contact name must be 255 characters or fewer').default(''),
  contactPhone: Yup.string().max(50, 'Contact phone must be 50 characters or fewer').default(''),
  notes: Yup.string().max(2000, 'Notes must be 2000 characters or fewer').default(''),
}).required();

export type StopFormValues = Yup.InferType<typeof stopSchema>;

export const EMPTY_STOP_VALUES: StopFormValues = {
  type: 'PICKUP',
  facilityName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  appointmentDate: '',
  appointmentTime: '',
  contactName: '',
  contactPhone: '',
  notes: '',
};
