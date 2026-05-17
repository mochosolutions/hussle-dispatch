import type {
  LanePreferencesWritePort,
  SaveLanePreferencesInput,
} from '../types/lanePreferencesTypes';

interface PortalLanePreferencesServiceDeps {
  writePort: LanePreferencesWritePort;
}

export const createPortalLanePreferencesService = (deps: PortalLanePreferencesServiceDeps) => ({
  saveLanePreferences: async (
    carrierId: string,
    organizationId: string,
    input: SaveLanePreferencesInput,
  ): Promise<{ saved: boolean }> => {
    await deps.writePort.saveTransactional(carrierId, organizationId, input);
    return { saved: true };
  },
});
