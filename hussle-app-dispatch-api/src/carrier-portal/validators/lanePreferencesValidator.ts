import * as Yup from 'yup';

const STATE_PREFERENCES = ['NEUTRAL', 'PREFERRED', 'AVOIDED'] as const;

const FREIGHT_PREFERENCES = [
  'DRY_VAN',
  'REEFER',
  'FLATBED',
  'STEP_DECK',
  'POWER_ONLY',
  'HOTSHOT',
  'BOX_TRUCK',
  'SPRINTER_VAN',
] as const;

const lanePreferenceEntrySchema = Yup.object({
  origin: Yup.string().max(200),
  destination: Yup.string().max(200),
});

const statePreferenceEntrySchema = Yup.object({
  state: Yup.string().length(2).required('state is required'),
  preference: Yup.string()
    .oneOf([...STATE_PREFERENCES], 'preference must be NEUTRAL, PREFERRED, or AVOIDED')
    .required('preference is required'),
});

export const lanePreferencesValidator = Yup.object({
  body: Yup.object({
    homeBaseCity: Yup.string().max(100),
    homeBaseState: Yup.string().length(2),
    maxDaysOut: Yup.number().integer().min(1).max(30),
    preferredLanes: Yup.array().of(lanePreferenceEntrySchema).max(20),
    statePreferences: Yup.array().of(statePreferenceEntrySchema).max(50),
    freightPreferences: Yup.array().of(
      Yup.string()
        .oneOf([...FREIGHT_PREFERENCES], 'Invalid freight preference')
        .required(),
    ),
  }),
});
