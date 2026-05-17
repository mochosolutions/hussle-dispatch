import type { Schema } from '../engine';
import { welcomePhase } from './welcomePhase';
import { companyPhase } from './companyPhase';
import { equipmentPhase } from './equipmentPhase';
import { driversPhase } from './driversPhase';
import { costAnalysisPhase } from './costAnalysisPhase';
import { lanePreferencesPhase } from './lanePreferencesPhase';
import { signingPhase } from './signingPhase';
import { documentsPhase } from './documentsPhase';
import { completePhase } from './completePhase';

export const onboardingSchema: Schema = {
  version: 1,
  metadata: { name: 'carrier-onboarding-v2', estimatedMinutes: 15 },
  phases: [
    welcomePhase,
    companyPhase,
    equipmentPhase,
    driversPhase,
    costAnalysisPhase,
    lanePreferencesPhase,
    signingPhase,
    documentsPhase,
    completePhase,
  ],
};
