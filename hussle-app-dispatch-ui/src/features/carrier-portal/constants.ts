import type { QuestionDefinition } from 'components/ConversationalForm/questionSchema';

import { companyQuestions } from './questions/companyQuestions';
import { documentsQuestions } from './questions/documentsQuestions';
import { driversQuestions } from './questions/driversQuestions';
import { equipmentQuestions } from './questions/equipmentQuestions';

export const PHASE_LABELS = [
  'Company',
  'Equipment',
  'Drivers',
  'Cost Analysis',
  'Lane Preferences',
  'Documents',
] as const;

export const TOTAL_PHASES = PHASE_LABELS.length;

// Phases 4 + 5 are placeholders here. Plan 06 swaps the empty arrays for the real
// `costAnalysisQuestions` and `lanePreferencesQuestions` once Plan 04/05 create them.
// The intermediate state (4/5 = []) is intentional — `PHASE_LABELS` (the part PortalLayout
// needs) is final after this plan; the schema integration is wired in Plan 06.
export const QUESTIONS_BY_PHASE: Record<number, QuestionDefinition[]> = {
  1: companyQuestions,
  2: equipmentQuestions,
  3: driversQuestions,
  4: [], // placeholder — Plan 04 creates costAnalysisQuestions; Plan 06 wires it here
  5: [], // placeholder — Plan 05 creates lanePreferencesQuestions; Plan 06 wires it here
  6: documentsQuestions,
};
