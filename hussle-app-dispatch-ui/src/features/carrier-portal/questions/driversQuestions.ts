import type { QuestionDefinition } from 'components/ConversationalForm/questionSchema';

const PHASE = 3;

export const driversQuestions: QuestionDefinition[] = [
  {
    id: 'drivers.entries',
    phase: PHASE,
    inputType: 'driverList',
    label: 'Drivers',
    hint: 'Add each driver who will run loads for you. Leave empty if you are the only driver.',
  },
];
