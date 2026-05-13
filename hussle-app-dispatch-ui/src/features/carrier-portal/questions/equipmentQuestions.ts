import type { QuestionDefinition } from 'components/ConversationalForm/questionSchema';

const PHASE = 2;

export const equipmentQuestions: QuestionDefinition[] = [
  {
    id: 'equipment.vehicles',
    phase: PHASE,
    inputType: 'vehicleList',
    label: 'Tell us about your vehicles',
    hint: 'Add each vehicle you operate — we use this to verify compliance and calculate rates.',
    required: true,
  },
];
