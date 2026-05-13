import type { QuestionDefinition } from 'components/ConversationalForm/questionSchema';

const PHASE = 5;

export const lanePreferencesQuestions: QuestionDefinition[] = [
  {
    id: 'lanePreferences.statePreferences',
    phase: PHASE,
    inputType: 'stateGrid',
    label: 'Which states do you prefer? Which do you avoid?',
    hint: 'Tap to cycle through neutral, preferred, and avoided.',
    required: false,
  },
];
