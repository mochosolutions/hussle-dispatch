import type { QuestionDefinition } from 'components/ConversationalForm/questionSchema';

const PHASE = 3;

const hasAdditionalDrivers = (answers: Record<string, unknown>): boolean =>
  answers['drivers.hasAdditional'] === true;

export const driversQuestions: QuestionDefinition[] = [
  {
    id: 'drivers.hasAdditional',
    phase: PHASE,
    inputType: 'yesNo',
    label: 'Do you have additional drivers besides yourself?',
    required: true,
  },
  {
    id: 'drivers.count',
    phase: PHASE,
    inputType: 'number',
    label: 'How many additional drivers?',
    hint: "We'll collect their details next",
    condition: hasAdditionalDrivers,
  },
  {
    id: 'drivers.entries',
    phase: PHASE,
    inputType: 'text',
    label: 'Driver details',
    hint: 'Repeatable driver entry cards will be added here (firstName, lastName, phone, email, payType, payRate)',
    condition: hasAdditionalDrivers,
  },
];
