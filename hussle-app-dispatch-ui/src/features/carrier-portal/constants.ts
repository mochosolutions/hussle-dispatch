import type { QuestionDefinition } from 'components/ConversationalForm/questionSchema';

import { companyQuestions } from './questions/companyQuestions';
import { costAnalysisQuestions } from './questions/costAnalysisQuestions';
import { documentsQuestions } from './questions/documentsQuestions';
import { driversQuestions } from './questions/driversQuestions';
import { equipmentQuestions } from './questions/equipmentQuestions';
import { lanePreferencesQuestions } from './questions/lanePreferencesQuestions';

export const PHASE_LABELS = [
  'Company',
  'Equipment',
  'Drivers',
  'Cost Analysis',
  'Lane Preferences',
  'Documents',
] as const;

export const TOTAL_PHASES = PHASE_LABELS.length;

export const QUESTIONS_BY_PHASE: Record<number, QuestionDefinition[]> = {
  1: companyQuestions,
  2: equipmentQuestions,
  3: driversQuestions,
  4: costAnalysisQuestions,
  5: lanePreferencesQuestions,
  6: documentsQuestions,
};
