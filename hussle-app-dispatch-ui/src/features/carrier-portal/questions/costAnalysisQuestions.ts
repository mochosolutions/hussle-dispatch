import type { QuestionDefinition } from 'components/ConversationalForm/questionSchema';

const PHASE = 4;

export const costAnalysisQuestions: QuestionDefinition[] = [
  {
    id: 'cost.truckPayment',
    phase: PHASE,
    inputType: 'presetTiles',
    label: 'What is your monthly truck payment?',
    hint: 'Select a preset or enter a custom amount',
  },
  {
    id: 'cost.insuranceCost',
    phase: PHASE,
    inputType: 'presetTiles',
    label: 'Monthly insurance cost?',
  },
  {
    id: 'cost.fuelCostPerGallon',
    phase: PHASE,
    inputType: 'presetTiles',
    label: 'What do you pay per gallon of fuel?',
  },
  {
    id: 'cost.milesPerGallon',
    phase: PHASE,
    inputType: 'presetTiles',
    label: 'What fuel economy does your truck get?',
  },
  {
    id: 'cost.maintenanceMonthlyCost',
    phase: PHASE,
    inputType: 'presetTiles',
    label: 'Monthly maintenance cost?',
  },
  {
    id: 'cost.otherMonthlyCosts',
    phase: PHASE,
    inputType: 'presetTiles',
    label: 'Any other monthly costs?',
  },
];
