import type {
  SaveLanePreferencesInput,
  LanePreferencesSessionPort,
} from '../types/lanePreferencesTypes';

interface PortalLanePreferencesServiceDeps {
  sessionPort: LanePreferencesSessionPort;
}

export const createPortalLanePreferencesService = (deps: PortalLanePreferencesServiceDeps) => ({
  saveLanePreferences: async (
    carrierId: string,
    input: SaveLanePreferencesInput,
  ): Promise<{ saved: boolean }> => {
    const currentAnswers = await deps.sessionPort.getAnswers(carrierId);
    const answers: Record<string, unknown> = currentAnswers ?? {};

    answers.lanePreferences = {
      homeBaseCity: input.homeBaseCity,
      homeBaseState: input.homeBaseState,
      maxDaysOut: input.maxDaysOut,
      preferredLanes: input.preferredLanes,
      statePreferences: input.statePreferences,
      freightPreferences: input.freightPreferences,
    };

    await deps.sessionPort.updateAnswers(carrierId, answers);

    return { saved: true };
  },
});
