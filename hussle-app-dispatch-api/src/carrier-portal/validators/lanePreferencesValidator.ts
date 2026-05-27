import * as Yup from 'yup';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const FREIGHT_TYPES = [
  'dry_van',
  'reefer',
  'flatbed',
  'step_deck',
  'power_only',
  'containers',
  'hazmat',
  'oversize',
  'auto_haul',
  'tanker',
] as const;
const SCHEDULE_PRESETS = [
  'weekdays',
  'weekdays_flex_fri',
  'long_haul',
  'regional_61',
  'custom',
] as const;

const scheduleShape = Yup.object(
  Object.fromEntries(
    DAY_KEYS.map((day) => [day, Yup.string().oneOf(['on', 'flex', 'off']).required()]),
  ),
);

const fleetSchema = Yup.object({
  lanes: Yup.object().required(),
  schedule: scheduleShape.required(),
  schedulePreset: Yup.string().oneOf([...SCHEDULE_PRESETS]).required(),
  homeBaseCity: Yup.string().nullable().max(100),
  homeBaseState: Yup.string().nullable().length(2),
  maxMilesFromHome: Yup.mixed().notRequired(),
  maxDaysOut: Yup.number().integer().min(1).max(60).notRequired(),
  freightTypes: Yup.object().required(),
});

export const lanePreferencesValidator = Yup.object({
  body: Yup.object({
    fleet: fleetSchema.required('fleet is required'),
    overrides: Yup.object().notRequired(),
  }),
});

export const KNOWN_FREIGHT_TYPES = FREIGHT_TYPES;
