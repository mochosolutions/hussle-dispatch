import type { QuestionDefinition } from 'components/ConversationalForm/questionSchema';

const PHASE = 5;

export const lanePreferencesQuestions: QuestionDefinition[] = [
  {
    id: 'lanes.homeBaseCity',
    phase: PHASE,
    inputType: 'text',
    label: 'What city is your home base?',
  },
  {
    id: 'lanes.homeBaseState',
    phase: PHASE,
    inputType: 'text',
    label: 'What state?',
    hint: '2-letter abbreviation',
  },
  {
    id: 'lanes.maxDaysOut',
    phase: PHASE,
    inputType: 'slider',
    label: 'How many days can you be on the road?',
    hint: 'Slide to set maximum days out',
  },
  {
    id: 'lanes.preferredLanes',
    phase: PHASE,
    inputType: 'tagInput',
    label: 'Add preferred lanes (e.g., Dallas to Houston)',
  },
  {
    id: 'lanes.statePreferences',
    phase: PHASE,
    inputType: 'stateGrid',
    label: 'Click states to mark preferred (green) or avoided (red)',
  },
  {
    id: 'lanes.freightPreferences',
    phase: PHASE,
    inputType: 'multiSelect',
    label: 'What freight types do you prefer?',
    options: [
      { value: 'DRY_VAN', label: 'Dry Van' },
      { value: 'REEFER', label: 'Reefer' },
      { value: 'FLATBED', label: 'Flatbed' },
      { value: 'STEP_DECK', label: 'Step Deck' },
      { value: 'POWER_ONLY', label: 'Power Only' },
      { value: 'HOTSHOT', label: 'Hotshot' },
      { value: 'BOX_TRUCK', label: 'Box Truck' },
      { value: 'SPRINTER_VAN', label: 'Sprinter Van' },
    ],
  },
];
