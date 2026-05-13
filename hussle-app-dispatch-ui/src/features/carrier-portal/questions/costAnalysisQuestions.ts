// [ASSUMED] Preset values reverse-engineered from .planning-legacy/carrier-onboarding/designs/interview-cost-analysis.md
// (RESEARCH.md A1). Confirm with user before phase ships.
// Constants: ASSUMED_MONTHLY_MILES = 8000, MIN_PROFIT_MARGIN = 0.25

import type { PresetOption, QuestionDefinition } from 'components/ConversationalForm/questionSchema';

const PHASE = 4;

const TRUCK_PAYMENT_PRESETS: PresetOption[] = [
  { value: 800, label: '$800' },
  { value: 1200, label: '$1,200' },
  { value: 1500, label: '$1,500' },
  { value: 2000, label: '$2,000' },
];

const INSURANCE_PRESETS: PresetOption[] = [
  { value: 800, label: '$800' },
  { value: 1200, label: '$1,200' },
  { value: 1500, label: '$1,500' },
  { value: 2000, label: '$2,000' },
];

const FUEL_PER_GALLON_PRESETS: PresetOption[] = [
  { value: 3.5, label: '$3.50' },
  { value: 3.75, label: '$3.75' },
  { value: 4.0, label: '$4.00' },
  { value: 4.25, label: '$4.25' },
];

const MPG_PRESETS: PresetOption[] = [
  { value: 5.5, label: '5.5 MPG' },
  { value: 6.0, label: '6.0 MPG' },
  { value: 6.5, label: '6.5 MPG' },
  { value: 7.0, label: '7.0 MPG' },
];

const MAINTENANCE_PRESETS: PresetOption[] = [
  { value: 300, label: '$300' },
  { value: 500, label: '$500' },
  { value: 800, label: '$800' },
  { value: 1200, label: '$1,200' },
];

const OTHER_COSTS_PRESETS: PresetOption[] = [
  { value: 100, label: '$100' },
  { value: 250, label: '$250' },
  { value: 500, label: '$500' },
];

export const costAnalysisQuestions: QuestionDefinition[] = [
  {
    id: 'costAnalysis.truckPayment',
    phase: PHASE,
    inputType: 'presetTiles',
    label: "What's your monthly truck payment?",
    presets: TRUCK_PAYMENT_PRESETS,
    required: true,
    subQuestions: [
      {
        id: 'costAnalysis.ownsOutright',
        label: 'I own it outright',
        inputType: 'yesNo',
        borderColor: 'green',
        // When true, CostResultCard treats costAnalysis.truckPayment as $0.
      },
    ],
  },
  {
    id: 'costAnalysis.insuranceCost',
    phase: PHASE,
    inputType: 'presetTiles',
    label: "What's your monthly insurance cost?",
    hint: 'Pre-populated from Equipment phase if entered there.',
    presets: INSURANCE_PRESETS,
    required: true,
  },
  {
    id: 'costAnalysis.fuelCostPerGallon',
    phase: PHASE,
    inputType: 'presetTiles',
    label: 'What are you paying for diesel right now?',
    hint: 'Enter the price you see at the pump.',
    presets: FUEL_PER_GALLON_PRESETS,
    required: true,
  },
  {
    id: 'costAnalysis.milesPerGallon',
    phase: PHASE,
    inputType: 'presetTiles',
    label: 'What fuel economy does your truck get?',
    presets: MPG_PRESETS,
    required: true,
  },
  {
    id: 'costAnalysis.maintenanceMonthlyCost',
    phase: PHASE,
    inputType: 'presetTiles',
    label: 'How much do you budget for maintenance per month?',
    hint: 'Include tires, repairs, and routine service.',
    presets: MAINTENANCE_PRESETS,
    required: true,
  },
  {
    id: 'costAnalysis.otherMonthlyCosts',
    phase: PHASE,
    inputType: 'presetTiles',
    label: 'Any other monthly costs? (tolls, permits, subscriptions, parking)',
    hint: 'Include anything recurring that comes out of your trucking income.',
    presets: OTHER_COSTS_PRESETS,
    required: false,
  },
];
