import type { Phase } from '../engine';

export const costAnalysisPhase: Phase = {
  id: 'costAnalysis',
  label: 'Cost Analysis',
  steps: [
    {
      id: 'cost-analysis',
      type: 'costAnalysis',
      title: 'What does it cost you to run a truck?',
      subtitle: 'We use this to recommend a minimum profitable rate per mile.',
    },
  ],
};
